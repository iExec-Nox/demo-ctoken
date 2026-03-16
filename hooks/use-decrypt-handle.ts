"use client";

import { useCallback, useState } from "react";
import { useHandleClient } from "@/hooks/use-handle-client";

export function useDecryptHandle() {
  const { handleClient } = useHandleClient();
  const [decryptedValues, setDecryptedValues] = useState<
    Record<string, string>
  >({});
  const [decryptingHandle, setDecryptingHandle] = useState<string | null>(null);

  const decrypt = useCallback(
    async (handleId: string) => {
      if (!handleClient || decryptedValues[handleId]) return;
      setDecryptingHandle(handleId);
      try {
        const result = await handleClient.decrypt(handleId as `0x${string}`);
        const raw = result?.value ?? result;
        const str = typeof raw === "bigint" ? raw.toString() : String(raw);
        setDecryptedValues((prev) => ({
          ...prev,
          [handleId]: str,
        }));
      } catch {
        setDecryptedValues((prev) => ({
          ...prev,
          [handleId]: "Error",
        }));
      } finally {
        setDecryptingHandle(null);
      }
    },
    [handleClient, decryptedValues],
  );

  return { decryptedValues, decryptingHandle, decrypt };
}
