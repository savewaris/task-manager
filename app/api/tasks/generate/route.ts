import { NextResponse } from "next/server";
import { geminiModel } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const { text, timezone = "UTC" } = await request.json();

        if (!text) {
            return NextResponse.json(
                { error: "Content is required" },
                { status: 400 }
            );
        }

        // 1. Fetch Existing Context
        const existingTasks = await prisma.task.findMany({
            where: { status: { not: "DONE" } },
            select: { id: true, title: true, description: true },
        });

        const contextString = existingTasks.map(t => `- [${t.id}] ${t.title}: ${t.description || ""}`).join("\n");

        const prompt = `
      Current Time: ${new Date().toISOString()} (User Timezone: ${timezone})
      
      EXISTING TASKS:
      ${contextString}

      USER INPUT: "${text}"

      Task: Analyze the user input. Does it refer to modifying/adding to an existing task, or creating a new one?
      
      Return ONLY a JSON object.

      Scenario A: UPDATE Existing Task
      If input relates to an existing task (e.g. "update roadmap for..."), return:
      {
        "action": "UPDATE",
        "matchedTaskId": "UUID_FROM_EXISTING_TASKS",
        "roadmap": "Markdown formatted step-by-step guide...",
        "suggestion": "Updated tip (optional)"
      }

      Scenario B: CREATE New Task
      If input is unrelated, return:
      {
        "action": "CREATE",
        "title": "Main task title",
        "description": "Main task summary",
        "priority": "LOW" | "MEDIUM" | "HIGH",
        "dueDate": "ISO 8601 Date string or null",
        "suggestion": "Brief, actionable tip (max 20 words)",
        "roadmap": "Detailed step-by-step instructions in Markdown. Use headers, bullet points, and code blocks if needed."
      }
    `;

        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();

        const cleanedJson = textResponse.replace(/^```json\s*/, "").replace(/\s*```$/, "");

        let aiData;
        try {
            aiData = JSON.parse(cleanedJson);
        } catch (parseError) {
            console.error("AI returned invalid JSON:", textResponse);
            return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
        }

        // 2. Handle Logic based on Action
        if (aiData.action === "UPDATE" && aiData.matchedTaskId) {
            // Check if task exists (sanity check)
            const targetTask = existingTasks.find(t => t.id === aiData.matchedTaskId);
            if (!targetTask) {
                return NextResponse.json({ error: "AI Matched non-existent task" }, { status: 422 });
            }

            const updatedTask = await prisma.task.update({
                where: { id: aiData.matchedTaskId },
                data: {
                    ...(aiData.suggestion && { aiSuggestion: aiData.suggestion }),
                    ...(aiData.roadmap && { roadmap: aiData.roadmap })
                },
            });
            return NextResponse.json(updatedTask);

        } else {
            // Default to CREATE
            const task = await prisma.task.create({
                data: {
                    title: aiData.title,
                    description: aiData.description,
                    priority: aiData.priority || "MEDIUM",
                    dueDate: aiData.dueDate ? new Date(aiData.dueDate) : null,
                    status: "TODO",
                    aiSuggestion: aiData.suggestion,
                    roadmap: aiData.roadmap
                },
            });
            return NextResponse.json(task);
        }

    } catch (error) {
        console.error("Error generating task:", error);
        return NextResponse.json(
            { error: "Failed to generate task" },
            { status: 500 }
        );
    }
}
