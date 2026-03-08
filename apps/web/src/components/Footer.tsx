"use client";
import Image from "next/image";
import logo from "../../public/adlogo.png";
import { FaSquareGithub, FaLinkedin, FaSquareXTwitter } from "react-icons/fa6";
import { SiGmail } from "react-icons/si";
import { SparklesCore } from "./ui/sparkles";
import LogoIcon from "@/components/ui/logo";

export default function Footer() {
  return (
    <footer className="bg-black text-white mt-40 border-t border-t-neutral-800">
      <div className="max-w-7xl mx-auto px-6">

        <div className="flex justify-between pt-20">
   <div className="h-28 w-28 rounded-3xl ring-1 ring-inset ring-neutral-300/10 flex items-center justify-center">
  <LogoIcon className="h-22 w-22 text-neutral-300" />
</div>


          <div className="flex gap-8">
            <a
              href="https://github.com/AniruddhaM18/Adorable/"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-neutral-400 hover:text-neutral-300 transition"
            >
              <FaSquareGithub className="h-12 w-auto" />
            </a>

            <a
              href="mailto:aniruddhamaradwar9@gmail.com"
              className="block text-neutral-400 hover:text-neutral-300 transition"
            >
              <SiGmail className="h-12 w-auto" />
            </a>

            <a
              href="https://www.linkedin.com/in/aniruddha-m18/"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-neutral-400 hover:text-neutral-300 transition"
            >
              <FaLinkedin className="h-12 w-auto" />
            </a>

            <a
              href="https://x.com/Aniruddha18M"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-neutral-400 hover:text-neutral-300 transition"
            >
              <FaSquareXTwitter className="h-12 w-auto" />
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center pt-28 pb-8 relative overflow-hidden">
          <h1 className="text-[22vw] leading-none font-normal text-center text-transparent 
          bg-clip-text bg-linear-to-b from-neutral-600 via-neutral-800 to-zinc-950 relative z-20">
            Adorable
          </h1>

          <div className="relative w-full h-28 -mt-4">
            <div className="absolute inset-x-10 top-0 bg-gradient-to-r from-transparent via-neutral-400 to-transparent h-[2px] w-4/5 blur-sm" />
            <div className="absolute inset-x-10 top-0 bg-gradient-to-r from-transparent via-neutral-400 to-transparent h-px w-4/5" />

            <div className="absolute inset-x-1/4 top-0 bg-gradient-to-r from-transparent via-neutral-500 to-transparent h-[4px] w-2/5 blur-sm" />
            <div className="absolute inset-x-1/4 top-0 bg-gradient-to-r from-transparent via-neutral-500 to-transparent h-px w-2/5" />

            <SparklesCore
              background="transparent"
              minSize={0.35}
              maxSize={0.9}
              particleDensity={900}
              className="w-full h-full"
              particleColor="#E5E5E5"
            />

            <div className="absolute inset-0 bg-black [mask-image:radial-gradient(320px_100px_at_top,transparent_30%,white)]" />
          </div>
        </div>



        <div className="flex justify-between items-center pb-8 text-sm text-neutral-300">
          <span>Adorable by Aniruddha</span>
          <span>© 2026 Adorable. All rights reserved.</span>
        </div>

      </div>
    </footer>
  );
}
