// The blog's RSS feed at /rss.xml. It lists every post in src/data/posts.ts,
// newest first. A post with narration carries its MP3 as an enclosure, so a
// podcast app or feed reader can play it.
import rss from "@astrojs/rss";
import { statSync } from "node:fs";
import { newestFirst } from "../data/posts";
import { site } from "../data/site";
import { absolute, postUrl } from "../data/schema";

export function GET() {
  const sorted = newestFirst();
  return rss({
    title: site.feedTitle,
    description: site.feedDescription,
    site: site.url,
    xmlns: { atom: "http://www.w3.org/2005/Atom" },
    customData: `<language>en</language><atom:link href="${site.url}rss.xml" rel="self" type="application/rss+xml"/>`,
    items: sorted.map((post) => ({
      title: post.title,
      description: post.description,
      link: postUrl(post),
      pubDate: new Date(`${post.published}T12:00:00Z`),
      ...(post.audio && {
        enclosure: { url: absolute(post.audio), length: statSync(`public${post.audio}`).size, type: "audio/mpeg" },
      }),
    })),
  });
}
