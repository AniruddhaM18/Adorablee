"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { NEXT_PUBLIC_BACKEND_URL } from "@/config";
import {
    FiUser,
    FiKey,
    FiArrowLeft,
    FiEye,
    FiEyeOff,
    FiCheck,
    FiX,
} from "react-icons/fi";
import { Pill } from "@/src/components/hero/pill";

type Section = "profile" | "apikey";

function ApiKeyStatusBadge({
    keyLoading,
    hasKey,
}: {
    keyLoading: boolean;
    hasKey: boolean;
}) {
    if (keyLoading) {
        return <div className="h-7 w-44 max-w-full bg-neutral-800/80 rounded-md animate-pulse" />;
    }
    if (hasKey) {
        return (
            <Pill className="h-7 px-3 text-xs whitespace-nowrap">
                <span className="text-gray-200 font-light">OpenRouter connected</span>
            </Pill>
        );
    }
    return (
        <Pill className="h-7 px-3 text-xs whitespace-nowrap">
            <span className="text-gray-200 font-light">Free tier · 2 projects</span>
        </Pill>
    );
}

export default function SettingsPage() {
    const { user, isLoggedIn, isLoading } = useAuth();
    const router = useRouter();

    const [apiKey, setApiKey] = useState("");
    const [hasKey, setHasKey] = useState(false);
    const [keyLoading, setKeyLoading] = useState(true);
    const [keySaving, setKeySaving] = useState(false);
    const [keyMsg, setKeyMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [showKey, setShowKey] = useState(false);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [pwdSaving, setPwdSaving] = useState(false);
    const [pwdMsg, setPwdMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const [activeSection, setActiveSection] = useState<Section>("profile");

    useEffect(() => {
        if (!isLoading && !isLoggedIn) {
            router.push("/auth/signin");
        }
    }, [isLoading, isLoggedIn, router]);

    useEffect(() => {
        if (!isLoggedIn) return;
        fetch(`${NEXT_PUBLIC_BACKEND_URL}/auth/api-key`, { credentials: "include" })
            .then((r) => r.json())
            .then((d) => setHasKey(!!d.hasKey))
            .catch(() => { })
            .finally(() => setKeyLoading(false));
    }, [isLoggedIn]);

    const saveApiKey = async () => {
        if (!apiKey.trim()) return;
        setKeySaving(true);
        setKeyMsg(null);
        try {
            const res = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/auth/api-key`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ apiKey: apiKey.trim() }),
            });
            const data = await res.json();
            if (res.ok) {
                setKeyMsg({ type: "success", text: "API key saved successfully." });
                setHasKey(true);
                setApiKey("");
            } else {
                setKeyMsg({ type: "error", text: data.message || "Failed to save key." });
            }
        } catch {
            setKeyMsg({ type: "error", text: "Network error. Please try again." });
        } finally {
            setKeySaving(false);
        }
    };

    const savePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            setPwdMsg({ type: "error", text: "All fields are required." });
            return;
        }
        if (newPassword !== confirmPassword) {
            setPwdMsg({ type: "error", text: "New passwords do not match." });
            return;
        }
        if (newPassword.length < 6) {
            setPwdMsg({ type: "error", text: "New password must be at least 6 characters." });
            return;
        }
        setPwdSaving(true);
        setPwdMsg(null);
        try {
            const res = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/auth/password`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                setPwdMsg({ type: "success", text: "Password updated successfully." });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                setPwdMsg({ type: "error", text: data.message || "Failed to update password." });
            }
        } catch {
            setPwdMsg({ type: "error", text: "Network error. Please try again." });
        } finally {
            setPwdSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-dvh bg-black flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-2 border-neutral-500 border-t-neutral-200 rounded-full" />
            </div>
        );
    }

    if (!isLoggedIn) return null;

    const sidebarItems: { id: Section; label: string; icon: React.ReactNode }[] = [
        { id: "profile", label: "Profile & password", icon: <FiUser size={16} strokeWidth={1.75} /> },
        { id: "apikey", label: "API key", icon: <FiKey size={16} strokeWidth={1.75} /> },
    ];

    const inputClass =
        "w-full bg-neutral-950/50 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600/40 transition-colors";

    return (
        <div className="flex flex-col h-dvh min-h-0 overflow-hidden bg-black text-neutral-100">
            <header className="fixed top-0 inset-x-0 z-50 px-6 py-4 flex items-center border-b border-neutral-900/60 bg-black/70 backdrop-blur-md">
                <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm"
                >
                    <FiArrowLeft size={16} />
                    Back
                </button>
            </header>

            <div className="flex flex-1 min-h-0 overflow-hidden pt-16">
                <div className="flex flex-1 min-h-0 flex-col md:flex-row w-full max-w-6xl mx-auto">
                    <aside className="w-full md:w-60 lg:w-64 shrink-0 border-b md:border-b-0 md:border-r border-neutral-800/80 bg-neutral-950/50 md:bg-neutral-950/35 px-5 py-5 md:py-8 flex flex-col gap-6">
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight text-white">Settings</h1>
                            <p className="text-neutral-500 text-[13px] leading-relaxed mt-1.5">
                                Account and OpenRouter configuration.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-600">
                                OpenRouter
                            </span>
                            <ApiKeyStatusBadge keyLoading={keyLoading} hasKey={hasKey} />
                        </div>

                        <nav className="flex flex-col gap-0.5 md:mt-1" aria-label="Settings sections">
                            {sidebarItems.map((item) => {
                                const active = activeSection === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setActiveSection(item.id)}
                                        className={`relative w-full text-left flex items-center gap-3 rounded-md py-2 pl-3 pr-3 text-[13px] font-medium transition-colors ${active
                                            ? "text-white bg-neutral-800/50"
                                            : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-900/60"
                                            }`}
                                    >
                                        {active && (
                                            <span
                                                className="absolute left-0 top-1/2 -translate-y-1/2 h-[18px] w-[3px] rounded-full bg-white"
                                                aria-hidden
                                            />
                                        )}
                                        <span className={active ? "text-neutral-200" : "text-neutral-600"}>
                                            {item.icon}
                                        </span>
                                        {item.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </aside>

                    <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-6 md:px-10 md:py-8">
                        <div className="max-w-xl">
                            {activeSection === "profile" && (
                                <div className="rounded-md border border-neutral-800/90 bg-neutral-950/40 p-6">
                                    <section>
                                        <h2 className="text-base font-semibold text-white">Profile</h2>
                                        <div className="mt-4">
                                            <label htmlFor="settings-email" className="block text-[13px] text-neutral-500 mb-1.5">
                                                Email
                                            </label>
                                            <div
                                                id="settings-email"
                                                className="rounded-lg border border-neutral-800 bg-neutral-950/60 px-3.5 py-2.5 text-sm text-neutral-300 select-all"
                                            >
                                                {user?.email}
                                            </div>
                                        </div>
                                    </section>

                                    <section className="mt-8 pt-8 border-t border-neutral-800/80">
                                        <h2 className="text-base font-semibold text-white">Password</h2>
                                        <p className="text-[13px] text-neutral-500 mt-1 mb-5">
                                            Use at least 6 characters for your new password.
                                        </p>

                                        <div className="space-y-4">
                                            <div>
                                                <label htmlFor="current-pwd" className="block text-[13px] text-neutral-500 mb-1.5">
                                                    Current password
                                                </label>
                                                <input
                                                    id="current-pwd"
                                                    type="password"
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    className={inputClass}
                                                    placeholder="••••••••"
                                                    autoComplete="current-password"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="new-pwd" className="block text-[13px] text-neutral-500 mb-1.5">
                                                    New password
                                                </label>
                                                <input
                                                    id="new-pwd"
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className={inputClass}
                                                    placeholder="••••••••"
                                                    autoComplete="new-password"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="confirm-pwd" className="block text-[13px] text-neutral-500 mb-1.5">
                                                    Confirm new password
                                                </label>
                                                <input
                                                    id="confirm-pwd"
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className={inputClass}
                                                    placeholder="••••••••"
                                                    autoComplete="new-password"
                                                />
                                            </div>
                                        </div>

                                        {pwdMsg && (
                                            <div
                                                className={`mt-4 flex items-start gap-2.5 px-3.5 py-3 rounded-lg text-sm ${pwdMsg.type === "success"
                                                    ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400/95"
                                                    : "bg-red-500/10 border border-red-500/25 text-red-400/95"
                                                    }`}
                                            >
                                                {pwdMsg.type === "success" ? (
                                                    <FiCheck className="shrink-0 mt-0.5" size={16} />
                                                ) : (
                                                    <FiX className="shrink-0 mt-0.5" size={16} />
                                                )}
                                                <span>{pwdMsg.text}</span>
                                            </div>
                                        )}

                                        <div className="mt-6 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={savePassword}
                                                disabled={pwdSaving}
                                                className="bg-neutral-100 text-neutral-950 px-4 py-2 rounded-md text-sm font-medium hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {pwdSaving ? "Saving…" : "Update password"}
                                            </button>
                                        </div>
                                    </section>
                                </div>
                            )}

                            {activeSection === "apikey" && (
                                <div className="rounded-md border border-neutral-800/90 bg-neutral-950/40 p-6">
                                    <h2 className="text-base font-semibold text-white">OpenRouter API key</h2>
                                    <p className="text-[13px] text-neutral-500 mt-1 leading-relaxed">
                                        Stored encrypted. Used for model calls on your projects.
                                    </p>
                                    <a
                                        href="https://openrouter.ai/keys"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block mt-2 text-[13px] text-neutral-500 hover:text-neutral-300 transition-colors underline underline-offset-2"
                                    >
                                        openrouter.ai/keys
                                    </a>

                                    <div className="mt-5 mb-5">
                                        <ApiKeyStatusBadge keyLoading={keyLoading} hasKey={hasKey} />
                                    </div>

                                    <div>
                                        <label htmlFor="api-key-input" className="block text-[13px] text-neutral-500 mb-1.5">
                                            {hasKey ? "Replace key" : "API key"}
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="api-key-input"
                                                type={showKey ? "text" : "password"}
                                                value={apiKey}
                                                onChange={(e) => setApiKey(e.target.value)}
                                                className={`${inputClass} pr-11 font-mono text-[13px]`}
                                                placeholder="sk-or-v1-…"
                                                autoComplete="off"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowKey((v) => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors p-0.5"
                                                tabIndex={-1}
                                                aria-label={showKey ? "Hide key" : "Show key"}
                                            >
                                                {showKey ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                                            </button>
                                        </div>
                                    </div>

                                    {keyMsg && (
                                        <div
                                            className={`mt-4 flex items-start gap-2.5 px-3.5 py-3 rounded-lg text-sm ${keyMsg.type === "success"
                                                ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-400/95"
                                                : "bg-red-500/10 border border-red-500/25 text-red-400/95"
                                                }`}
                                        >
                                            {keyMsg.type === "success" ? (
                                                <FiCheck className="shrink-0 mt-0.5" size={16} />
                                            ) : (
                                                <FiX className="shrink-0 mt-0.5" size={16} />
                                            )}
                                            <span>{keyMsg.text}</span>
                                        </div>
                                    )}

                                    <div className="mt-6 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={saveApiKey}
                                            disabled={keySaving || !apiKey.trim()}
                                            className="bg-neutral-100 text-neutral-950 px-4 py-2 rounded-md text-sm font-medium hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {keySaving ? "Saving…" : hasKey ? "Replace key" : "Save key"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
