"use client";

import { useEffect, useState } from "react";

interface LoaderProps {
    statusMessage?: string;
}

const defaultSteps = [
    "Understanding your request...",
    "Generating code...",
    "Setting up preview...",
    "Almost ready...",
];

export default function Loader({ statusMessage }: LoaderProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [dots, setDots] = useState("");

    // Animate dots
    useEffect(() => {
        const interval = setInterval(() => {
            setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
        }, 500);
        return () => clearInterval(interval);
    }, []);

    // Cycle through steps if no statusMessage provided
    useEffect(() => {
        if (!statusMessage) {
            const interval = setInterval(() => {
                setCurrentStep((prev) => (prev + 1) % defaultSteps.length);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [statusMessage]);

    const displayMessage = statusMessage || defaultSteps[currentStep];

    return (
        <div className="h-full w-full min-h-0 m-0 overflow-hidden bg-[#0a0a0a] flex items-center justify-center">
            <div className="w-full max-w-md mx-4">
                <div className="w-full bg-neutral-950/50 p-8 backdrop-blur-sm border border-neutral-700">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-3 h-3 rounded-full bg-neutral-700/80" />
                        <div className="w-3 h-3 rounded-full bg-neutral-800/80" />
                        <div className="w-3 h-3 rounded-full bg-neutral-900/90" />
                        <div className="w-3 h-3 rounded-full bg-neutral-900/60" />
                    </div>

                    <div className="space-y-6">
                        <div className="flex justify-center">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-neutral-700 to-zinc-900 animate-pulse" />
                                <div className="absolute inset-0 w-16 h-16 rounded-full bg-gradient-to-tr from-neutral-500 to-neutral-600 animate-ping opacity-30" />
                            </div>
                        </div>

                        <div className="text-center">
                            <h3 className="text-lg font-medium text-white mb-2">
                                Building Your Project
                            </h3>
                            <p className="text-neutral-400 text-sm min-h-[20px]">
                                {displayMessage}{dots}
                            </p>
                        </div>

                        <div className="h-1 bg-neutral-700 rounded-lg overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-neutral-500 to-gray-600 rounded-full animate-progress"
                                style={{
                                    animation: "progress 2s ease-in-out infinite",
                                }}
                            />
                        </div>

                        <div className="flex justify-center gap-2">
                            {defaultSteps.map((_, index) => (
                                <div
                                    key={index}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${index <= currentStep || statusMessage
                                            ? "bg-zinc-300"
                                            : "bg-neutral-600"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes progress {
          0% {
            width: 0%;
          }
          50% {
            width: 70%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
        </div>
    );
}