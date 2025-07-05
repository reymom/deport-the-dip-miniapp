import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function waitForTelegramWebApp(
  maxMs = 5000,
  pollMs = 200
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    let waited = 0;
    const id = window.setInterval(() => {
      if (window.Telegram?.WebApp) {
        clearInterval(id);
        resolve(true);
      } else if ((waited += pollMs) >= maxMs) {
        clearInterval(id);
        resolve(false);
      }
    }, pollMs);
  });
}
