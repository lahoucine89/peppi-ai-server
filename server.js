import express from "express";

const app = express();
app.use(express.json());

// ✅ Read key from Render Environment Variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.get("/", (req, res) => {
  res.send("OK");
});

app.post("/api/ai-chat", async (req, res) => {
  try {
    if (!OPENAI_API_KEY) {
      console.error("Missing OPENAI_API_KEY in environment variables.");
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const { messages } = req.body;

    console.log("Request received. Messages count:", messages?.length);

    if (!Array.isArray(messages)) {
      return res.status(400).send("messages must be an array");
    }

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: [
              {
                type: "text",
                text:
                  "You are a helpful university study assistant inside a student app. Be concise and practical.",
              },
            ],
          },
          ...messages.map((m) => ({
            role: m.role,
            content: [{ type: "text", text: String(m.content ?? "") }],
          })),
        ],
      }),
    });

    if (!r.ok) {
      const txt = await r.text();
      console.error("OpenAI error status:", r.status);
      console.error("OpenAI error body:", txt);
      return res.status(500).send(txt);
    }

    const data = await r.json();
    const reply = (data?.output_text ?? "").trim() || "No reply.";

    return res.json({ reply });
  } catch (err) {
    console.error("AI error:", err);
    return res.status(500).send("Server error");
  }
});

// ✅ Use Render’s port
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`AI server running on port ${PORT}`);
});