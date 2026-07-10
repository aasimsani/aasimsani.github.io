export interface Post {
  slug: string;
  title: string;
  description: string;
  published: string; // ISO date, used for sorting + article:published_time
  displayDate: string;
  readingTime: string;
  ogImage: string;
}

export const posts: Post[] = [
  {
    slug: "inattentional-blindness",
    title: "Your Startup Isn't Slow. It's Blind.",
    description:
      "Inattentional blindness — the psychology of missing what's right in front of you — is quietly taxing your engineering velocity. What a decade across three startups taught me about why good developers miss obvious things, and the two-person fix that works.",
    published: "2026-07-10",
    displayDate: "July 10, 2026",
    readingTime: "15 min read",
    ogImage: "/images/blog/inattentional-blindness-og.png",
  },
];
