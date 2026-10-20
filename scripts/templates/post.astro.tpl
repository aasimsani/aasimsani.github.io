---
// PostLayout draws the header, progress bar, share row, footer and the
// Serious / After hours switch from this post's entry in src/data/posts.ts.
// Shared styles live in src/styles/post.css. Add a <style> block here only for
// figures that belong to this post.
import PostLayout from "../../layouts/PostLayout.astro";
import PostSection from "../../components/post/PostSection.astro";
import Reveal from "../../components/post/Reveal.astro";
import CaseFile from "../../components/post/CaseFile.astro";
import Checklist from "../../components/post/Checklist.astro";
import Sources from "../../components/post/Sources.astro";
---

<PostLayout
  slug="{{SLUG}}"
  kicker="{{KICKER}}"
  dek="{{DESCRIPTION}}"
>
  <PostSection id="intro">
    <p class="lede">Opening paragraph, the hook. Replace me.</p>
    <p>Body copy.</p>
  </PostSection>

  <PostSection id="section-one" no="01" label="Section label" title="Section title">
    <p>Section content. Cite a source like this.<sup><a href="#src-1">1</a></sup></p>

    <figure class="post-panel" aria-label="Describe the figure">
      <figcaption class="chart-title">Figure title</figcaption>
      <p>Chart, diagram or demo goes here.</p>
    </figure>

    <p class="aside">An aside sits beside the main argument.</p>

    <Reveal summary="A question the reader answers first">
      <p>The answer.</p>
    </Reveal>

    <div class="case-grid">
      <CaseFile
        no="01"
        name="What broke and what it cost"
        staring="what the team watched"
        invisible="what nobody saw"
        seenBy="who noticed first"
        catcher="Who could have caught it."
      >
        <p>The story.</p>
        <Fragment slot="verdict">Why they were positioned to catch it.</Fragment>
      </CaseFile>
    </div>

    <Checklist
      storageKey="{{SLUG}}-checklist.v1"
      markdownTitle="Checklist title"
      items={[{ key: "first", title: "Do the first thing.", body: "Say why it matters." }]}
    />
  </PostSection>

  <PostSection id="close" no="02" label="The point" title="Closing title">
    <p>Closing argument.</p>
    <p class="cta">Invite replies here.</p>
  </PostSection>

  <Sources slot="sources">
    <li id="src-1">Author, A. (Year). <a href="https://example.com" target="_blank" rel="noopener">Title</a>. <i>Journal</i>.</li>
  </Sources>
</PostLayout>
