---
import BaseLayout from "../../layouts/BaseLayout.astro";
import ThemeToggle from "../../components/ThemeToggle.astro";
import Footer from "../../components/Footer.astro";
import { posts } from "../../data/posts";
import { site } from "../../data/site";

const post = posts.find((p) => p.slug === "{{SLUG}}")!;
const canonical = `${site.url}blog/${post.slug}/`;
---

<BaseLayout
  title={`${post.title} · Aasim Sani`}
  description={post.description}
  ogType="article"
  ogTitle={post.title}
  ogImage={`${site.url.replace(/\/$/, "")}${post.ogImage}`}
  canonical={canonical}
  publishedTime={post.published}
>
  <ThemeToggle />
  <div class="read-progress" aria-hidden="true"><span></span></div>

  <main class="post">
    <header class="post-header">
      <a class="home-link" href="/blog/">&larr; Writing</a>
      <p class="kicker">{{KICKER}}</p>
      <h1>{{TITLE}}</h1>
      <p class="dek">
        {{DESCRIPTION}}
      </p>
      <div class="byline">
        <span><b>Aasim Sani</b></span>
        <span aria-hidden="true">&middot;</span>
        <span>{post.displayDate}</span>
        <span aria-hidden="true">&middot;</span>
        <span>{post.readingTime}</span>
      </div>
    </header>

    <section id="intro">
      <p class="lede">
        Opening paragraph — the hook. Replace me.
      </p>
      <p>
        Body copy. Duplicate this section block for each numbered section of
        the piece.
      </p>
    </section>

    <hr class="hairline" />

    <section id="section-one">
      <p class="section-label">01 &middot; Section label</p>
      <h2>Section title</h2>
      <p>Section content.</p>
    </section>

    <hr class="hairline" />

    <section id="close">
      <p class="cta">
        Closing line / call for responses.
      </p>
      <div class="share-row" aria-label="Share this essay">
        <a class="share-btn" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonical)}`} target="_blank" rel="noopener">Share on LinkedIn</a>
        <a class="share-btn" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(canonical)}`} target="_blank" rel="noopener">Post on X</a>
        <button type="button" class="share-btn" id="copyLink" data-url={canonical}>Copy link</button>
      </div>
    </section>

    <hr class="hairline" />

    <section id="sources" class="sources">
      <p class="section-label">Sources</p>
      <ol>
        <li id="src-1">Author (Year). <a href="#" target="_blank" rel="noopener">Title</a>. <i>Venue</i>.</li>
      </ol>
    </section>
  </main>

  <Footer />
</BaseLayout>

<style>
  .post {
    max-width: 720px;
    margin: 0 auto;
    padding: 5.5rem 1.5rem 5rem;
  }
  .post-header { margin-bottom: 3.5rem; }
  .home-link {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    color: var(--color-stone);
    text-decoration: none;
  }
  .home-link:hover { color: var(--color-terracotta); }
  .kicker {
    font-family: var(--font-mono);
    font-size: 0.8rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-terracotta);
    margin: 2.2rem 0 0.8rem;
  }
  h1 {
    font-size: clamp(2.5rem, 6.5vw, 3.6rem);
    line-height: 1.06;
    margin: 0 0 1.2rem;
  }
  .dek {
    font-family: var(--font-display);
    font-size: 1.25rem;
    line-height: 1.5;
    color: var(--color-ink-soft);
    max-width: 38rem;
  }
  .byline {
    display: flex;
    gap: 0.6rem;
    font-family: var(--font-mono);
    font-size: 0.82rem;
    color: var(--color-stone);
    margin-top: 1.4rem;
  }
  .byline b { color: var(--color-ink); font-weight: 500; }

  .read-progress {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 3px;
    z-index: 70;
  }
  .read-progress span {
    display: block;
    height: 100%;
    width: 0;
    background: var(--color-terracotta);
    transition: width 0.1s linear;
  }

  .section-label {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-stone);
    margin-bottom: 0.6rem;
  }
  h2 {
    font-size: clamp(1.7rem, 4vw, 2.2rem);
    line-height: 1.15;
    margin: 0 0 1.2rem;
  }
  .lede {
    font-family: var(--font-display);
    font-size: 1.18rem;
    line-height: 1.55;
    color: var(--color-ink);
  }
  sup a { text-decoration: none; font-family: var(--font-mono); font-size: 0.75em; }

  .cta {
    font-family: var(--font-display);
    font-size: 1.15rem;
    color: var(--color-ink);
  }
  .share-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.7rem;
    margin-top: 1.6rem;
  }
  .share-btn {
    font-family: var(--font-mono);
    font-size: 0.82rem;
    color: var(--color-terracotta);
    background: transparent;
    border: 1px solid color-mix(in srgb, var(--color-terracotta) 50%, var(--color-fog));
    border-radius: 999px;
    padding: 0.45rem 1rem;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.15s ease, color 0.15s ease;
  }
  .share-btn:hover {
    background: var(--color-terracotta);
    color: var(--color-cream);
  }

  .sources ol { padding-left: 1.2rem; }
  .sources li {
    font-size: 0.88rem;
    color: var(--color-ink-soft);
    margin-bottom: 0.6rem;
  }
</style>

<script>
  // Reading progress bar
  const bar = document.querySelector<HTMLElement>(".read-progress span");
  function paintProgress() {
    if (!bar) return;
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    bar.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
  }
  window.addEventListener("scroll", paintProgress, { passive: true });
  paintProgress();

  // Copy link
  document.getElementById("copyLink")?.addEventListener("click", async (e) => {
    const btn = e.currentTarget as HTMLElement;
    const prev = btn.textContent;
    try {
      await navigator.clipboard.writeText(btn.dataset.url ?? location.href);
      btn.textContent = "Copied ✓";
    } catch {
      btn.textContent = "Copy failed";
    }
    setTimeout(() => { btn.textContent = prev; }, 1400);
  });
</script>
