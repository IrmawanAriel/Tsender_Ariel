"use client";

import { useState, useEffect, useRef } from "react";
import AirdropForm from "@/components/AirDropForm";
import { useAccount } from "wagmi";
import { FaWallet } from "react-icons/fa";
import gsap from "gsap";

export default function HomeContent() {
  const [isUnsafeMode, setIsUnsafeMode] = useState(false);
  const { isConnected } = useAccount();
  const cardRef = useRef(null);

  useEffect(() => {
    if (!isConnected) {
      gsap.fromTo(
        cardRef.current,
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
      );
    }
  }, [isConnected]);

  return (
    <main className="min-h-screen bg-[#07553B] flex items-center justify-center font-sans">
      {!isConnected ? (
        <div
          ref={cardRef}
          className="flex flex-col items-center justify-center gap-6 p-8 bg-[#CED46A] rounded-xl shadow-2xl border border-[#07553B]"
        >
          <FaWallet className="text-[#07553B] text-5xl" />
          <h2 className="text-2xl font-bold text-[#07553B]">
            Please connect a wallet
          </h2>
          <p className="text-sm text-[#07553B] text-center">
            Connect your wallet to access the T-Sender airdrop tool and manage
            your tokens efficiently.
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-center p-4 md:p-6 xl:p-8 w-full max-w-4xl">
          <AirdropForm
            isUnsafeMode={isUnsafeMode}
            onModeChange={setIsUnsafeMode}
          />
        </div>
      )}
    </main>
  );
}
