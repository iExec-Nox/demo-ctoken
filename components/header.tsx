"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAccount, useDisconnect } from "wagmi";
import { ConnectWalletModal } from "@/components/connect-wallet-modal";

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function Header() {
  const [modalOpen, setModalOpen] = useState(false);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  return (
    <>
      <header className="flex w-full items-center justify-between bg-[#1d1d24] px-20 py-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative size-8 overflow-hidden rounded-xl bg-[#748eff]">
            <Image
              src="/nox-icon.png"
              alt="Nox logo"
              fill
              className="object-cover"
            />
          </div>
          <span className="font-[family-name:var(--font-mulish)] text-xl font-bold tracking-tight text-slate-100">
            Confidential Token
          </span>
        </Link>

        {isConnected && address ? (
          <button
            onClick={() => disconnect()}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 font-[family-name:var(--font-mulish)] text-sm font-bold text-white transition-colors hover:bg-white/10"
          >
            <span className="size-2 rounded-full bg-green-400" />
            {formatAddress(address)}
          </button>
        ) : (
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-lg border border-[rgba(112,136,255,0.1)] bg-[#748eff] px-6 py-2 font-[family-name:var(--font-mulish)] text-sm font-bold text-white transition-colors hover:bg-[#6378e6]"
          >
            Connect Wallet
          </button>
        )}
      </header>

      <ConnectWalletModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
