declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name?: string;
            last_name?: string;
            username?: string;
          };
        };
        openTelegramLink: (url: string) => void;
        platform: string;
        version: string;
        ready: () => void;
        expand: () => void;
        enableClosingConfirmation: () => void;
        sendData: (data: string) => void;
        close: () => void;
      };
    };
  }
}

export {};
