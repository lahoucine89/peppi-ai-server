import express from "express";

const app = express();
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.get("/", (req, res) => {
  res.json({ status: "OK" });
});

app.post("/api/ai-chat", async (req, res) => {
  try {
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY missing");
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages must be an array" });
    }

    console.log("Incoming messages:", messages.length);

    const openaiResponse = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          input: messages.map((m) => ({
            role: m.role,
            content: [
              {
                type: "input_text",
                text: String(m.content ?? ""),
              },
            ],
          })),
        }),
      }
    );

    const responseText = await openaiResponse.text();

    if (!openaiResponse.ok) {
      console.error("OpenAI error:", responseText);
      return res.status(500).json({
        error: "OpenAI request failed",
        details: responseText,
      });
    }

    const data = JSON.parse(responseText);

    const reply =
      data.output_text ||
      data.output?.[0]?.content?.[0]?.text ||
      "No reply.";

    return res.json({ reply });
  } catch (err) {
    console.error("SERVER CRASH:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});