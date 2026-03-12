'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useConnectWallet } from '@/hooks/use-connect-wallet';
import { useAppKitAccount } from '@reown/appkit/react';
import { useDisconnect } from 'wagmi';

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function WalletButton() {
  const { connect } = useConnectWallet();
  const { address, isConnected } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  function handleCopyAddress() {
    if (address) navigator.clipboard.writeText(address);
  }

  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="border-primary-alpha-border bg-primary-alpha-18 text-text-heading hover:bg-primary-alpha-18 flex items-center gap-2 rounded-lg border p-[9px] text-center hover:opacity-90"
          >
            <span
              aria-hidden="true"
              className="material-icons text-lg! leading-7"
            >
              wallet
            </span>
            <span className="font-mulish text-sm leading-5 font-bold whitespace-nowrap">
              {formatAddress(address)}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-dropdown-bg w-[150px] rounded-[7px] p-[10px]"
        >
          <DropdownMenuItem
            onClick={handleCopyAddress}
            className="font-mulish text-dropdown-text cursor-pointer gap-2 text-xs leading-5 font-semibold"
          >
            <span aria-hidden="true" className="material-icons text-[14px]!">
              content_copy
            </span>
            Copy Address
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => disconnect()}
            className="font-mulish text-dropdown-text cursor-pointer gap-2 text-xs leading-5 font-semibold"
          >
            <span aria-hidden="true" className="material-icons text-[14px]!">
              logout
            </span>
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      onClick={connect}
      className="border-primary-alpha-border bg-primary font-mulish text-primary-foreground hover:bg-primary-hover rounded-lg border px-2 py-1 text-xs font-bold md:px-3.5 md:py-[10px] md:text-sm"
    >
      Try It Now
    </Button>
  );
}
