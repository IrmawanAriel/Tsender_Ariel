"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FaGithub } from "react-icons/fa";
import Image from "next/image";

export default function Header() {
  return (
    <nav className="px-6 md:px-10 py-4 border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center">
      {/* Logo + Title */}
      <div className="flex items-center gap-2 md:gap-4">
        <a href="/" className="flex items-center gap-2 text-zinc-900 hover:opacity-90 transition">
          <Image src="/T-Sender.svg" alt="TSender" width={36} height={36} />
          <h1 className="font-semibold text-xl md:text-2xl tracking-tight hidden sm:block">
            TSender
          </h1>
        </a>
      </div>

      {/* Tagline (center on large screens) */}
      <h3 className="hidden lg:block italic text-sm text-zinc-500 text-center max-w-md">
        The most gas-efficient airdrop contract on earth, built in huff 🐎
      </h3>

      {/* Right side: Github + Wallet Connect */}
      <div className="flex items-center gap-3 md:gap-4">
        <a
          href="https://github.com/cyfrin/TSender"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 transition-colors hidden sm:flex items-center justify-center"
        >
          <FaGithub className="h-5 w-5 text-white" />
        </a>
        <ConnectButton showBalance={false} accountStatus="address" />
      </div>
    </nav>
  );
}
