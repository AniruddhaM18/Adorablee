"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import LogoIcon from "@/components/ui/logo";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { isLoggedIn, isLoading, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      setScrolled(currentScrollY > 40);

      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setHidden(true);
      } else {
        setHidden(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav
      className={`
        fixed top-6 inset-x-0 z-50 flex justify-center
        transition-all duration-300 ease-out
        ${hidden ? "-translate-y-24 opacity-0" : "translate-y-0 opacity-100"}
      `}
    >
      <div
        className={`
          w-[85%] max-w-6xl rounded-xl
          transition-all duration-300
          ${scrolled
            ? "border border-white/10 bg-[#0f1115]/30 backdrop-blur-md shadow-lg shadow-black/40"
            : "border-transparent bg-transparent shadow-none backdrop-blur-0"}
        `}
      >
        <div className="px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1">
            <div className="w-12 h-12 rounded-sm flex items-center justify-center shrink-0">
              <LogoIcon className="text-white" />
            </div>
            <span className="text-2xl font-semibold text-slate-300 text-shadow-black/10 text-shadow-lg">
              Adborable
            </span>
          </Link>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {isLoading ? (
              // Loading state - show nothing or skeleton
              <div className="w-24 h-10 bg-neutral-800/50 rounded-xl animate-pulse" />
            ) : isLoggedIn ? (
              // Logged in - show logout
              <button
                onClick={handleLogout}
                className="bg-neutral-700/70 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-600/60 transition-colors ring-2 ring-inset ring-neutral-600/80 backdrop-blur-md"
              >
                Logout
              </button>
            ) : (
              // Not logged in - show sign in and get started
              <>
                <Link href="/auth/signin" className="hidden md:block">
                  <button className="bg-neutral-700/70 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-600/60 transition-colors ring-2 ring-inset ring-neutral-600/80 backdrop-blur-md">
                    Sign in
                  </button>
                </Link>

                <Link href="/auth/signup">
                  <button className="bg-neutral-700/70 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-600/60 transition-colors ring-2 ring-inset ring-neutral-600/80 backdrop-blur-md">
                    Get Started
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
