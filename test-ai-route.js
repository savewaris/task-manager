async function testAI() {
    try {
        const response = await fetch("http://localhost:3000/api/tasks/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                text: "Plan a surprise birthday party for John next Saturday",
                timezone: "UTC"
            })
        });

        console.log("Status:", response.status);
        const text = await response.text();
        try {
            const json = JSON.parse(text);
            console.log("Error Message:", json.error);
        } catch {
            console.log("Response Text:", text);
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

testAI();
