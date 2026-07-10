// Vault page encryptor — publishes password-gated documents as pure ciphertext.
//
// Usage:   npm run encrypt -- <input.html> <slug> <password>
// Output:  public/vault/<slug>.html  (safe to commit — content is AES-256-GCM ciphertext)
//
// Input contract: an HTML *fragment* — <title> + <style> blocks + body markup,
// optionally ending with ONE <script> block (it stays plaintext and runs after
// unlock; put nothing sensitive in it). See private-src/ for examples.
// Plaintext sources live in private-src/ which is gitignored — never commit them.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { pbkdf2Sync, randomBytes, createCipheriv } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const [, , inPath, slug, password] = process.argv;
if (!inPath || !slug || !password) {
  console.error("usage: npm run encrypt -- <input.html> <slug> <password>");
  process.exit(1);
}
if (!/^[a-z0-9-]+$/.test(slug)) {
  console.error("slug must be lowercase letters, digits, and hyphens only");
  process.exit(1);
}

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(inPath, "utf8");

// --- split: <title> | payload (styles + markup) | optional trailing <script> ---
const titleMatch = src.match(/<title>[\s\S]*?<\/title>/);
const title = titleMatch ? titleMatch[0] : `<title>${slug}</title>`;
const withoutTitle = titleMatch ? src.replace(title, "") : src;
const scriptStart = withoutTitle.lastIndexOf("<script>");
const scriptEnd = withoutTitle.lastIndexOf("</script>");
const hasScript = scriptStart !== -1 && scriptEnd > scriptStart;
const appJs = hasScript ? withoutTitle.slice(scriptStart + "<script>".length, scriptEnd) : "";
const payload = hasScript ? withoutTitle.slice(0, scriptStart) : withoutTitle;

// --- encrypt payload: PBKDF2-SHA256 (310k) -> AES-256-GCM (cipher||tag for WebCrypto) ---
const salt = randomBytes(16);
const iv = randomBytes(12);
const key = pbkdf2Sync(password, salt, 310000, 32, "sha256");
const cipher = createCipheriv("aes-256-gcm", key, iv);
const enc = Buffer.concat([cipher.update(payload, "utf8"), cipher.final(), cipher.getAuthTag()]);
const b64 = (buf) => buf.toString("base64");

const out = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
${title}
</head>
<body>
<style>
  :root {
    --g-bg: #fdf8f0; --g-card: #f6efe1; --g-ink: #2a2520; --g-soft: #4a4339;
    --g-accent: #c46a4d; --g-fog: #e6dfd2; --g-stone: #8b7f6e;
  }
  @media (prefers-color-scheme: dark) {
    :root { --g-bg: #181410; --g-card: #221c16; --g-ink: #f1e6d3; --g-soft: #c7baa3; --g-accent: #e08a6b; --g-fog: #3a302a; --g-stone: #8a7d6c; }
  }
  html { background: var(--g-bg); }
  body { margin: 0; font-family: system-ui, -apple-system, sans-serif; color: var(--g-ink); }
  .gate-wrap { min-height: 92vh; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
  .gate-card {
    max-width: 380px; width: 100%; background: var(--g-card);
    border: 1px solid var(--g-fog); border-radius: 1rem; padding: 2.2rem;
    text-align: center; box-sizing: border-box;
  }
  .gate-card .g-emoji { font-size: 2.6rem; }
  .gate-card h1 { font-family: Georgia, serif; font-weight: 500; font-size: 1.5rem; margin: 0.8rem 0 0.4rem; }
  .gate-card p { font-size: 0.9rem; color: var(--g-soft); margin: 0 0 1.4rem; }
  .gate-card input {
    width: 100%; box-sizing: border-box; padding: 0.7rem 0.9rem;
    border: 1px solid var(--g-fog); border-radius: 0.5rem;
    background: var(--g-bg); color: var(--g-ink); font: inherit; text-align: center;
  }
  .gate-card button {
    margin-top: 0.8rem; width: 100%; padding: 0.7rem;
    background: var(--g-accent); color: var(--g-bg); border: none;
    border-radius: 999px; font: inherit; font-weight: 600; cursor: pointer;
  }
  .gate-card button:disabled { opacity: 0.6; cursor: wait; }
  .gate-card .g-err { color: var(--g-accent); font-size: 0.85rem; min-height: 1.2em; margin-top: 0.7rem; }
  .gate-card .g-hint { font-size: 0.75rem; color: var(--g-stone); margin-top: 1.2rem; }
  input:focus-visible, button:focus-visible { outline: 2px solid var(--g-accent); outline-offset: 2px; }
</style>
<div class="gate-wrap" id="gate">
  <div class="gate-card">
    <div class="g-emoji" aria-hidden="true">&#128274;</div>
    <h1>Private document</h1>
    <p>This page is encrypted. Enter the password Aasim shared with you.</p>
    <input id="gatePw" type="password" autocomplete="off" aria-label="Password" autofocus />
    <button id="gateGo" type="button">Unlock</button>
    <div class="g-err" id="gateErr" role="alert"></div>
    <div class="g-hint">Content is AES-encrypted in this page &mdash; there is nothing to read without the key.</div>
  </div>
</div>
<div id="content"></div>
<script>
var PAYLOAD = { salt: "${b64(salt)}", iv: "${b64(iv)}", data: "${b64(enc)}" };
function b64buf(s) { var bin = atob(s), a = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a.buffer; }
async function unlock() {
  var pw = document.getElementById("gatePw").value;
  var err = document.getElementById("gateErr");
  var btn = document.getElementById("gateGo");
  if (!pw) return;
  btn.disabled = true; err.textContent = "";
  try {
    var mat = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]);
    var key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: b64buf(PAYLOAD.salt), iterations: 310000, hash: "SHA-256" },
      mat, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    var plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64buf(PAYLOAD.iv) }, key, b64buf(PAYLOAD.data));
    document.getElementById("content").innerHTML = new TextDecoder().decode(plain);
    document.getElementById("gate").remove();
    initApp();
    window.scrollTo(0, 0);
  } catch (e) {
    err.textContent = "That password didn\\u2019t work \\u2014 check with Aasim.";
    btn.disabled = false;
  }
}
document.getElementById("gateGo").addEventListener("click", unlock);
document.getElementById("gatePw").addEventListener("keydown", function (e) { if (e.key === "Enter") unlock(); });
function initApp() {
${appJs}
}
</script>
</body>
</html>
`;

const outPath = resolve(repoRoot, "public/vault", `${slug}.html`);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, out);
console.log(`vault page written: public/vault/${slug}.html (${Math.round(out.length / 1024)} KB)`);
console.log(`live at: https://aasimsani.net/vault/${slug}.html after deploy`);
