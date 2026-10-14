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
    logo: "/images/founderitis.webp",
    link: "https://eiexchange.com/content/Founderitis-a-silent-killer-of-startups",
    linkLabel: "Read the case study",
    paragraphs: [
      `A case study from my own experience with Orai: how power imbalances inside a founding team cascade into catastrophic failure.`,
      `Written with Chuck Sacco, it won a <a href="https://eiexchange.com/schulze-publication-awards#:~:text=2019-,EIX,A%20Silent%20Killer%20of%20Startups%20%2D%2D%20Chuck%20Sacco%20and%20Aasim%20Sani,-Applied/Practice">2019 Schulze Publication Award</a> from the Entrepreneur &amp; Innovation Exchange.`,
    ],
  },
];
