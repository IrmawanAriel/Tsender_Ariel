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
    <div className="max-w-2xl min-w-full xl:min-w-lg w-full lg:mx-auto p-8 flex flex-col gap-8 bg-gradient-to-br from-[#CED46A] to-[#0c8e63] rounded-2xl shadow-xl ring-4 ring-[#07553B]/50 border-2 border-[#07553B] font-sans">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#07553B]">C-Sender</h2>
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

      <div className="space-y-6">
        <div className="relative">
          <FaEthereum className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#07553B] text-lg" />
          <InputForm
            label="Token Address"
            placeholder="0x"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            className="font-semibold"
          />
        </div>
        <div className="relative">
          <FaUserAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#07553B] text-lg" />
          <InputForm
            label="Recipients (comma or new line separated)"
            placeholder="0x123..., 0x456..."
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            large={true}
            // className="pl-12 text-sm font-medium text-[#07553B]"
          />
        </div>
        <div className="relative">
          <FaCoins className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#07553B] text-lg" />
          <InputForm
            label="Amounts (wei; comma or new line separated)"
            placeholder="100, 200, 300..."
            value={amounts}
            onChange={(e) => setAmounts(e.target.value)}
            large={true}
            // className="pl-12 text-sm font-medium text-[#07553B]"
          />
        </div>

        <div className="bg-[#07553B] border border-[#CED46A] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[#CED46A] mb-4">
            Transaction Details
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#CED46A]">Token Name:</span>
              <span className="font-mono text-[#CED46A]">
                {tokenData?.[1]?.result as string}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#CED46A]">Amount (wei):</span>
              <span className="font-mono text-[#CED46A]">{total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[#CED46A]">Amount (tokens):</span>
              <span className="font-mono text-[#CED46A]">
                {formatTokenAmount(total, tokenData?.[0]?.result as number)}
              </span>
            </div>
          </div>
        </div>

        {isUnsafeMode && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RiAlertFill size={20} />
              <span>
                Using{" "}
                <span className="font-medium underline underline-offset-2 decoration-2 decoration-red-300">
                  unsafe
                </span>{" "}
                super gas optimized mode
              </span>
            </div>
            <div className="relative group">
              <RiInformationLine className="cursor-help w-5 h-5 opacity-45" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all w-64">
                This mode skips certain safety checks to optimize for gas. Do
                not use this mode unless you know how to verify the calldata of
                your transaction.
                <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-1 border-8 border-transparent border-t-zinc-900"></div>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          className="cursor-pointer flex items-center justify-center w-full py-4 rounded-lg text-[#CED46A] bg-[#07553B] hover:bg-[#CED46A] hover:text-[#07553B] transition-all font-bold text-lg border border-[#07553B] shadow-md hover:shadow-lg"
          onClick={handleSubmit}
          disabled={isPending || (!hasEnoughTokens && tokenAddress !== "")}
        >
          {isPending || error || isConfirming
            ? getButtonContent()
            : !hasEnoughTokens && tokenAddress
            ? "Insufficient token balance"
            : isUnsafeMode
            ? "Send Tokens (Unsafe)"
            : "Send Tokens"}
        </button>
      </div>
    </div>
  );
}
