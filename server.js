import express from "express";

const app = express();
app.use(express.json({ limit: "1mb" }));

// ---- CORS (IMPORTANT for browser / Expo Web) ----
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, Authorization, Bypass-Tunnel-Reminder, User-Agent"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// ---- Ollama settings ----
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

app.get("/", (req, res) => {
  res.send("OK");
});

app.post("/api/ai-chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages must be an array" });
    }

    // Convert your app messages -> Ollama chat format
    const ollamaMessages = [
      {
        role: "system",
        content:
          "You are a helpful university study assistant inside a student app. Be concise and practical.",
      },
      ...messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content ?? ""),
      })),
    ];

    // Call Ollama (local)
    const r = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: ollamaMessages,
        stream: false,
      }),
    });

    const raw = await r.text();

    if (!r.ok) {
      console.error("Ollama error status:", r.status);
      console.error("Ollama error body:", raw);
      return res.status(500).send(raw);
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return res.status(500).send("Ollama returned non-JSON response.");
    }

    const reply =
      (data?.message?.content ?? "").trim() || "No reply from Ollama.";

    return res.json({ reply });
  } catch (err) {
    console.error("AI error:", err);
    return res.status(500).send("Server error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`AI server running on port ${PORT}`);
  console.log(`Using Ollama at ${OLLAMA_HOST} with model ${OLLAMA_MODEL}`);
});