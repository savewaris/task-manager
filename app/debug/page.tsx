import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function DebugPage() {
    const dbUrl = process.env.DATABASE_URL;
    const geminiKey = process.env.GEMINI_API_KEY;

    let dbStatus = "Unknown";
    let dbError = null;

    try {
        // Attempt a minimal query
        await prisma.task.count();
        dbStatus = "Connected ✅";
    } catch (e: any) {
        dbStatus = "Failed ❌";
        dbError = e.message;
    }

    // Safe checks (masking secrets)
    const isDbUrlSet = !!dbUrl;
    const isGeminiSet = !!geminiKey;
    const dbPort = dbUrl?.match(/:(\d+)(\/|\?|$)/)?.[1] || "Unknown";
    const isPooler = dbPort === "6543";

    return (
        <div className="p-10 font-mono space-y-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Environment Debugger</h1>

            <div className="border p-6 rounded-xl bg-card">
                <h2 className="text-xl font-bold mb-4">1. Environment Variables</h2>
                <div className="space-y-2">
                    <p className="flex items-center gap-2">
                        GEMINI_API_KEY:
                        <span className={isGeminiSet ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
                            {isGeminiSet ? "✅ Set" : "❌ Missing"}
                        </span>
                    </p>
                    <p className="flex items-center gap-2">
                        DATABASE_URL:
                        <span className={isDbUrlSet ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
                            {isDbUrlSet ? "✅ Set" : "❌ Missing"}
                        </span>
                    </p>
                </div>
            </div>

            <div className="border p-6 rounded-xl bg-card">
                <h2 className="text-xl font-bold mb-4">2. Database Configuration</h2>
                <div className="space-y-2">
                    <p>
                        <strong>Detected Port:</strong> {dbPort}
                        {isPooler ? <span className="text-green-500 ml-2">(Correct for Vercel)</span> : <span className="text-red-500 ml-2">(WARNING: Should be 6543)</span>}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Note: Vercel requires port 6543 (Transaction Pooler). Direct connection (5432) often fails.
                    </p>
                </div>
            </div>

            <div className="border p-6 rounded-xl bg-card">
                <h2 className="text-xl font-bold mb-4">3. Connection Test</h2>
                <p className="text-lg font-semibold">Status: {dbStatus}</p>
                {dbError && (
                    <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-md overflow-x-auto whitespace-pre-wrap text-sm">
                        {dbError}
                    </div>
                )}
            </div>
        </div>
    );
}
