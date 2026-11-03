import { coinBurst } from "../../scripts/post-fx";

// Copy text and flash the result on the button that asked for it. In After hours a few coins land on it.
export async function copyWithFeedback(text: string, btn: HTMLElement) {
  const prev = btn.textContent;
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = "Copied ✓";
    coinBurst(btn);
  } catch {
    btn.textContent = "Copy failed";
  }
  setTimeout(() => (btn.textContent = prev), 1400);
}
