// Persists whether staff already tapped "enable call alerts" on this device,
// so navigating between the Tables and Menu tabs (which fully remounts the
// board and resets its in-memory soundEnabled state) doesn't re-prompt them
// every time — only the first-ever enable needs the tap.
const STORAGE_KEY = "callAlertsSoundEnabled";

export function hasSoundAlertsEnabled() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

export function rememberSoundAlertsEnabled() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, "1");
}

export function forgetSoundAlertsEnabled() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
