"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { useDisconnect } from "wagmi";

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

interface WalletDropdownProps {
  address: string;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onLogout: () => void;
}

function WalletDropdown({ address, triggerRef, onClose, onLogout }: WalletDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  function handleCopyAddress() {
    navigator.clipboard.writeText(address);
    onClose();
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-px flex w-full origin-top-right animate-[dropdown-in_150ms_ease-out] flex-col gap-3 rounded-[7px] bg-[#2b2b2f] p-[10px]"
    >
      <button
        onClick={handleCopyAddress}
        className="flex cursor-pointer items-center gap-2 whitespace-nowrap font-mulish text-xs font-semibold leading-5 text-[#748eff]"
      >
        <span className="material-icons text-[14px]!">content_copy</span>
        Copy Address
      </button>
      <button
        className="flex cursor-pointer items-center gap-2 whitespace-nowrap font-mulish text-xs font-semibold leading-5 text-white"
      >
        <span className="material-icons text-[14px]!">person_outline</span>
        Account details
      </button>
      <button
        onClick={onLogout}
        className="flex cursor-pointer items-center gap-2 whitespace-nowrap font-mulish text-xs font-semibold leading-5 text-white"
      >
        <span className="material-icons text-[14px]!">logout</span>
        Logout
      </button>
    </div>
  );
}

export function Header() {
  const router = useRouter();
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const wasConnected = useRef(false);
  const walletBtnRef = useRef<HTMLButtonElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (isConnected && !wasConnected.current) {
      router.push("/dashboard");
    }
    if (!isConnected && wasConnected.current) {
      router.push("/");
    }
    wasConnected.current = isConnected;
  }, [isConnected, router]);

  function handleLogout() {
    setDropdownOpen(false);
    disconnect();
  }

  return (
    <header className="flex w-full items-center justify-between bg-[#1d1d24] px-20 py-6">
      <Logo />

      {isConnected && address ? (
        <div className="relative">
          <button
            ref={walletBtnRef}
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg border border-[rgba(71,37,244,0.2)] bg-[rgba(116,142,255,0.18)] p-[9px] text-center text-white"
          >
            <span className="material-icons text-lg! leading-7">wallet</span>
            <span className="whitespace-nowrap font-mulish text-sm font-bold leading-5">
              {formatAddress(address)}
            </span>
          </button>
          {dropdownOpen && (
            <WalletDropdown
              address={address}
              triggerRef={walletBtnRef}
              onClose={() => setDropdownOpen(false)}
              onLogout={handleLogout}
            />
          )}
        </div>
      ) : (
        <button
          onClick={() => open()}
          className="rounded-lg border border-[rgba(112,136,255,0.1)] bg-[#748eff] px-6 py-2 font-mulish text-sm font-bold text-white transition-colors hover:bg-[#6378e6]"
        >
          Connect Wallet
        </button>
      )}
    </header>
  );
}
