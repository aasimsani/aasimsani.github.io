export type ResearchEntry = {
  title: string;
  logo: string;
  link?: string;
  linkLabel?: string;
  paragraphs: string[];
  mat?: "dark" | "white" | "cream" | "bleed";
};

export const research: ResearchEntry[] = [
  {
    title: "Founderitis a silent killer of startups",
    logo: "/images/founderitis.png",
    link: "https://eiexchange.com/content/Founderitis-a-silent-killer-of-startups",
    linkLabel: "Read the case study",
    paragraphs: [
      `A case study I wrote based on my own personal experiences through Orai and our founder struggles that shows how power imbalances within teams can result in catastrophic and cascading failures.`,
    ],
  },
  {
    title: "Activating Entrepeneurship",
    logo: "/images/drexel.png",
    mat: "bleed",
    paragraphs: [
      `"Activating Entrepreneurship: revisiting the theories of planned behavior & the entrepreneurial event through an analysis of the moderating & mediating effects of entrepreneurial dimensions on self-efficacy & initial intentions to launch" is a research study I did with Dr Zahed Subhan, Dr. Liza Herzog and Dr. David Hayes.`,
      `The study focused on performing a statistical moderation and mediation analysis on specific psychometric characteristics of college students, such as "Resilience" and their influence on the decision to launch a startup.`,
    ],
  },
];
