"use client";

import { useState } from "react";
import { Plus, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskInputProps {
    onTaskAdded: () => void;
}

export function TaskInput({ onTaskAdded }: TaskInputProps) {
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<"MANUAL" | "AI">("AI");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        setIsLoading(true);
        try {
            const endpoint = mode === "AI" ? "/api/tasks/generate" : "/api/tasks";
            const body = mode === "AI" ? { text: input } : { title: input };

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setInput("");
                onTaskAdded();
            } else {
                console.error("Error submitting task");
            }
        } catch (error) {
            console.error("Failed to add task", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto mb-8 space-y-4">
            <div className="flex justify-center gap-2">
                <button
                    onClick={() => setMode("MANUAL")}
                    className={cn(
                        "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                        mode === "MANUAL" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Manual
                </button>
                <button
                    onClick={() => setMode("AI")}
                    className={cn(
                        "px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                        mode === "AI" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Assistant
                </button>
            </div>

            <form onSubmit={handleSubmit} className="relative">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={mode === "AI" ? "Describe your task naturally (e.g. 'Pay bill tomorrow urgent')..." : "Enter task title..."}
                        className={cn(
                            "w-full h-14 pl-6 pr-32 rounded-2xl bg-secondary/50 backdrop-blur-sm border border-transparent",
                            "focus:border-primary/50 focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all duration-300",
                            "text-lg placeholder:text-muted-foreground/70"
                        )}
                        disabled={isLoading}
                    />
                    <div className="absolute right-2 flex gap-2">
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className={cn(
                                "h-10 px-4 rounded-xl font-medium transition-all duration-200 flex items-center gap-2",
                                input.trim()
                                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                                    : "bg-muted text-muted-foreground cursor-not-allowed"
                            )}
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : mode === "AI" ? (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    <span>Magic Add</span>
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    <span>Add</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
            {mode === "AI" && (
                <p className="text-center text-xs text-muted-foreground">
                    Powered by Gemini. Tries to extract title, priority, and due date.
                </p>
            )}
        </div>
    );
}
