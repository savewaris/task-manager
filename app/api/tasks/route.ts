import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET: Fetch all tasks
export async function GET() {
    try {
        const tasks = await prisma.task.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(tasks);
    } catch (error) {
        console.error("Error fetching tasks:", error);

        // Log basic connection info for debugging
        console.error("Database Connection Status:", process.env.DATABASE_URL ? "URL Present" : "URL Missing");

        return NextResponse.json(
            { error: "Failed to fetch tasks" },
            { status: 500 }
        );
    }
}

// POST: Create a new task (Manual)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, description, priority, dueDate } = body;

        if (!title) {
            return NextResponse.json(
                { error: "Title is required" },
                { status: 400 }
            );
        }

        const task = await prisma.task.create({
            data: {
                title,
                description,
                priority: priority || "MEDIUM",
                dueDate: dueDate ? new Date(dueDate) : null,
            },
        });

        return NextResponse.json(task, { status: 201 });
    } catch (error) {
        console.error("Error creating task:", error);
        return NextResponse.json(
            { error: "Failed to create task" },
            { status: 500 }
        );
    }
}

// PUT: Update a task (e.g. toggle status)
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, status, isCompleted } = body;

        // Allow simplified "isCompleted" toggle for frontend convenience
        let newStatus = status;
        if (isCompleted !== undefined) {
            newStatus = isCompleted ? "DONE" : "TODO";
        }

        const task = await prisma.task.update({
            where: { id },
            data: { status: newStatus },
        });
        return NextResponse.json(task);
    } catch (error) {
        console.error("Error updating task:", error);
        return NextResponse.json(
            { error: "Failed to update task" },
            { status: 500 }
        );
    }
}

// DELETE: Remove a task
export async function DELETE(request: Request) {
    try {
        // We expect ID from search params for cleaner DELETE requests usually, 
        // but let's parse body or params. Standardizing on URL params is better for DELETE.
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: "Task ID is required" },
                { status: 400 }
            );
        }

        await prisma.task.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting task:", error);
        return NextResponse.json(
            { error: "Failed to delete task" },
            { status: 500 }
        );
    }
}
