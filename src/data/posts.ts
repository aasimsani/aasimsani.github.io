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
  // new-post:insert
  {
    slug: "inattentional-blindness",
    title: "Your Startup Isn't Slow. It's Blind.",
    description:
      "Good engineers miss obvious things, and the misses quietly slow the roadmap. The psychology of inattentional blindness, a decade of case files, and the two-person structure that catches what one pair of eyes can't.",
    published: "2026-10-20",
    displayDate: "October 20, 2026",
    readingTime: "23 min read",
    ogImage: "/images/blog/inattentional-blindness-og.png?v=2",
  },
];
