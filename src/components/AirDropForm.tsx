"use client";

import { useState, useMemo, useEffect } from "react";
import { RiAlertFill, RiInformationLine } from "react-icons/ri";
import { FaEthereum, FaUserAlt, FaCoins } from "react-icons/fa";
import {
  useChainId,
  useWriteContract,
  useAccount,
  useWaitForTransactionReceipt,
  useReadContracts,
} from "wagmi";
import { chainsToTSender, tsenderAbi, erc20Abi } from "@/constants";
import { readContract } from "@wagmi/core";
import { useConfig } from "wagmi";
import { CgSpinner } from "react-icons/cg";
import { calculateTotal } from "@/utils/calculateTotal";
import { formatTokenAmount } from "@/utils/formatTokenAmount";
import { InputForm } from "./ui/InputField";
import { Tabs, TabsList, TabsTrigger } from "./ui/Tabs";
import { waitForTransactionReceipt } from "@wagmi/core";

interface AirdropFormProps {
  isUnsafeMode: boolean;
  onModeChange: (unsafe: boolean) => void;
}

export default function AirdropForm({
  isUnsafeMode,
  onModeChange,
}: AirdropFormProps) {
  const [tokenAddress, setTokenAddress] = useState("");
  const [recipients, setRecipients] = useState("");
  const [amounts, setAmounts] = useState("");
  const config = useConfig();
  const account = useAccount();
  const chainId = useChainId();
  const { data: tokenData } = useReadContracts({
    contracts: [
      {
        abi: erc20Abi,
        address: tokenAddress as `0x${string}`,
        functionName: "decimals",
      },
      {
        abi: erc20Abi,
        address: tokenAddress as `0x${string}`,
        functionName: "name",
      },
      {
        abi: erc20Abi,
        address: tokenAddress as `0x${string}`,
        functionName: "balanceOf",
        args: [account.address],
      },
    ],
  });
  const [hasEnoughTokens, setHasEnoughTokens] = useState(true);

  const {
    data: hash,
    isPending,
    error,
    writeContractAsync,
  } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError,
  } = useWaitForTransactionReceipt({
    confirmations: 1,
    hash,
  });

  const total: number = useMemo(() => calculateTotal(amounts), [amounts]);

  async function handleSubmit() {
    if (!tokenAddress) {
      alert("Token address is required.");
      return;
    }

    const contractType = isUnsafeMode ? "no_check" : "tsender";
    const tSenderAddress = chainsToTSender[chainId]?.[contractType];

    if (!tSenderAddress) {
      alert("T-Sender contract address is not available for this chain.");
      return;
    }

    const result = await getApprovedAmount(tSenderAddress);

    if (result < total) {
      const approvalHash = await writeContractAsync({
        abi: erc20Abi,
        address: tokenAddress as `0x${string}`,
        functionName: "approve",
        args: [tSenderAddress as `0x${string}`, BigInt(total)],
      });

      const approvalReceipt = await waitForTransactionReceipt(config, {
        hash: approvalHash,
      });

      console.log("Approval confirmed:", approvalReceipt);

      await writeContractAsync({
        abi: tsenderAbi,
        address: tSenderAddress as `0x${string}`,
        functionName: "airdropERC20",
        args: [
          tokenAddress,
          recipients
            .split(/[,\n]+/)
            .map((addr) => addr.trim())
            .filter((addr) => addr !== ""),
          amounts
            .split(/[,\n]+/)
            .map((amt) => amt.trim())
            .filter((amt) => amt !== ""),
          BigInt(total),
        ],
      });
    } else {
      await writeContractAsync({
        abi: tsenderAbi,
        address: tSenderAddress as `0x${string}`,
        functionName: "airdropERC20",
        args: [
          tokenAddress,
          recipients
            .split(/[,\n]+/)
            .map((addr) => addr.trim())
            .filter((addr) => addr !== ""),
          amounts
            .split(/[,\n]+/)
            .map((amt) => amt.trim())
            .filter((amt) => amt !== ""),
          BigInt(total),
        ],
      });
    }
  }

  async function getApprovedAmount(
    tSenderAddress: string | null
  ): Promise<number> {
    if (!tokenAddress) {
      alert("Token address is required to check allowance.");
      return 0;
    }

    if (!tSenderAddress) {
      alert("T-Sender contract address is not available for this chain.");
      return 0;
    }

    const response = await readContract(config, {
      abi: erc20Abi,
      address: tokenAddress as `0x${string}`,
      functionName: "allowance",
      args: [account.address, tSenderAddress as `0x${string}`],
    });
    return response as number;
  }

  function getButtonContent() {
    if (isPending)
      return (
        <div className="flex items-center justify-center gap-2 w-full">
          <CgSpinner className="animate-spin" size={20} />
          <span>Confirming in wallet...</span>
        </div>
      );
    if (isConfirming)
      return (
        <div className="flex items-center justify-center gap-2 w-full">
          <CgSpinner className="animate-spin" size={20} />
          <span>Waiting for transaction to be included...</span>
        </div>
      );
    if (error || isError) {
      console.log(error);
      return (
        <div className="flex items-center justify-center gap-2 w-full">
          <span>Error, see console.</span>
        </div>
      );
    }
    if (isConfirmed) {
      return "Transaction confirmed.";
    }
    return isUnsafeMode ? "Send Tokens (Unsafe)" : "Send Tokens";
  }

  useEffect(() => {
    const savedTokenAddress = localStorage.getItem("tokenAddress");
    const savedRecipients = localStorage.getItem("recipients");
    const savedAmounts = localStorage.getItem("amounts");

    if (savedTokenAddress) setTokenAddress(savedTokenAddress);
    if (savedRecipients) setRecipients(savedRecipients);
    if (savedAmounts) setAmounts(savedAmounts);
  }, []);

  useEffect(() => {
    localStorage.setItem("tokenAddress", tokenAddress);
  }, [tokenAddress]);

  useEffect(() => {
    localStorage.setItem("recipients", recipients);
  }, [recipients]);

  useEffect(() => {
    localStorage.setItem("amounts", amounts);
  }, [amounts]);

  useEffect(() => {
    if (
      tokenAddress &&
      total > 0 &&
      (tokenData?.[2]?.result as number) !== undefined
    ) {
      const userBalance = tokenData?.[2].result as number;
      setHasEnoughTokens(userBalance >= total);
    } else {
      setHasEnoughTokens(true);
    }
  }, [tokenAddress, total, tokenData]);

  return (
    <div className="max-w-2xl min-w-full xl:min-w-lg w-full lg:mx-auto p-8 flex flex-col gap-8 bg-gradient-to-br from-[#CED46A] via-[#A8C256] to-[#0c8e63] rounded-2xl shadow-2xl ring-4 ring-[#07553B]/30 border-2 border-[#07553B] font-sans relative overflow-hidden transform transition-all duration-500 hover:scale-[1.02] hover:shadow-3xl animate-float">
      {/* Animated background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none"></div>
      
      {/* Floating particles */}
      <div className="absolute -top-10 -left-10 w-20 h-20 bg-[#07553B]/20 rounded-full animate-bounce opacity-60"></div>
      <div className="absolute -bottom-10 -right-10 w-16 h-16 bg-[#CED46A]/30 rounded-full animate-pulse"></div>
      <div className="absolute top-1/2 -left-8 w-12 h-12 bg-[#0c8e63]/25 rounded-full animate-float-delayed"></div>
      
      <div className="flex items-center justify-between relative z-10">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-[#07553B] to-[#0c8e63] bg-clip-text text-transparent hover:scale-105 transition-transform duration-300 cursor-default">
          C-Sender
        </h2>
        <Tabs defaultValue={"false"}>
          <TabsList className="bg-[#07553B] p-1 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
            <TabsTrigger
              value={"false"}
              onClick={() => onModeChange(false)}
              className="px-4 py-2 text-sm font-medium text-white bg-[#07553B] hover:bg-[#CED46A] hover:text-[#07553B] rounded-md transition-all duration-200 ease-in-out shadow-sm hover:shadow-md"
            >
              Safe Mode
            </TabsTrigger>
            <TabsTrigger
              value={"true"}
              onClick={() => onModeChange(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-[#07553B] hover:bg-[#CED46A] hover:text-[#07553B] rounded-md transition-all duration-200 ease-in-out shadow-sm hover:shadow-md"
            >
              Unsafe Mode
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-6 relative z-10">
        <div className="relative group">
          <FaEthereum className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#07553B] text-lg z-10 transition-all duration-300 group-hover:scale-110 group-hover:text-[#0c8e63]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#CED46A]/20 to-[#0c8e63]/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <InputForm
            label="Token Address"
            placeholder="0x"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            className="font-semibold glass-effect hover:bg-white/20 transition-all duration-300 focus-within:animate-glow"
          />
        </div>
        <div className="relative group">
          <FaUserAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#07553B] text-lg z-10 transition-all duration-300 group-hover:scale-110 group-hover:text-[#0c8e63]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#CED46A]/20 to-[#0c8e63]/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <InputForm
            label="Recipients (comma or new line separated)"
            placeholder="0x123..., 0x456..."
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            large={true}
            className="glass-effect hover:bg-white/20 transition-all duration-300 focus-within:animate-glow"
          />
        </div>
        <div className="relative group">
          <FaCoins className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#07553B] text-lg z-10 transition-all duration-300 group-hover:scale-110 group-hover:text-[#0c8e63]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#CED46A]/20 to-[#0c8e63]/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <InputForm
            label="Amounts (wei; comma or new line separated)"
            placeholder="100, 200, 300..."
            value={amounts}
            onChange={(e) => setAmounts(e.target.value)}
            large={true}
            className="glass-effect hover:bg-white/20 transition-all duration-300 focus-within:animate-glow"
          />
        </div>

        <div className="bg-gradient-to-br from-[#07553B] via-[#0a5d42] to-[#07553B] border-2 border-[#CED46A] rounded-xl p-6 relative overflow-hidden animate-gradient shadow-lg hover:shadow-2xl transition-all duration-300 group">
          {/* Animated border effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#CED46A] via-[#A8C256] to-[#CED46A] rounded-xl blur-sm opacity-0 group-hover:opacity-30 transition-opacity duration-500 animate-gradient"></div>
          <div className="relative z-10">
            <h3 className="text-lg font-semibold text-[#CED46A] mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-[#CED46A] rounded-full animate-pulse"></div>
              Transaction Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200">
                <span className="text-sm text-[#CED46A]/80">Token Name:</span>
                <span className="font-mono text-[#CED46A] font-medium">
                  {tokenData?.[1]?.result as string}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200">
                <span className="text-sm text-[#CED46A]/80">Amount (wei):</span>
                <span className="font-mono text-[#CED46A] font-medium">{total}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200">
                <span className="text-sm text-[#CED46A]/80">Amount (tokens):</span>
                <span className="font-mono text-[#CED46A] font-medium">
                  {formatTokenAmount(total, tokenData?.[0]?.result as number)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {isUnsafeMode && (
          <div className="mb-4 p-4 bg-gradient-to-r from-red-50 via-red-100 to-red-50 text-red-600 rounded-xl flex items-center justify-between border-2 border-red-200 shadow-lg relative overflow-hidden group animate-pulse">
            {/* Animated warning background */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-100/50 to-orange-100/50 animate-gradient"></div>
            
            <div className="flex items-center gap-3 relative z-10">
              <RiAlertFill size={20} className="animate-bounce text-red-500" />
              <span className="font-medium">
                Using{" "}
                <span className="font-bold underline underline-offset-2 decoration-2 decoration-red-400 animate-pulse">
                  unsafe
                </span>{" "}
                super gas optimized mode
              </span>
            </div>
            <div className="relative group/tooltip">
              <RiInformationLine className="cursor-help w-5 h-5 opacity-60 hover:opacity-100 transition-opacity duration-200 text-red-500" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-4 py-3 bg-gradient-to-br from-red-900 to-red-800 text-white text-sm rounded-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 w-64 shadow-2xl border border-red-600">
                <div className="text-center">
                  <strong className="block mb-1">⚠️ Danger Zone</strong>
                  This mode skips certain safety checks to optimize for gas. Do
                  not use this mode unless you know how to verify the calldata of
                  your transaction.
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-1 border-8 border-transparent border-t-red-800"></div>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          className={`relative overflow-hidden cursor-pointer flex items-center justify-center w-full py-4 rounded-xl text-[#CED46A] font-bold text-lg transition-all duration-500 transform ${
            isPending || (!hasEnoughTokens && tokenAddress !== "")
              ? "bg-gray-500 cursor-not-allowed opacity-50"
              : "bg-gradient-to-r from-[#07553B] via-[#0a5d42] to-[#07553B] hover:from-[#CED46A] hover:via-[#A8C256] hover:to-[#CED46A] hover:text-[#07553B] hover:scale-105 shadow-lg hover:shadow-2xl animate-glow"
          } border-2 border-[#07553B] group`}
          onClick={handleSubmit}
          disabled={isPending || (!hasEnoughTokens && tokenAddress !== "")}
        >
          {/* Animated background overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          
          {/* Button content */}
          <div className="relative z-10 flex items-center gap-2">
            {isPending && <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>}
            {isPending || error || isConfirming
              ? getButtonContent()
              : !hasEnoughTokens && tokenAddress
              ? "Insufficient token balance"
              : isUnsafeMode
              ? "Send Tokens (Unsafe)"
              : "Send Tokens"}
          </div>
        </button>
      </div>
    </div>
  );
}
