"use client";

import { InputBox } from "@/src/components/InputBox";
import { Navbar } from "@/src/components/Navbar";
import { Leva } from "leva";
import { useState } from "react";
import Footer from "@/src/components/Footer";
import { GL } from "@/src/components/hero/components/gl";
import { Pill } from "@/src/components/hero/pill";
import LandingSection from "@/components/LandingSection";

import ProjectsGrid from "@/components/projectsGrid";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
    const [hovering, setHovering] = useState(false);
    const { isLoggedIn, isLoading } = useAuth();

    return (
        <div className="min-h-screen bg-black relative">
            <Navbar />

            <section className={`relative overflow-hidden ${isLoggedIn ? "min-h-[60vh]" : "h-screen"}`}>
                <div className="absolute inset-0 pointer-events-none z-0">
                    <GL hovering={hovering} />
                </div>

                <div className={`relative z-10 max-w-7xl mx-auto px-8 pt-24 text-center ${isLoggedIn ? "pb-16" : "pb-32"}`}>
                    <div className="max-w-4xl mx-auto">
                        <h1 className={`text-4xl md:text-7xl font-semibold text-white mb-5 ${isLoggedIn ? "mt-[180px]" : "mt-[260px]"}`}>
                            Build something Adorable
                        </h1>
                    </div>

                    <Pill>
                        <p className="text-gray-200 font-light">
                            Generate top-tier landing pages in seconds.
                        </p>
                    </Pill>

                    <div
                        className="flex justify-center"
                        onMouseEnter={() => setHovering(true)}
                        onMouseLeave={() => setHovering(false)}
                    >
                        <InputBox />
                    </div>
                </div>
            </section>

            {/* Show projects if logged in, otherwise show landing content */}
            {isLoading ? (
                // Loading state
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin h-8 w-8 border-2 border-neutral-500 border-t-neutral-200 rounded-full" />
                </div>
            ) : isLoggedIn ? (
                // Logged in: show projects
                <section className="relative z-10 max-w-7xl mx-auto px-8 py-16">
                    <h2 className="text-2xl font-semibold text-white mb-8">Your Projects</h2>
                    <ProjectsGrid />
                </section>
            ) : (
                // Not logged in: show landing content
                <LandingSection />
            )}

            <Footer />
            <Leva hidden />
        </div>
    );
}
