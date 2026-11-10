// schema.org data for search engines. Each page hands one of these graphs to
// BaseLayout, which writes it into the head as JSON-LD. Every value comes from
// the same data files the pages render, so the two can't drift apart.
import { bio } from "./bio";
import { experience } from "./experience";
import { posts, type Post } from "./posts";
import { site } from "./site";

const origin = site.url.replace(/\/$/, "");
const personId = `${site.url}#person`;
const websiteId = `${site.url}#website`;
const blogId = `${site.url}blog/#blog`;
const fullName = `${site.firstName} ${site.lastName}`;

export const postUrl = (post: Post) => `${site.url}blog/${post.slug}/`;
export const absolute = (path: string) => `${origin}${path}`;

function person() {
  const current = experience.find((e) => /present/i.test(e.dates));
  return {
    "@type": "Person",
    "@id": personId,
    name: fullName,
    givenName: site.firstName,
    familyName: site.lastName,
    url: site.url,
    image: site.ogImage,
    description: site.description,
    ...(current && {
      // "Founding Engineer (1st employee)" reads as a title without the aside.
      jobTitle: current.role.replace(/\s*\(.*\)$/, ""),
      worksFor: { "@type": "Organization", name: current.company, ...(current.link && { url: current.link }) },
    }),
    sameAs: bio.social.map((s) => s.href).filter((href) => href.startsWith("http")),
  };
}

function website() {
  return {
    "@type": "WebSite",
    "@id": websiteId,
    url: site.url,
    name: fullName,
    description: site.description,
    inLanguage: "en",
    publisher: { "@id": personId },
  };
}

function blogPosting(post: Post) {
  const minutes = post.readingTime.match(/\d+/)?.[0];
  return {
    "@type": "BlogPosting",
    "@id": `${postUrl(post)}#post`,
    headline: post.title,
    description: post.description,
    url: postUrl(post),
    mainEntityOfPage: postUrl(post),
    datePublished: post.published,
    dateModified: post.published,
    inLanguage: "en",
    image: absolute(post.ogImage),
    author: { "@id": personId },
    publisher: { "@id": personId },
    isPartOf: { "@id": blogId },
    ...(minutes && { timeRequired: `PT${minutes}M` }),
    ...(post.audio && {
      audio: { "@type": "AudioObject", contentUrl: absolute(post.audio), encodingFormat: "audio/mpeg", description: "Narration by an AI voice." },
    }),
  };
}

const graph = (...nodes: Record<string, unknown>[]) => ({ "@context": "https://schema.org", "@graph": nodes });

/** The homepage: who Aasim is, plus the profiles on other sites. */
export const homeSchema = () =>
  graph(website(), person(), {
    "@type": "ProfilePage",
    "@id": `${site.url}#profile`,
    url: site.url,
    name: fullName,
    isPartOf: { "@id": websiteId },
    mainEntity: { "@id": personId },
  });

/** The /blog/ index: the blog and the posts it lists. */
export const blogSchema = () =>
  graph(
    website(),
    person(),
    {
      "@type": "Blog",
      "@id": blogId,
      url: `${site.url}blog/`,
      name: site.feedTitle,
      description: site.feedDescription,
      inLanguage: "en",
      author: { "@id": personId },
      blogPost: posts.map((p) => ({ "@id": `${postUrl(p)}#post` })),
    },
    ...posts.map(blogPosting),
  );

/** One post: the article, its author and its narration. */
export const postSchema = (post: Post) => graph(website(), person(), blogPosting(post));
