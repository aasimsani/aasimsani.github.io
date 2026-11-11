import type { Mat } from "./mat";

// Each entry is a name, when it happened, and one line that adds something the
// name doesn't already say.
export type Award = {
  title: string;
  when: string;
  logo: string;
  link: string;
  description: string;
  mat?: Mat;
};

export const awards: Award[] = [
  {
    title: "Forbes 30 Under 30",
    when: "2021",
    logo: "/images/forbes30u30.webp",
    link: "https://www.forbes.com/30-under-30/2021/education/?profile=orai",
    description: "Named to the Education list for Orai.",
  },
  {
    title: "Techstars × Comcast LIFT Labs",
    when: "2018",
    logo: "/images/techstars.webp",
    link: "https://lift.comcast.com/2018/08/17/orai-the-cure-for-public-speaking-phobias/",
    description: "The accelerator’s inaugural cohort, with Orai.",
  },
  {
    title: "OnDeck Founders",
    when: "2022",
    logo: "/images/ondeck.webp",
    link: "https://od.me/a",
    description: "Class ODF14, with CopyCat.",
    mat: "bleed",
  },
  {
    title: "Full Stack Deep Learning × Berkeley",
    when: "Spring 2021",
    logo: "/images/fsdl.webp",
    link: "https://fullstackdeeplearning.com/spring2021/projects/",
    description: "Best Projects: top 10 of 271.",
  },
  {
    title: "MassChallenge",
    when: "2017",
    logo: "/images/mc.webp",
    link: "https://masschallenge.org/news/masschallenge-announces-2017-class-startups-boston-israel-switzerland/",
    description: "Accelerator cohort in Boston.",
  },
  {
    title: "Creative Destruction Lab",
    when: "2018",
    logo: "/images/cdl.webp",
    link: "https://creativedestructionlab.com/companies/?stream=artificial-intelligence",
    description: "Finalist at CDL Toronto, with Orai.",
  },
  {
    title: "HackPrinceton",
    when: "Fall 2018",
    logo: "/images/hackprinceton.webp",
    link: "https://devpost.com/software/hackprinceton2018-fall",
    description: "Best Use of Google Cloud Platform.",
  },
];
