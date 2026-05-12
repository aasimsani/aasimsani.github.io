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
    title: "Founderitis: a silent killer of startups",
    logo: "/images/founderitis.png",
    link: "https://eiexchange.com/content/Founderitis-a-silent-killer-of-startups",
    linkLabel: "Read the case study",
    paragraphs: [
      `A case study from my own experience with Orai &mdash; how power imbalances inside a founding team cascade into catastrophic failure.`,
    ],
  },
  {
    title: "Activating Entrepreneurship",
    logo: "/images/drexel.png",
    mat: "bleed",
    paragraphs: [
      `With Drs. Zahed Subhan, Liza Herzog, and David Hayes &mdash; a moderation/mediation analysis of how psychometric traits like resilience shape college students' decision to launch a startup.`,
      `<em>Full title:</em> "Activating Entrepreneurship: revisiting the theories of planned behavior &amp; the entrepreneurial event through an analysis of the moderating &amp; mediating effects of entrepreneurial dimensions on self-efficacy &amp; initial intentions to launch."`,
    ],
  },
];
