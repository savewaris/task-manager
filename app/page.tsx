"use client";

import { useState, useEffect, useCallback } from "react";
import { TaskInput } from "@/components/TaskInput";
import { TaskList, type TaskWithSubtasks } from "@/components/TaskList";
import { Loader2 } from "lucide-react";
// import type { Task } from "@prisma/client";

export default function Home() {
  const [tasks, setTasks] = useState<TaskWithSubtasks[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("failed to fetch", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <main className="min-h-screen bg-background p-6 md:p-12 font-sans selection:bg-primary/20">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="space-y-2 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
            Task Manager<span className="text-primary">.ai</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Organize your life with intelligent task management.
          </p>
        </header>

        <section>
          <TaskInput onTaskAdded={fetchTasks} />
        </section>

        <section>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
            </div>
          ) : (
            <TaskList tasks={tasks} onTaskUpdate={fetchTasks} />
          )}
        </section>
      </div>
    </main>
  );
}
