"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SOCIAL_OPTIONS = [
  { src: "/wallet-google.png", alt: "Google" },
  { src: "/wallet-facebook.png", alt: "Facebook", bg: "#0866ff" },
  { src: "/wallet-x.png", alt: "X" },
  { src: "/wallet-discord.png", alt: "Discord", bg: "#5765eb" },
  { src: "/wallet-twitch.png", alt: "Twitch", bg: "#a544ff" },
];

function Divider() {
  return (
    <div className="flex w-full items-center justify-center gap-3">
      <div className="h-px flex-1 rounded-xl bg-[#3f3f46]" />
      <span className="font-[family-name:var(--font-mulish)] text-[13px] font-medium text-white">
        Or
      </span>
      <div className="h-px flex-1 rounded-xl bg-[#3f3f46]" />
    </div>
  );
}

interface WalletRowProps {
  label: string;
  src: string;
  onClick?: () => void;
}

function WalletRow({ label, src, onClick }: WalletRowProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/5 p-[17px] transition-colors hover:bg-white/10"
    >
      <div className="flex items-center gap-4">
        <div className="relative size-10 overflow-hidden rounded-lg">
          <Image src={src} alt={label} fill className="object-cover" />
        </div>
        <span className="font-[family-name:var(--font-mulish)] text-base font-bold text-slate-100">
          {label}
        </span>
      </div>
      <span className="material-icons text-2xl text-slate-500">chevron_right</span>
    </button>
  );
}

interface SocialButtonProps {
  src: string;
  alt: string;
  bg?: string;
}

function SocialButton({ src, alt, bg }: SocialButtonProps) {
  return (
    <button className="flex items-center rounded-xl border border-white/5 bg-white/5 p-[10px] transition-colors hover:bg-white/10">
      <div
        className="relative size-10 overflow-hidden rounded-lg"
        style={bg ? { backgroundColor: bg } : undefined}
      >
        <Image src={src} alt={alt} fill className="object-cover" />
      </div>
    </button>
  );
}

export function ConnectWalletModal({ isOpen, onClose }: ConnectWalletModalProps) {
  const router = useRouter();
  const { openConnectModal } = useConnectModal();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (isConnected) {
      onClose();
      router.push("/dashboard");
    }
  }, [isConnected, onClose, router]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  function handleWalletConnect() {
    onClose();
    openConnectModal?.();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Blur backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* Modal */}
      <div
        className="relative flex w-full max-w-[462px] flex-col items-center gap-[26px] rounded-3xl border border-white/10 bg-[#24242b] p-10 shadow-[0px_2px_4px_0px_rgba(116,142,255,0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="relative size-16 overflow-hidden rounded-xl bg-[#748eff]">
          <Image
            src="/nox-icon-modal.png"
            alt="Nox"
            fill
            className="object-cover"
          />
        </div>

        {/* Title + description */}
        <div className="flex w-full flex-col items-center gap-[26px] text-center">
          <h2 className="font-[family-name:var(--font-mulish)] text-[34px] font-bold leading-8 text-white">
            Sign in
          </h2>
          <p className="font-[family-name:var(--font-mulish)] text-sm leading-5 text-slate-400">
            Choose your preferred wallet provider to access the Confidential
            Token network.
          </p>
        </div>

        {/* Wallet options */}
        <div className="flex w-full flex-col items-center gap-6">
          {/* Email input */}
          <div className="flex w-full items-center rounded-xl border border-white/10 bg-white/5 px-[17px] py-[13px]">
            <span className="font-[family-name:var(--font-mulish)] text-base text-white opacity-60">
              Email
            </span>
          </div>

          {/* Continue button */}
          <button className="flex w-full items-center justify-center rounded-xl bg-[#748eff] px-5 py-3 shadow-[0px_2px_4px_0px_rgba(71,37,244,0.4)] transition-colors hover:bg-[#6378e6]">
            <span className="font-[family-name:var(--font-mulish)] text-lg font-bold text-white">
              Continue
            </span>
          </button>

          <Divider />

          {/* Passkey row */}
          <WalletRow label="I have a passkey" src="/wallet-passkey.png" />

          {/* Social options */}
          <div className="flex w-full items-start justify-between">
            {SOCIAL_OPTIONS.map((social) => (
              <SocialButton key={social.alt} {...social} />
            ))}
          </div>

          <Divider />

          {/* Wallet connect */}
          <WalletRow
            label="Wallet connect"
            src="/wallet-passkey.png"
            onClick={handleWalletConnect}
          />

          {/* More wallets */}
          <WalletRow
            label="More Wallets"
            src="/wallet-passkey.png"
            onClick={handleWalletConnect}
          />
        </div>

        {/* Stepper */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2">
            <div className="h-1 w-12 rounded-full bg-[#748eff]" />
            <div className="h-1 w-12 rounded-full bg-white/10" />
          </div>
          <span className="font-[family-name:var(--font-mulish)] text-[10px] font-bold uppercase tracking-[2px] text-slate-500">
            Step 1 of 2
          </span>
        </div>
      </div>
    </div>
  );
}
