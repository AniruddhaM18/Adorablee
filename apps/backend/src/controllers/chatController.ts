import { Request, Response } from "express";
import { runAgentStream } from "../agent.js";
import { getSystemPrompt } from "../prompt.js";

export async function agentChat(req: Request, res: Response) {
  // Validate payload safely
  let payload: any;

  try {
    if (typeof req.query.payload !== "string") {
      return res.status(400).end();
    }

    payload = JSON.parse(req.query.payload);
  } catch (err) {
    console.error("Invalid payload", err);
    return res.status(400).end();
  }

  const messages = payload?.messages;

  if (!Array.isArray(messages)) {
    return res.status(400).end();
  }

  //  SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  // REQUIRED for Express \\ LEARN ABOUT THIS 
  res.flushHeaders();

  //  Initial ping (important)
  res.write(": connected\n\n");

  const systemMessage = {
    role: "system",
    content: getSystemPrompt(),
  };

  try {
    await runAgentStream(
      [systemMessage, ...messages],
      (event) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    );
  } catch (err) {
    console.error("Agent stream error:", err);
  } finally {
    res.end();
  }
}
