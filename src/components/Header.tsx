"use client";

import { ConnectButton, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { FaGithub } from "react-icons/fa";
import Image from "next/image";

const customTheme = darkTheme({
  accentColor: "#07553B",
  accentColorForeground: "#CED46A",
  borderRadius: "medium",
});

export default function Header() {
  return (
    <RainbowKitProvider theme={customTheme}>
      <nav className="px-6 md:px-10 py-4 border-b border-[#07553B] bg-[#CED46A] backdrop-blur-md sticky top-0 z-50 flex justify-between items-center shadow-lg font-sans">
        {/* Logo + Title */}
        <div className="flex items-center gap-2 md:gap-4">
          <a
            href="/"
            className="flex items-center gap-2 text-[#07553B] hover:opacity-90 transition-transform transform hover:scale-105"
          >
            <Image src="/C-Sender.png" alt="CSender" width={36} height={36} />
            <h1 className="font-bold text-2xl md:text-3xl tracking-tight hidden sm:block">
              C-Sender
            </h1>
          </a>
        </div>

        {/* Tagline (center on large screens) */}
        <h3 className="hidden lg:block italic text-sm text-[#07553B] text-center max-w-md">
          The most gas-efficient airdrop contract on earth, built in huff 🐎
        </h3>

        {/* Right side: Github + Wallet Connect */}
        <div className="flex items-center gap-3 md:gap-4">
          <a
            href="https://github.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-[#07553B] hover:text-[#07553B] hover:bg-[#CED46A] border border-[#07553B] hover:border-[#07553B] transition-transform transform hover:scale-105 shadow-md hidden sm:flex items-center justify-center"
          >
            <FaGithub className="h-5 w-5 text-white" />
          </a>
          <ConnectButton showBalance={false} accountStatus="address" />
        </div>
      </nav>
    </RainbowKitProvider>
  );
}
