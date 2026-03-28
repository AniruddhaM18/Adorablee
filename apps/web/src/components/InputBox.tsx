"use client";

import { Plus, Paperclip, ChevronDown, ArrowUp, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

const MODELS = [
  { label: "Gemini 3.1 Pro (preview)", key: "gemini-3.1-pro" },
  { label: "Gemini 3 Flash (preview)", key: "gemini-3-flash-preview" },
  { label: "Kimi K2.5", key: "kimi-k2.5" },
  { label: "Gemini 2.5 Flash", key: "gemini-2.5-flash" },
  { label: "Claude Sonnet 4.5", key: "claude-sonnet-4.5" },
  { label: "GPT-4o mini", key: "gpt-4o-mini" },
] as const;

const DEFAULT_MODEL = MODELS[0];

type Model = typeof MODELS[number];

export function InputBox() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model>(DEFAULT_MODEL);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSend() {
    if (!prompt.trim() || loading) return;

    const encodedPrompt = encodeURIComponent(prompt.trim());
    const encodedModel = encodeURIComponent(selectedModel.key);
    router.push(`/playground/creating?prompt=${encodedPrompt}&model=${encodedModel}`);
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

          {/* Model selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-300 hover:border-neutral-600 hover:text-neutral-100 transition-colors"
            >
              <span>{selectedModel.label}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 bottom-full mb-2 z-50 w-52 rounded-xl border border-neutral-700 bg-neutral-900 shadow-xl overflow-hidden">
                {MODELS.map((model) => (
                  <button
                    key={model.key}
                    onClick={() => {
                      setSelectedModel(model);
                      setDropdownOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2.5 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100 transition-colors"
                  >
                    <span>{model.label}</span>
                    {selectedModel.key === model.key && (
                      <Check className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

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
