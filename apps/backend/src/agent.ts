import { z } from "zod";
import "dotenv/config";
import { tool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, MessagesAnnotation, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { AIMessage, ToolMessage } from "@langchain/core/messages";
import { OPENROUTER_API_KEY } from "./config.js";
import { DEFAULT_OPENROUTER_MODEL } from "./models.js";
import { getSystemPrompt } from "./prompt.js";
import { webSearchTool } from "./webSearch.js";

//Heart of adorable......!
type GeneratedFile = {
  path: string;
  content: string;
};

type AgentResult =
  | {
    success: true;
    files: GeneratedFile[];
    projectName: string;
  }
  | {
    success: false;
    error: string;
  };

//sahayak 
function normalizeFileContent(content: string): string {
  if (typeof content !== "string") return "";
  if (content.includes("\\n")) {
    return content.replace(/\\n/g, "\n").replace(/\\"/g, '"');
  }
  return content;
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}


const fileSchema = z.object({
  path: z.string(),
  content: z.string(),
});

const createTool = tool(
  async ({ files }) => {
    console.log("Tool Invoked: create_app");

    if (!Array.isArray(files)) {
      return { files: [] };
    }

    const normalizedFiles = files.map((f: any) => ({
      path: f.path,
      content: normalizeFileContent(f.content),
    }));

    console.log(`Generated ${normalizedFiles.length} files`);

    return {
      files: normalizedFiles,
    };
  },
  {
    name: "create_app",
    description:
      "Generate or modify project files. ALWAYS call this tool to output code.",
    schema: z.object({
      files: z.array(fileSchema),
    }),
  }
);


// Factory: builds a fresh compiled LangGraph for a given model.
// Used by runProjectStream so each request can use a user-chosen model.
function buildGraph(model: string, apiKey?: string) {
  const resolvedKey = apiKey ?? OPENROUTER_API_KEY;
  if (!resolvedKey) throw new Error("No OpenRouter API key available. Please add your key in Settings.");
  const llm = new ChatOpenAI({
    model,
    apiKey: resolvedKey,
    temperature: 0,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Adorable",
      },
    },
  });

  const llmWithTools = llm.bindTools([createTool, webSearchTool]);

  async function agentNode(state: typeof MessagesAnnotation.State) {
    const response = await llmWithTools.invoke(state.messages);
    return { messages: [response] };
  }

  function shouldContinue(state: typeof MessagesAnnotation.State) {
    const last = state.messages[state.messages.length - 1] as AIMessage;
    if (!last.tool_calls || last.tool_calls.length === 0) return "__end__";
    return "tools";
  }

  const toolNode = new ToolNode([createTool, webSearchTool]);

  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", agentNode)
    .addNode("tools", toolNode)
    .addEdge("__start__", "agent")
    .addConditionalEdges("agent", shouldContinue, { tools: "tools", __end__: END })
    .addEdge("tools", "agent");

  return workflow.compile();
}

export const appGraph = buildGraph(DEFAULT_OPENROUTER_MODEL);

// Build AgentResult from final graph messages (shared

function messagesToResult(messages: typeof MessagesAnnotation.State["messages"]): AgentResult {
  const mergedFiles = new Map<string, GeneratedFile>();
  let projectName: string | undefined;

  for (const msg of messages) {
    if (!(msg instanceof ToolMessage)) continue;

    const content =
      typeof msg.content === "string"
        ? safeJsonParse(msg.content) ?? msg.content
        : msg.content;

    if (!content || typeof content !== "object") continue;

    if (Array.isArray((content as any).files)) {
      for (const file of (content as any).files) {
        if (file?.path && file?.content) {
          mergedFiles.set(file.path, file);
        }
      }
    }

    if (typeof (content as any).projectName === "string") {
      projectName = (content as any).projectName;
    }
  }

  const allFiles = Array.from(mergedFiles.values());

  if (allFiles.length === 0) {
    const last = messages.at(-1);
    return {
      success: false,
      error:
        last instanceof AIMessage
          ? String(last.content)
          : "Agent failed to generate files.",
    };
  }

  const hasApp = allFiles.some((f) => f.path === "src/App.jsx");
  const mainComponent = allFiles.find((f) =>
    f.path.startsWith("src/components/")
  );

  if (!hasApp && mainComponent) {
    const componentName = mainComponent.path
      .split("/")
      .pop()
      ?.replace(/\.\w+$/, "");

    if (componentName) {
      allFiles.push({
        path: "src/App.jsx",
        content: `
import React from "react";
import ${componentName} from "./components/${componentName}";

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <${componentName} />
    </div>
  );
}
        `.trim(),
      });
    }
  }

  if (!projectName && mainComponent) {
    projectName =
      mainComponent.path
        .split("/")
        .pop()
        ?.replace(/\.\w+$/, "")
        ?.replace(/([a-z])([A-Z])/g, "$1 $2") ?? "Untitled Project";
  }

  return {
    success: true,
    files: allFiles,
    projectName: projectName ?? "Untitled Project",
  };
}

//oneshot project generation

export async function runUserRequest(
  userInput: string
): Promise<AgentResult> {
  const systemPrompt = getSystemPrompt();

  const inputs = {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userInput },
    ],
  };

  const finalState = await appGraph.invoke(inputs, {
    recursionLimit: 50,
  });

  return messagesToResult(finalState.messages);
}

//freakin sse 
export async function runAgentStream(
  messages: { role: string; content: string }[],
  onEvent: (event: any) => void
) {
  const stream = await appGraph.stream(
    { messages },
    { recursionLimit: 50 }
  );

  for await (const chunk of stream) {
    for (const state of Object.values(chunk)) {
      const last = state.messages?.at(-1);
      if (!last) continue;

      if (last instanceof AIMessage && typeof last.content === "string") {
        onEvent({
          type: "token",
          content: last.content,
        });
      }

      if (last instanceof ToolMessage) {
        onEvent({
          type: "tool",
          content: last.content,
        });
      }
    }
  }

  onEvent({ type: "done" });
}

//////Project creation with SSE logs (same run as runUserRequest, no extra tool calls)

export async function runProjectStream(
  userInput: string,
  onEvent: (event: { type: string; message?: string; result?: AgentResult }) => void,
  model: string,
  apiKey?: string
): Promise<AgentResult> {
  const systemPrompt = getSystemPrompt();
  const initialMessages = [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: userInput },
  ];

  const graph = buildGraph(model, apiKey);
  console.log(`[runProjectStream] Using model: ${model}`);
  onEvent({ type: "log", message: "Starting LangGraph..." });

  const stream = await graph.stream(
    { messages: initialMessages },
    { recursionLimit: 50 }
  );

  const messages: typeof MessagesAnnotation.State["messages"] = [
    ...initialMessages.map((m) =>
      m.role === "system"
        ? ({ role: "system" as const, content: m.content } as any)
        : ({ role: "user" as const, content: m.content } as any)
    ),
  ];

  for await (const chunk of stream) {
    for (const [nodeName, state] of Object.entries(chunk)) {
      const s = state as { messages?: typeof MessagesAnnotation.State["messages"] };
      if (s.messages?.length) {
        const newMessages = Array.isArray(s.messages) ? s.messages : [s.messages];
        messages.push(...newMessages);

        if (nodeName === "agent") {
          onEvent({ type: "log", message: "LLM thinking..." });
        } else if (nodeName === "tools") {
          const lastAi = [...messages].reverse().find((m) => m instanceof AIMessage) as AIMessage | undefined;
          const toolName = lastAi?.tool_calls?.[0]?.name ?? "tool";
          onEvent({ type: "log", message: `Tool Invoked: ${toolName}` });
          // When create_app returns, emit file count from tool result
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg instanceof ToolMessage && toolName === "create_app") {
            const content = typeof lastMsg.content === "string" ? safeJsonParse(lastMsg.content) : lastMsg.content;
            const files = content && typeof content === "object" && Array.isArray((content as any).files) ? (content as any).files : [];
            if (files.length > 0) {
              onEvent({ type: "log", message: `Generated ${files.length} files` });
            }
          }
        }
      }
    }
  }

  const result = messagesToResult(messages);
  onEvent({ type: "result", result });
  return result;
}
