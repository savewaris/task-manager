"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Trash2, Calendar, Flag, ChevronRight, ChevronDown, Filter, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { formatDistanceToNow } from "date-fns";

export interface Task {
    id: string;
    title: string;
    description: string | null;
    status: "TODO" | "IN_PROGRESS" | "DONE";
    priority: "LOW" | "MEDIUM" | "HIGH";
    dueDate: Date | string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    parentId: string | null;
    aiSuggestion: string | null;
}

export interface TaskWithSubtasks extends Task {
    subtasks?: TaskWithSubtasks[];
}

interface TaskListProps {
    tasks: TaskWithSubtasks[];
    onTaskUpdate: () => void;
}

export function TaskList({ tasks, onTaskUpdate }: TaskListProps) {
    const [optimisticTasks, setOptimisticTasks] = useState<TaskWithSubtasks[]>(tasks);
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
    const [priorityFilter, setPriorityFilter] = useState<"ALL" | "HIGH" | "MEDIUM" | "LOW">("ALL");

    useEffect(() => {
        setOptimisticTasks(tasks);
    }, [tasks]);

    const toggleExpand = (taskId: string) => {
        setExpandedTasks(prev => {
            const next = new Set(prev);
            if (next.has(taskId)) next.delete(taskId);
            else next.add(taskId);
            return next;
        });
    };

    const toggleTask = async (task: Task) => {
        // Optimistic update
        const newStatus = task.status === "DONE" ? "TODO" : "DONE";

        // Helper to update recursively
        const updateRecursive = (list: TaskWithSubtasks[]): TaskWithSubtasks[] => {
            return list.map(t => {
                if (t.id === task.id) return { ...t, status: newStatus };
                if (t.subtasks) return { ...t, subtasks: updateRecursive(t.subtasks) };
                return t;
            });
        };

        setOptimisticTasks((prev) => updateRecursive(prev));

        try {
            await fetch("/api/tasks", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: task.id, status: newStatus }),
            });
            onTaskUpdate();
        } catch (error) {
            console.error("Failed to update task", error);
            onTaskUpdate();
        }
    };

    const deleteTask = async (id: String) => {
        // Helper to delete recursively
        const deleteRecursive = (list: TaskWithSubtasks[]): TaskWithSubtasks[] => {
            return list.filter(t => t.id !== id).map(t => ({
                ...t,
                subtasks: t.subtasks ? deleteRecursive(t.subtasks) : undefined
            }));
        };

        setOptimisticTasks((prev) => deleteRecursive(prev));
        try {
            await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
            onTaskUpdate();
        } catch (error) {
            console.error("Failed to delete task", error);
            onTaskUpdate();
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "HIGH": return "text-red-500 bg-red-500/10 border-red-500/20";
            case "MEDIUM": return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
            case "LOW": return "text-blue-500 bg-blue-500/10 border-blue-500/20";
            default: return "text-muted-foreground bg-muted/50";
        }
    };

    // Filter Logic:
    // 1. Only show top-level tasks (parentId === null) in the main list
    // 2. Apply priority filter
    const filteredTasks = optimisticTasks.filter(task => {
        const isTopLevel = !task.parentId;
        const matchesPriority = priorityFilter === "ALL" || task.priority === priorityFilter;
        return isTopLevel && matchesPriority;
    });

    if (tasks.length === 0) {
        return (
            <div className="text-center py-20 text-muted-foreground">
                <p className="text-lg">No tasks yet. Add one above!</p>
            </div>
        );
    }

    const renderTask = (task: TaskWithSubtasks, isSubtask = false) => {
        const hasSubtasks = task.subtasks && task.subtasks.length > 0;
        const isExpanded = expandedTasks.has(task.id);

        return (
            <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                layout
                className={cn(
                    "group relative overflow-hidden transition-all",
                    !isSubtask ? "rounded-2xl border bg-card p-4 hover:shadow-lg hover:border-primary/20 mb-3" : "pl-4 ml-8 border-l-2 border-muted py-2"
                )}
            >
                <div className="flex items-start gap-4">
                    {/* Expand Toggle for Parent Tasks */}
                    {!isSubtask && (
                        <button
                            onClick={() => toggleExpand(task.id)}
                            className={cn(
                                "mt-1.5 -mr-2 text-muted-foreground transition-transform hover:text-foreground",
                                !hasSubtasks && "opacity-0 pointer-events-none"
                            )}
                        >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                    )}

                    <button
                        onClick={() => toggleTask(task)}
                        className={cn(
                            "mt-1 flex shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
                            isSubtask ? "h-5 w-5" : "h-6 w-6",
                            task.status === "DONE"
                                ? "border-primary bg-primary text-primary-foreground"
                                    .concat(isSubtask ? "" : " shadow-[0_0_10px_rgba(var(--primary),0.3)]")
                                : "border-muted-foreground/30 hover:border-primary/50"
                        )}
                    >
                        {task.status === "DONE" && <Check className={cn(isSubtask ? "h-3 w-3" : "h-3.5 w-3.5")} />}
                    </button>

                    <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                            <Link href={`/tasks/${task.id}`} className={cn(
                                "font-medium leading-none transition-all duration-300 truncate pr-8 hover:underline hover:text-primary",
                                isSubtask ? "text-base" : "text-lg",
                                task.status === "DONE" && "text-muted-foreground line-through"
                            )}>
                                {task.title}
                            </Link>
                        </div>

                        {task.description && !isSubtask && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                                {task.description}
                            </p>
                        )}

                        {/* AI Suggestion - High Contrast */}
                        {task.aiSuggestion && (
                            <div className="flex items-start gap-2 mt-2 p-3 rounded-md bg-secondary/50 border border-secondary text-foreground">
                                <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                                <p className="text-sm font-medium leading-relaxed">
                                    {task.aiSuggestion}
                                </p>
                            </div>
                        )}

                        <div className="flex items-center gap-3 pt-1">
                            {task.dueDate && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{format(new Date(task.dueDate), "MMM d")}</span>
                                </div>
                            )}
                            <div className={cn("flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border", getPriorityColor(task.priority))}>
                                <Flag className="w-3 h-3" />
                                {task.priority}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => deleteTask(task.id)}
                        className="absolute right-4 top-4 p-2 text-muted-foreground/50 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>


            </motion.div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            {/* Filter Controls */}
            <div className="flex items-center justify-between pb-2 border-b">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Filter className="w-4 h-4" />
                    <span>Filter Priority:</span>
                </div>
                <div className="flex gap-1">
                    {(["ALL", "HIGH", "MEDIUM", "LOW"] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => setPriorityFilter(p)}
                            className={cn(
                                "px-3 py-1.5 text-xs rounded-full transition-all border",
                                priorityFilter === p
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-muted/30 border-transparent hover:bg-muted"
                            )}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="popLayout">
                {filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => renderTask(task))
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-center py-10 text-muted-foreground"
                    >
                        No tasks match this filter.
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
