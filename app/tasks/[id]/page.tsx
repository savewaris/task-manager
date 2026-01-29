import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { notFound } from "next/navigation";
import { ChevronLeft, Calendar, Flag, CheckCircle2, Circle, Lightbulb } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface TaskDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
    const { id } = await params;
    const task = await prisma.task.findUnique({
        where: { id },
    });

    if (!task) {
        notFound();
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "HIGH": return "text-red-500 bg-red-500/10 border-red-500/20";
            case "MEDIUM": return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
            case "LOW": return "text-blue-500 bg-blue-500/10 border-blue-500/20";
            default: return "text-muted-foreground bg-muted/50";
        }
    };

    return (
        <main className="min-h-screen bg-background p-6">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/" className="p-2 rounded-full hover:bg-muted transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-xl font-semibold">Back to Tasks</h1>
                </div>

                {/* Main Task Card */}
                <div className="rounded-3xl border bg-card p-8 shadow-sm space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-start justify-between">
                            <h2 className="text-3xl font-bold tracking-tight">{task.title}</h2>
                            <div className={cn("px-3 py-1 rounded-full text-sm font-medium border", getPriorityColor(task.priority))}>
                                {task.priority}
                            </div>
                        </div>

                        {task.description && (
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                {task.description}
                            </p>
                        )}

                        <div className="flex items-center gap-6 text-sm text-muted-foreground pt-2">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>Due: {task.dueDate ? format(new Date(task.dueDate), "PPP") : "No date"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {task.status === "DONE" ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : (
                                    <Circle className="w-4 h-4" />
                                )}
                                <span>{task.status}</span>
                            </div>
                        </div>
                    </div>

                    {/* AI Suggestion */}
                    {task.aiSuggestion && (
                        <div className="p-4 rounded-xl bg-secondary/50 border border-secondary text-foreground flex gap-4">
                            <Lightbulb className="w-6 h-6 text-yellow-600 dark:text-yellow-400 shrink-0" />
                            <div className="space-y-1">
                                <p className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">AI Suggestion</p>
                                <p className="font-medium">{task.aiSuggestion}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Roadmap / Instructions */}
                {task.roadmap && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold px-2 flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-yellow-500" />
                            Roadmap & Instructions
                        </h3>
                        <div className="p-6 rounded-2xl border bg-card/50 prose prose-sm dark:prose-invert max-w-none">
                            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                                {task.roadmap}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
