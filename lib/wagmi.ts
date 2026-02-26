import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { arbitrum, arbitrumSepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "Confidential Token | Nox",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "demo",
  chains: [arbitrumSepolia, arbitrum],
  ssr: true,
});
