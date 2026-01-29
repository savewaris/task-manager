const apiKey = process.env.GEMINI_API_KEY || "AIzaSyA3ldFFaX2Q1p4fWrTdh4_3j73_ok3cC9Y"; // Fallback to provided key
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function testDirect() {
    console.log("Testing URL:", url.replace(apiKey, "HIDDEN_KEY"));
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        const json = await response.json();
        if (json.models) {
            console.log("ALL_MODELS:", JSON.stringify(json.models.map(m => m.name)));
        } else {
            console.log("Response:", JSON.stringify(json, null, 2));
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

testDirect();
