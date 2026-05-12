export type Experience = {
  company: string;
  logo: string;
  link?: string;
  dates: string;
  role: string;
  tagline?: string;
  subTagline?: string;
  paragraphs: string[];
  stage: "sprouting" | "tending" | "evergreen" | "composted";
  mat?: "dark" | "white" | "cream";
};

export const experience: Experience[] = [
  {
    company: "Taxwire",
    logo: "/images/taxwire.png",
    link: "https://taxwire.com",
    dates: "Jan 2024 - present",
    role: "Founding Engineer (1st employee)",
    tagline:
      "Automate global sales tax compliance across your finance and commerce stack",
    stage: "sprouting",
    mat: "bleed",
    paragraphs: [
      `Honestly, I never thought I'd end up in fintech. But after 7 years in AI, I wanted to build something more tangible: a kind of boring technology with real economic gravity behind it.`,
      `So I joined <a href="https://taxwire.com">Taxwire</a> as its first engineer, and I've been building the plumbing that makes global sales tax actually work inside finance and commerce stacks &mdash; a real-time tax calculation API, bulk-ingestion integrations with Stripe, QuickBooks, and Shopify, a global nexus engine, the US sales tax engine itself, and a multi-currency exchange engine &mdash; mostly in Python, DuckDB, and PostgreSQL.`,
    ],
  },
  {
    company: "CopyCat",
    logo: "/images/copycat.png",
    link: "https://copycat.dev",
    dates: "Jan 2021 - Jan 2024",
    role: "Co-founder & Chief AI Officer",
    tagline: "Convert your Figma designs to React.js code in 30 seconds using AI",
    subTagline: "(Github Co-pilot but for converting designs to code)",
    stage: "evergreen",
    mat: "bleed",
    paragraphs: [
      `My co-founder and I were inspired to start CopyCat after our (painful) experiences fixing issues with the speed of the front-end development process in our previous company. Where the main culprit was the designer-developer handoff process.`,
      `So we made CopyCat, a product that converts Figma designs directly to code (React.js) to speed up the development process of a web page by up to 80%. Which has got more than 20k+ users worldwide.`,
    ],
  },
  {
    company: "Orai, Inc.",
    logo: "/images/orai.png",
    link: "https://orai.com",
    dates: "Nov 2016 - Dec 2020",
    role: "Intern → Product Manager → Co-founder",
    tagline: "An AI powered speech coaching app",
    subTagline: "(Think Duolingo but for Public speaking)",
    stage: "evergreen",
    mat: "bleed",
    paragraphs: [
      `My co-founders and I started Orai because of our experiences as ESL students in the United States. When we came to Drexel, we could speak English fluently, yet we weren't expressive and confident enough, and because of this, we were limited both personally and professionally. We lost friends, internships, and jobs to this problem.`,
      `So we tried books, online courses, toastmasters, and finally, a speech coach who offered to coach us for free to fix the issue. Yet when we discovered that a speech coach can charge close to $5000 for that one-hour session, we decided to make an app that could make this quintessential skill accessible to everyone for a lot less. As of today, Orai has scaled to 500k+ users globally, has been adopted by large enterprises such as <u>Comcast, IBM, Nike and HPE</u>. We also fundraised $2.3M from top VC firms such as <a href="https://comcastventures.com/portfolio/">Comcast Ventures</a>, <a href="https://menlovc.com/">Menlo VC</a> and <a href="https://www.bdmifund.com/">BDMI Ventures</a>.`,
    ],
  },
];
