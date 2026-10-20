// Copy text and flash the result on the button that asked for it.
export async function copyWithFeedback(text: string, btn: HTMLElement) {
  const prev = btn.textContent;
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = "Copied ✓";
  } catch {
    btn.textContent = "Copy failed";
  }
  setTimeout(() => (btn.textContent = prev), 1400);
}
