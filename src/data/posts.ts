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
];
