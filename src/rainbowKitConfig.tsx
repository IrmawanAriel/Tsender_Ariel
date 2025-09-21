"use client"; // Essential for client-side logic

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, optimism, base, arbitrum, zksync, sepolia, anvil } from 'wagmi/chains'; // 👈 make sure optimism is imported

// Retrieve the WalletConnect Project ID from environment variables
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

// Basic error handling for missing Project ID
if (!walletConnectProjectId) {
  throw new Error("Error: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not defined. Please set it in your .env.local file");
}

// Define the configuration object
const config = getDefaultConfig({
  appName: "TSender", // Your dApp's name, shown in wallet prompts
  projectId: walletConnectProjectId, // WalletConnect Cloud Project ID
    chains: [mainnet, optimism, arbitrum, base, zksync, sepolia],
  ssr: false, // Set to false for static sites or if not heavily using SSR with wagmi
});

export default config; // Export for use in Providers