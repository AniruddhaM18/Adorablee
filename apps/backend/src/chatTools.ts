import { tool } from "@langchain/core/tools"
import { z } from "zod"

export const chatTool = tool(
  async ({ message }) => {
    return {
      type: "chat",
      message,
    };
  },
  {
    name: "chat_message",
    description: "Send a chat message to the user",
    schema: z.object({
      message: z.string(),
    }),
  }
);