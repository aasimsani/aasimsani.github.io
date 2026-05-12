export type Award = {
  title: string;
  logo: string;
  link: string;
  description: string;
  mat?: "dark" | "white" | "cream";
};

export const awards: Award[] = [
  {
    title: "Forbes 30 Under 30 — Education (2021)",
    logo: "/images/forbes30u30.png",
    link: "https://www.forbes.com/30-under-30/2021/education/?profile=orai",
    description:
      "Named to the 2021 Forbes 30 Under 30 in Education for Orai.",
  },
  {
    title: "Techstars x Comcast LIFT Labs (2018)",
    logo: "/images/techstars.png",
    link: "https://lift.comcast.com/2018/08/17/orai-the-cure-for-public-speaking-phobias/",
    description:
      "Techstars Comcast LIFT Labs accelerator. Inaugural cohort, 2018.",
  },
  {
    title: "ODF14: OnDeck Founders (2022)",
    logo: "/images/ondeck.png",
    link: "https://od.me/a",
    description:
      "OnDeck Founders, class of ODF14 (2022).",
    mat: "bleed",
  },
  {
    title: "Full Stack Deep Learning Best Projects (Spring 2021)",
    logo: "/images/fsdl.png",
    link: "https://fullstackdeeplearning.com/spring2021/projects/",
    description:
      "Top 10 of 271 projects, Full Stack Deep Learning x Berkeley, Spring 2021.",
  },
  {
    title: "Mass Challenge",
    logo: "/images/mc.png",
    link: "https://masschallenge.org/news/masschallenge-announces-2017-class-startups-boston-israel-switzerland/",
    description:
      "Mass Challenge accelerator, 2017 cohort. Boston.",
  },
  {
    title: "Creative Destruction Labs",
    logo: "/images/cdl.png",
    link: "https://creativedestructionlab.com/companies/?stream=artificial-intelligence",
    description:
      "Finalist, Creative Destruction Lab Toronto, 2018 (with Orai).",
  },
  {
    title: "Hack Princeton (Fall 2018)",
    logo: "/images/hackprinceton.png",
    link: "https://devpost.com/software/hackprinceton2018-fall",
    description:
      "Hack Princeton, Fall 2018 — Best Use of Google Cloud Platform.",
  },
];
