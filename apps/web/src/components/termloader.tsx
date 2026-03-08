"use client";

import { useEffect, useState } from "react";
import {
  Terminal,
  TypingAnimation,
  AnimatedSpan,
} from "@/components/ui/terminal";

interface LoaderProps {
  statusMessage?: string;
  /** Live log lines from LangGraph SSE (shown in terminal instead of hardcoded steps) */
  logLines?: string[];
}

/* ---------- fallback when no live logs ---------- */
const statusSteps = [
  "Understanding your request",
  "Agent working",
  "Generating code",
  "Preparing preview",
];

const terminalSteps = [
  { text: "Booting build environment", type: "info" },
  { text: "Resolving dependencies", type: "success" },
  { text: "Validating configuration", type: "success" },
  { text: "Compiling application", type: "success" },
  { text: "Optimizing output", type: "success" },
];

export default function TerminalLoader({ statusMessage, logLines }: LoaderProps) {
  const [statusIndex, setStatusIndex] = useState(0);
  const [terminalIndex, setTerminalIndex] = useState(0);
  const [showTerminal, setShowTerminal] = useState(false);
  const [dots, setDots] = useState("");

  const hasLiveLogs = Array.isArray(logLines) && logLines.length > 0;
  const visibleLogLines = hasLiveLogs ? (logLines ?? []).slice(-14) : [];
  const currentStatus = statusMessage ?? (hasLiveLogs ? logLines[logLines.length - 1] : null) ?? statusSteps[statusIndex];

  /* ---------- animated dots ---------- */
  useEffect(() => {
    const i = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(i);
  }, []);

  /* ---------- status loop (only when no live logs and no statusMessage) ---------- */
  useEffect(() => {
    if (!statusMessage && !hasLiveLogs) {
      const i = setInterval(() => {
        setStatusIndex((s) => (s + 1) % statusSteps.length);
      }, 3000);
      return () => clearInterval(i);
    }
  }, [statusMessage, hasLiveLogs]);

  /* ---------- show terminal soon (sooner when we have live logs) ---------- */
  useEffect(() => {
    const delay = hasLiveLogs ? 400 : 3000;
    const t = setTimeout(() => setShowTerminal(true), delay);
    return () => clearTimeout(t);
  }, [hasLiveLogs]);

  /* ---------- terminal step loop (only when no live logs) ---------- */
  useEffect(() => {
    if (!showTerminal || hasLiveLogs) return;
    const i = setInterval(() => {
      setTerminalIndex((s) =>
        s + 1 >= terminalSteps.length ? 0 : s + 1
      );
    }, 2600);
    return () => clearInterval(i);
  }, [showTerminal, hasLiveLogs]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-neutral-950/90 backdrop-blur-sm">
      <div className="w-full max-w-md px-4">
        <div className="border border-neutral-700 bg-neutral-900 shadow-xl">
          
          {/* HEADER */}
          <div className="px-5 pt-4 pb-3 space-y-2">
            <h3 className="text-sm font-medium text-white">
              Building your project
            </h3>

            <p className="text-xs text-neutral-400 min-h-[16px]">
              {currentStatus}
              {!hasLiveLogs && dots}
            </p>

            <div className="h-1 rounded bg-neutral-700 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-neutral-400 to-neutral-200 transition-all duration-700"
                style={{
                  width: hasLiveLogs
                    ? `${Math.min(90, 20 + (logLines?.length ?? 0) * 8)}%`
                    : `${((statusIndex + 1) / statusSteps.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* FAKE TERMINAL BAR */}
          <div className="flex items-center gap-2 px-4 py-1.5 border-y border-neutral-800">
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500/70" />
            <div className="h-2.5 w-2.5 rounded-full bg-blue-700/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-blue-800/50" />
            <span className="ml-2 text-[11px] font-mono text-neutral-400">
              adorable@agent
            </span>
          </div>

          {/* TERMINAL BODY */}
          <div
            className={
              hasLiveLogs
                ? "px-4 py-3 overflow-y-auto max-h-[340px]"
                : "px-4 py-4 min-h-[180px] max-h-[240px] overflow-y-auto"
            }
          >
            {!showTerminal ? (
              <p className="text-xs font-mono text-neutral-500 leading-tight">
                {hasLiveLogs ? "Connecting to agent…" : "Initializing build process…"}
              </p>
            ) : hasLiveLogs && visibleLogLines.length > 0 ? (
              <div className="font-mono text-[13px] text-neutral-200 space-y-0.5 leading-tight">
                <div className="text-neutral-500">&gt; Building project</div>
                {visibleLogLines.map((line, i) => {
                  const trimmed = String(line ?? "").trim();
                  const isFileLine = trimmed.startsWith("→");
                  const isError = /error|failed/i.test(trimmed);
                  const prefix = isFileLine ? "" : isError ? "✖ " : "✔ ";
                  const color = isFileLine
                    ? "text-neutral-300"
                    : isError
                      ? "text-red-400"
                      : "text-sky-400";

                  return (
                    <div key={`${i}-${trimmed}`} className={color}>
                      {prefix}
                      {trimmed}
                    </div>
                  );
                })}
                <div className="text-neutral-400">Working...</div>
              </div>
            ) : (
              <Terminal
                key={terminalIndex}
                className="bg-transparent font-mono text-[13px] leading-relaxed text-neutral-200"
              >
                <TypingAnimation>&gt; pnpm run build</TypingAnimation>

                <AnimatedSpan className="text-neutral-400">
                  node v20.11.0 · pnpm v9.0.0
                </AnimatedSpan>

                {terminalSteps
                  .slice(0, terminalIndex + 1)
                  .map((step, i) => (
                    <AnimatedSpan
                      key={i}
                      className={
                        step.type === "success"
                          ? "text-emerald-400"
                          : "text-sky-400"
                      }
                    >
                      {step.type === "success" ? "✔" : "ℹ"} {step.text}
                    </AnimatedSpan>
                  ))}

                <TypingAnimation className="text-neutral-400">
                  Working...
                </TypingAnimation>
              </Terminal>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
