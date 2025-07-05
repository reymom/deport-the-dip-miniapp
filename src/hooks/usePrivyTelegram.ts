"use client";

import { useEffect, useState, useCallback } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { waitForTelegramWebApp } from "@/lib/utils";

interface UsePrivyTelegramProps {
  autoConnect?: boolean;
}

interface UsePrivyTelegram {
  isWebAppReady: boolean;
  telegramUserId: string | null;
  privyId: string | null;
  evmAddress: string | undefined;
  delegated: boolean | undefined;
  ethWalletId: string | null | undefined;
  isTelegramWebApp: boolean;
  isConnecting: boolean;
  isDisconnecting: boolean;
  authenticated: boolean;
  walletsReady: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
}

export function usePrivyTelegram({
  autoConnect = true,
}: UsePrivyTelegramProps = {}): UsePrivyTelegram {
  const {
    user,
    ready: privyReady,
    authenticated,
    logout,
    linkTelegram,
  } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();

  const [isWebAppReady, setIsWebAppReady] = useState(false);
  const [telegramUserId, setTelegramUserId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const evmWallet = wallets.find((w) => w.walletClientType === "privy");
  const evmAddress = evmWallet?.address;

  const isTelegramWebApp =
    typeof window !== "undefined" && window.Telegram && window.Telegram.WebApp;

  const initializeTelegram = useCallback(async () => {
    if (typeof window === "undefined") return;

    try {
      const ready = await waitForTelegramWebApp(2000, 200);
      if (!ready) {
        console.error("Telegram WebApp not available (timeout)");
        return;
      }

      if (!window.Telegram?.WebApp) {
        console.error("Telegram WebApp not available");
        return;
      }

      const webApp = window.Telegram.WebApp;
      webApp.expand();
      webApp.ready();

      const initDataRaw = webApp.initData;

      // Get user ID
      let userId =
        webApp.initDataUnsafe.user?.id?.toString() ||
        new URLSearchParams(initDataRaw).get("user.id") ||
        new URLSearchParams(initDataRaw).get("user")?.match(/"id":(\d+)/)?.[1];

      if (!userId) {
        const urlParams = new URLSearchParams(window.location.search);
        userId = urlParams.get("user_id") ?? undefined;
      }

      if (userId) {
        setTelegramUserId(userId);
      } else {
        console.log("No user ID found in initDataUnsafe");
      }

      setIsWebAppReady(true);
    } catch (error) {
      console.error("WebApp initialization error:", error);
      setIsWebAppReady(true);
    }
  }, []);

  useEffect(() => {
    if (isWebAppReady) return;
    initializeTelegram();
  }, [isWebAppReady, initializeTelegram]);

  const connectWallet = useCallback(async () => {
    if (!privyReady || authenticated) return;
    setIsConnecting(true);
    try {
      linkTelegram({
        launchParams: { initDataRaw: window.Telegram.WebApp.initData },
      });
    } catch (error) {
      console.error("Connect error:", error);
    } finally {
      setIsConnecting(false);
    }
  }, [privyReady, authenticated, linkTelegram]);

  const disconnectWallet = useCallback(async () => {
    setIsDisconnecting(true);
    try {
      await logout();
    } catch (error) {
      console.error("Disconnect error:", error);
    } finally {
      setIsDisconnecting(false);
    }
  }, [logout]);

  useEffect(() => {
    if (autoConnect && privyReady && !authenticated && telegramUserId) {
      connectWallet();
    }
  }, [autoConnect, privyReady, authenticated, telegramUserId, connectWallet]);

  return {
    isWebAppReady,
    telegramUserId,
    privyId: user?.id ?? null,
    evmAddress,
    delegated: user?.wallet?.delegated,
    ethWalletId: user?.wallet?.id,
    isTelegramWebApp: !!isTelegramWebApp,
    isConnecting,
    isDisconnecting,
    authenticated,
    walletsReady: walletsReady && !!evmAddress,
    connectWallet,
    disconnectWallet,
  };
}
