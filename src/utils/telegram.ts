// Smart 1-click Telegram launcher with automatic fallback between Web A and Web K

export const TELEGRAM_WEB_A = "https://web.telegram.org/a/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3DAdhikaar013bot";
export const TELEGRAM_WEB_K = "https://web.telegram.org/k/#@Adhikaar013bot";
export const TELEGRAM_DIRECT = "https://t.me/Adhikaar013bot";

export function launchTelegramBot(): void {
  // 1. Attempt to open primary Web A client in a new tab
  let primaryWindow: Window | null = null;
  try {
    primaryWindow = window.open(TELEGRAM_WEB_A, "_blank");
  } catch {
    primaryWindow = null;
  }

  // 2. If primary window failed to open or was blocked, open Web K fallback
  if (!primaryWindow || primaryWindow.closed) {
    try {
      window.open(TELEGRAM_WEB_K, "_blank");
    } catch {
      // Fallback direct link if window.open is completely restricted
      window.location.href = TELEGRAM_DIRECT;
    }
    return;
  }

  // 3. Ensure primary window focus
  try {
    primaryWindow.focus();
  } catch {
    // Window focus safety
  }
}
