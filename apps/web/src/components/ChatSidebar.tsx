"use client";

import { FaArrowUp } from "react-icons/fa6";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { NEXT_PUBLIC_BACKEND_URL } from "@/config";
import LogoIcon from "@/components/ui/logo";
import { ScrollArea } from "@/components/ui/scroll-area";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

type ChatSidebarProps = {
  projectId?: string;
  onFilesUpdate?: (files: any) => void;
};

export function ChatSidebar({ projectId, onFilesUpdate }: ChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send() {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: input,
    };

    const assistantMessage: Message = {
      id: Date.now() + 1,
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput("");

    streamAssistantMessage([...messages, userMessage]);
  }

  async function streamAssistantMessage(chatHistory: Message[]) {
    setIsLoading(true);

    // Use edit endpoint if projectId is provided, otherwise use regular chat
    const endpoint = projectId
      ? `${NEXT_PUBLIC_BACKEND_URL}/api/chat/edit/${projectId}`
      : "/api/chat";

    // Build URL with payload
    const payloadParam = encodeURIComponent(
      JSON.stringify({
        messages: chatHistory.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      })
    );

    const url = `${endpoint}?payload=${payloadParam}`;

    try {
      // Use fetch with credentials to send cookies cross-origin
      const response = await fetch(url, {
        method: "GET",
        credentials: "include", // This sends cookies!
        headers: {
          "Accept": "text/event-stream",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No reader available");
      }

      let buffer = "";

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete lines from buffer
        const lines = buffer.split("\n");
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const jsonStr = line.slice(6);
              const data = JSON.parse(jsonStr);
              console.log("SSE event received:", data.type);

              if (data.type === "token") {
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === "assistant") {
                    updated[updated.length - 1] = {
                      ...last,
                      content: last.content + (data.content ?? ""),
                    };
                  }
                  return updated;
                });
              }

              // Handle file updates from edit agent
              if (data.type === "file_update" && onFilesUpdate) {
                console.log("File update:", data.file);
              }

              // Handle version created - full files update
              if (data.type === "version_created" && onFilesUpdate) {
                console.log("Version created! Files:", Object.keys(data.files));
                onFilesUpdate(data.files);
              }

              if (data.type === "done") {
                setIsLoading(false);
                // If edit agent made changes but sent no chat message, show a default
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === "assistant" && !last.content?.trim()) {
                    updated[updated.length - 1] = {
                      ...last,
                      content: "I've applied your changes.",
                    };
                  }
                  return updated;
                });
              }

              if (data.type === "error") {
                setIsLoading(false);
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last?.role === "assistant") {
                    updated[updated.length - 1] = {
                      ...last,
                      content: data.message || "An error occurred.",
                    };
                  }
                  return updated;
                });
              }
            } catch (e) {
              // Log JSON parse errors for debugging
              console.error("SSE parse error:", e, "Line:", line.slice(0, 100));
            }
          }
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Stream error:", error);
      setIsLoading(false);
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === "assistant") {
          updated[updated.length - 1] = {
            ...last,
            content: "Failed to connect. Please try again.",
          };
        }
        return updated;
      });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="fixed left-0 top-0 h-screen w-[380px] flex flex-col z-50 bg-[#0d0d0f] border-r border-white/[0.06] shadow-[4px_0_24px_-4px_rgba(0,0,0,0.4)]">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 h-14 px-4 border-b border-white/[0.06]">
        <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.06] hover:bg-white/[0.08] transition-colors">
          <LogoIcon className="h-5 w-5 text-neutral-300" />
        </Link>
        <div>
          <h1 className="text-[15px] font-semibold text-white tracking-tight">Adorable Chat</h1>
          <p className="text-[11px] text-neutral-500 font-medium">Describe what you want to build</p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 pb-2 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                <LogoIcon className="size-7 text-neutral-400" aria-hidden />
              </div>
              <p className="text-sm font-medium text-neutral-400 mb-1">Start a conversation</p>
              <p className="text-[13px] text-neutral-500 leading-relaxed max-w-[260px]">
                Describe what you&apos;re trying to build and Adorable will help you create it.
              </p>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[92%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "grad-blue text-white shadow-lg shadow-blue-500/10"
                    : "bg-white/[0.05] border border-white/[0.06] text-neutral-200"
                }`}
              >
                {m.content || (
                  <span className="inline-flex gap-1 text-neutral-400">
                    <span className="animate-pulse">·</span>
                    <span className="animate-pulse" style={{ animationDelay: "0.15s" }}>·</span>
                    <span className="animate-pulse" style={{ animationDelay: "0.3s" }}>·</span>
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="shrink-0 p-3 pt-2 border-t border-white/[0.06] bg-[#0d0d0f]">
        <div className="relative flex items-end gap-2 rounded-2xl bg-white/[0.04] border border-white/[0.08] p-2 shadow-inner focus-within:border-white/[0.12] focus-within:ring-1 focus-within:ring-white/5 transition-all duration-200">
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Adorable…"
            className="min-h-[44px] w-full resize-none bg-transparent px-3 py-2.5 text-[14px] text-white placeholder:text-neutral-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={send}
            disabled={!input.trim() || isLoading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl grad-blue text-white shadow-md disabled:opacity-40 disabled:pointer-events-none hover:opacity-95 active:scale-[0.98] transition-all duration-150"
          >
            <FaArrowUp size={16} className="shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
