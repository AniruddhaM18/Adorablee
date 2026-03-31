"use client";

import { ChevronDown, ArrowUp, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { NEXT_PUBLIC_BACKEND_URL } from "@/config";
import { Claude } from "@/components/icons/claude";
import { Gemini } from "@/components/icons/gemini";
import { GPT } from "@/components/icons/gpt";
import { kimi as KimiIcon } from "@/components/icons/kimi";

const MODELS = [
  { label: "Gemini 3.1 Pro (preview)", key: "gemini-3.1-pro" },
  { label: "Gemini 3 Flash (preview)", key: "gemini-3-flash-preview" },
  { label: "Kimi K2.5", key: "kimi-k2.5" },
  { label: "Gemini 2.5 Flash", key: "gemini-2.5-flash" },
  { label: "Claude Sonnet 4.5", key: "claude-sonnet-4.5" },
  { label: "GPT-4o mini", key: "gpt-4o-mini" },
] as const;

const DEFAULT_MODEL = MODELS[0];

type Model = (typeof MODELS)[number];

function isGeminiModel(model: Model) {
  return model.key.startsWith("gemini-");
}

/** Matches AppToaster so corner toasts use the same surface as the rest of the app. */
const THEME_TOAST_CLASSNAMES = {
  toast: "bg-neutral-900 border border-neutral-700 text-neutral-100",
  title: "text-neutral-100",
  description: "text-neutral-400",
  actionButton: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
} as const;

function ModelIcon({ modelKey, className }: { modelKey: string; className: string }) {
  if (modelKey.startsWith("gemini-")) return <Gemini className={className} />;
  if (modelKey.startsWith("kimi-")) return <KimiIcon className={className} />;
  if (modelKey.startsWith("claude-")) return <Claude className={className} />;
  if (modelKey.startsWith("gpt-")) return <GPT className={className} />;
  return <Gemini className={className} />;
}

export function InputBox() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model>(DEFAULT_MODEL);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  /** false = no key or logged out; null = still loading */
  const [hasOwnApiKey, setHasOwnApiKey] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${NEXT_PUBLIC_BACKEND_URL}/auth/api-key`, { credentials: "include" })
      .then((r) => {
        if (r.status === 401) return { hasKey: false };
        return r.json() as Promise<{ hasKey?: boolean }>;
      })
      .then((data) => {
        if (!cancelled) setHasOwnApiKey(!!data.hasKey);
      })
      .catch(() => {
        if (!cancelled) setHasOwnApiKey(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (hasOwnApiKey !== false) return;
    setSelectedModel((current) => (isGeminiModel(current) ? current : DEFAULT_MODEL));
  }, [hasOwnApiKey]);

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

  const freeTierLocked = hasOwnApiKey !== true;

  function onSelectModel(model: Model) {
    if (freeTierLocked && !isGeminiModel(model)) {
      toast("Add your own OpenRouter API key in Settings to use this model.", {
        position: "bottom-right",
        classNames: THEME_TOAST_CLASSNAMES,
        action: {
          label: "Settings",
          onClick: () => router.push("/settings"),
        },
      });
      return;
    }
    setSelectedModel(model);
    setDropdownOpen(false);
  }

  async function handleSend() {
    if (!prompt.trim() || loading) return;
    if (freeTierLocked && !isGeminiModel(selectedModel)) return;

    const encodedPrompt = encodeURIComponent(prompt.trim());
    const encodedModel = encodeURIComponent(selectedModel.key);
    router.push(`/playground/creating?prompt=${encodedPrompt}&model=${encodedModel}`);
  }

  return (
    <div className="relative z-20 w-160 mt-6 rounded-2xl border border-neutral-800 bg-neutral-950/80 backdrop-blur px-4 py-4 shadow-lg ring ring-neutral-700">
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
        <div className="relative z-50 flex items-center gap-2">
          {/* Model selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-300 hover:border-neutral-600 hover:text-neutral-100 transition-colors"
            >
              <ModelIcon modelKey={selectedModel.key} className="h-4 w-4 shrink-0 text-neutral-400" />
              <span>{selectedModel.label}</span>
              <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute left-0 top-full z-[200] mt-2 min-w-[14rem] w-56 rounded-xl border border-neutral-700 bg-neutral-900 shadow-xl overflow-hidden">
                {MODELS.map((model) => {
                  const lockedRow = freeTierLocked && !isGeminiModel(model);
                  return (
                    <button
                      key={model.key}
                      type="button"
                      onClick={() => onSelectModel(model)}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100 transition-colors ${
                        lockedRow ? "opacity-45 cursor-not-allowed" : ""
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <ModelIcon modelKey={model.key} className="h-4 w-4 shrink-0 text-neutral-400" />
                        <span className="truncate text-left">{model.label}</span>
                      </span>
                      {selectedModel.key === model.key && (
                        <Check className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
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
