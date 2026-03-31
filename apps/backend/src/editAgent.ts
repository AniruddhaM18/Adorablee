import { z } from "zod";
import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, MessagesAnnotation, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import {
    AIMessage,
    ToolMessage,
    isToolMessage,
} from "@langchain/core/messages";
import { getOpenRouterHttpReferer, OPENROUTER_API_KEY } from "./config.js";
import { DEFAULT_OPENROUTER_MODEL } from "./models.js";
import { getEditSystemPrompt, getErrorFixPrompt } from "./prompt.js";
import { modifyTool, FileChange } from "./modifyTools.js";
import { chatTool } from "./chatTools.js";
import { webSearchTool } from "./webSearch.js";

type EditAgentResult =
    | {
        success: true;
        files: FileChange[];
        message?: string;
    }
    | {
        success: false;
        error: string;
    };

const editToolNode = new ToolNode([modifyTool, chatTool, webSearchTool]);

function shouldContinue(state: typeof MessagesAnnotation.State) {
    const last = state.messages[state.messages.length - 1] as AIMessage;

    if (!last.tool_calls || last.tool_calls.length === 0) {
        return "__end__";
    }

    return "tools";
}

export function buildEditGraph(model: string, apiKey: string) {
    if (!apiKey) {
        throw new Error("No OpenRouter API key available. Please add your key in Settings.");
    }
    const llm = new ChatOpenAI({
        model,
        apiKey,
        temperature: 0,
        configuration: {
            baseURL: "https://openrouter.ai/api/v1",
            defaultHeaders: {
                "HTTP-Referer": getOpenRouterHttpReferer(),
                "X-Title": "Adorable",
            },
        },
    });

    const editLlmWithTools = llm.bindTools([modifyTool, chatTool, webSearchTool]);

    async function editAgentNode(state: typeof MessagesAnnotation.State) {
        const response = await editLlmWithTools.invoke(state.messages);
        return { messages: [response] };
    }

    const editWorkflow = new StateGraph(MessagesAnnotation)
        .addNode("agent", editAgentNode)
        .addNode("tools", editToolNode)
        .addEdge("__start__", "agent")
        .addConditionalEdges("agent", shouldContinue, {
            tools: "tools",
            __end__: END,
        })
        .addEdge("tools", "agent");

    return editWorkflow.compile();
}

function safeJsonParse(value: string) {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function parseToolPayload(content: unknown): unknown {
    if (typeof content === "string") {
        return safeJsonParse(content) ?? content;
    }
    return content;
}

/** Process every ToolMessage in a chunk (deduped by tool_call_id across the whole stream). */
function processToolMessagesInChunk(
    messages: unknown[] | undefined,
    seenToolCallIds: Set<string>,
    collectedFiles: FileChange[],
    onEvent: (event: any) => void,
    options: { fileEventType: "file_update" | "file_fix"; logPrefix: string }
) {
    if (!Array.isArray(messages)) return;

    for (const msg of messages) {
        if (!isToolMessage(msg)) continue;

        const toolCallId = msg.tool_call_id ?? "";
        if (seenToolCallIds.has(toolCallId)) continue;
        seenToolCallIds.add(toolCallId);

        console.log(`${options.logPrefix}: Got ToolMessage (tool_call_id=${toolCallId}, name=${msg.name ?? "?"})`);

        const content = parseToolPayload(msg.content);

        if (content && typeof content === "object") {
            const files = (content as { files?: unknown }).files;
            if (Array.isArray(files)) {
                console.log(
                    `${options.logPrefix}: Found ${files.length} files in tool result (name=${msg.name ?? "?"})`
                );
                let added = 0;
                for (const file of files) {
                    if (file && typeof file === "object" && (file as { path?: string }).path) {
                        collectedFiles.push(file as FileChange);
                        added++;
                        onEvent({
                            type: options.fileEventType,
                            file,
                        });
                    }
                }
                if (added > 0 && msg.name === "modify_app") {
                    console.log(
                        `${options.logPrefix}: collected ${added} file(s) from modify_app`
                    );
                }
            }

            const c = content as { type?: string; message?: string };
            if (c.type === "chat" && c.message) {
                onEvent({
                    type: "token",
                    content: c.message,
                });
            }
        }

        onEvent({
            type: "tool",
            content: msg.content,
        });
    }
}

function emitAssistantTokensFromChunk(messages: unknown[] | undefined, onEvent: (event: any) => void) {
    const last = messages?.at(-1);
    if (!(last instanceof AIMessage)) return;
    if (typeof last.content !== "string" || !last.content) return;
    // Rely on chat_message for summary when the model is invoking tools (avoids duplicate prose).
    if (last.tool_calls && last.tool_calls.length > 0) return;
    onEvent({
        type: "token",
        content: last.content,
    });
}

export async function runEditAgentStream(
    currentFiles: Record<string, string>,
    userMessage: string,
    chatHistory: { role: string; content: string }[],
    onEvent: (event: any) => void,
    openRouterModel: string,
    apiKey: string
) {
    console.log("runEditAgentStream: Starting...");
    const editGraph = buildEditGraph(openRouterModel, apiKey);
    const systemPrompt = getEditSystemPrompt(currentFiles);

    const messages = [
        { role: "system", content: systemPrompt },
        ...chatHistory,
        { role: "user", content: userMessage },
    ];

    const stream = await editGraph.stream({ messages }, { recursionLimit: 50 });

    const collectedFiles: FileChange[] = [];
    const seenToolCallIds = new Set<string>();

    try {
        for await (const chunk of stream) {
            console.log("runEditAgentStream: Processing chunk...");
            for (const state of Object.values(chunk)) {
                const msgs = (state as { messages?: unknown[] }).messages;
                processToolMessagesInChunk(msgs, seenToolCallIds, collectedFiles, onEvent, {
                    fileEventType: "file_update",
                    logPrefix: "runEditAgentStream",
                });
                emitAssistantTokensFromChunk(msgs, onEvent);
            }
        }

        onEvent({
            type: "done",
            files: collectedFiles,
        });

        console.log(`EditAgent finished. Collected ${collectedFiles.length} files:`, collectedFiles.map(f => f.path));

        return collectedFiles;
    } catch (error) {
        console.error("runEditAgentStream error:", error);
        onEvent({
            type: "error",
            message: "Failed to process edit request",
        });
        return [];
    }
}

export async function runEditRequest(
    currentFiles: Record<string, string>,
    userMessage: string
): Promise<EditAgentResult> {
    const key = OPENROUTER_API_KEY;
    if (!key) {
        return {
            success: false,
            error: "No OpenRouter API key configured.",
        };
    }
    const editGraph = buildEditGraph(DEFAULT_OPENROUTER_MODEL, key);
    const systemPrompt = getEditSystemPrompt(currentFiles);

    const inputs = {
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
        ],
    };

    const finalState = await editGraph.invoke(inputs, {
        recursionLimit: 50,
    });

    const collectedFiles: FileChange[] = [];

    for (const msg of finalState.messages) {
        if (!(msg instanceof ToolMessage)) continue;

        const content =
            typeof msg.content === "string"
                ? safeJsonParse(msg.content) ?? msg.content
                : msg.content;

        if (!content || typeof content !== "object") continue;

        if (Array.isArray((content as any).files)) {
            for (const file of (content as any).files) {
                if (file?.path) {
                    collectedFiles.push(file);
                }
            }
        }
    }

    if (collectedFiles.length === 0) {
        const last = finalState.messages.at(-1);
        return {
            success: false,
            error:
                last instanceof AIMessage
                    ? String(last.content)
                    : "Agent failed to generate changes.",
        };
    }

    return {
        success: true,
        files: collectedFiles,
    };
}

export async function runErrorFixStream(
    currentFiles: Record<string, string>,
    buildErrors: string,
    onEvent: (event: any) => void,
    openRouterModel: string,
    apiKey: string
): Promise<FileChange[]> {
    console.log("runErrorFixStream: Starting error fix...");
    const editGraph = buildEditGraph(openRouterModel, apiKey);
    const systemPrompt = getErrorFixPrompt(currentFiles, buildErrors);

    const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Please fix the build errors shown above." },
    ];

    const stream = await editGraph.stream({ messages }, { recursionLimit: 50 });

    const collectedFiles: FileChange[] = [];
    const seenToolCallIds = new Set<string>();

    try {
        for await (const chunk of stream) {
            console.log("runErrorFixStream: Processing chunk...");
            for (const state of Object.values(chunk)) {
                const msgs = (state as { messages?: unknown[] }).messages;
                processToolMessagesInChunk(msgs, seenToolCallIds, collectedFiles, onEvent, {
                    fileEventType: "file_fix",
                    logPrefix: "runErrorFixStream",
                });
                emitAssistantTokensFromChunk(msgs, onEvent);
            }
        }

        onEvent({
            type: "fix_done",
            files: collectedFiles,
        });

        console.log(`ErrorFixAgent finished. Collected ${collectedFiles.length} fixed files:`, collectedFiles.map(f => f.path));

        return collectedFiles;
    } catch (error) {
        console.error("runErrorFixStream error:", error);
        onEvent({
            type: "error",
            message: "Failed to fix build errors",
        });
        return [];
    }
}
