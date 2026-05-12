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
      "Global sales tax solved &mdash; we automate compliance, saving finance teams time and money.",
    stage: "sprouting",
    mat: "bleed",
    paragraphs: [
      `After seven years in AI I wanted to build something with real economic gravity &mdash; boring technology that moves money. Tax compliance is the most-overlooked layer in the modern commerce stack.`,
      `I joined as the first engineer and built the plumbing that makes global sales tax actually work inside finance and commerce stacks. <strong>Ingestion:</strong> connectors for Stripe, QuickBooks, Shopify, and Rillet &mdash; webhooks, historical backfill, and a reconciliation system that catches drift. <strong>Compute:</strong> the global nexus engine, the US sales tax engine, and a multi-currency exchange layer. <strong>Ops:</strong> a Temporal-driven backfill orchestrator, an RWX-based CI/CD pipeline, and an internal Slack <code>/deploy</code> bot. Python, DuckDB, PostgreSQL, Temporal.`,
    ],
  },
  {
    company: "CopyCat",
    logo: "/images/copycat.png",
    link: "https://copycat.dev",
    dates: "Jan 2021 - Jan 2024",
    role: "Co-founder & Chief AI Officer",
    tagline: "Convert your Figma designs to React.js code in 30 seconds using AI",
    stage: "evergreen",
    mat: "bleed",
    paragraphs: [
      `At our previous company, the designer-developer handoff broke the front-end pipeline. We started CopyCat to fix it.`,
      `We built CopyCat: a generative-AI Figma &rarr; React.js compiler that cut web build time by 80%. It reached 20k+ developers.`,
    ],
  },
  {
    company: "Orai, Inc.",
    logo: "/images/orai.png",
    link: "https://orai.com",
    dates: "Nov 2016 - Dec 2020",
    role: "Intern → Product Manager → Co-founder",
    tagline: "An AI speech coach for the other 95% who can't afford a human one.",
    stage: "evergreen",
    mat: "bleed",
    paragraphs: [
      `My co-founders and I started Orai because of our experiences as ESL students in the United States. When we came to Drexel, we could speak English fluently, yet we weren't expressive and confident enough, and because of this, we were limited both personally and professionally. We lost friends, internships, and jobs to this problem.`,
      `We tried books, online courses, Toastmasters, and finally a speech coach who offered to coach us for free. When we found out <a href="https://www.speak-simple.com/presentation-coach-cost/">a speech coach can charge close to $5,000 for that one-hour session</a>, we built an app that did the same job at a tiny fraction of the cost. Orai scaled to 1M+ users and was adopted by Comcast, IBM, Nike, and HPE. We raised $2.3M from <a href="https://comcastventures.com/portfolio/">Comcast Ventures</a>, <a href="https://menlovc.com/">Menlo VC</a>, and <a href="https://www.bdmifund.com/">BDMI Ventures</a>.`,
    ],
  },
];
