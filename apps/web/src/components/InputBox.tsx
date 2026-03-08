"use client";

import { Plus, Paperclip, ChevronDown, ArrowUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL!;
if (!backendUrl) {
  throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
}

export function InputBox() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!prompt.trim() || loading) return;

    // Navigate immediately to playground with prompt in query
    const encodedPrompt = encodeURIComponent(prompt.trim());
    router.push(`/playground/creating?prompt=${encodedPrompt}`);
  }

  return (
    <div className="w-160 mt-6 rounded-2xl border border-neutral-800 bg-neutral-950/80 backdrop-blur px-4 py-4 shadow-lg ring ring-neutral-700">
      {/* Input */}
      <div className="flex items-start gap-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the app you want to build…"
          rows={3}
          disabled={loading}
          className="flex-1 resize-none bg-transparent text-neutral-100 placeholder-neutral-500 outline-none disabled:opacity-60"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
      </div>

      {/* Action bar */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900">
            <Plus className="h-5 w-5 text-neutral-400" />
          </button>

          <button className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-300">
            <span>Adore LLM</span>
            <ChevronDown className="h-4 w-4" />
          </button>

          <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900">
            <Paperclip className="h-4 w-4 text-neutral-400" />
          </button>
        </div>

        <button
          onClick={handleSend}
          disabled={loading}
          className="gradient-button flex h-9 w-9 items-center justify-center rounded-lg disabled:opacity-60 cursor-pointer"
        >
          <ArrowUp className="h-5 w-5 text-neutral-300 transition-transform duration-200 hover:rotate-90" />
        </button>
      </div>
    </div>
  );
}
