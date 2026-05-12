export type Award = {
  title: string;
  logo: string;
  link: string;
  description: string;
  mat?: "dark" | "white" | "cream";
};

export const awards: Award[] = [
  {
    title: "Forbes 30 under 30 - Education (2021)",
    logo: "/images/forbes30u30.png",
    link: "https://www.forbes.com/30-under-30/2021/education/?profile=orai",
    description:
      "I am part of the Forbes30u30 list for 2021 in the education category for my work on Orai.",
  },
  {
    title: "Techstars x Comcast LIFT Labs (2018)",
    logo: "/images/techstars.png",
    link: "https://lift.comcast.com/2018/08/17/orai-the-cure-for-public-speaking-phobias/",
    description:
      "I went through Techstars, one of the world's top startup accelerator programs, in 2018 with Orai as part of Comcast LIFT Labs' inaugural cohort.",
  },
  {
    title: "ODF14: OnDeck Founders (2022)",
    logo: "/images/ondeck.png",
    link: "https://od.me/a",
    description:
      "I am part of the 14th class of the OnDeck Founders community a curated community designed to increase your odds of building a successful venture-backed company.",
    mat: "bleed",
  },
  {
    title: "Full Stack Deep Learning Best Projects (Spring 2021)",
    logo: "/images/fsdl.png",
    link: "https://fullstackdeeplearning.com/spring2021/projects/",
    description:
      "I was selected as one of the top 10 projects out of 271 projects in the Full Stack Deep Learning X Berkley course held in Spring 2021.",
  },
  {
    title: "Mass Challenge",
    logo: "/images/mc.png",
    link: "https://masschallenge.org/news/masschallenge-announces-2017-class-startups-boston-israel-switzerland/",
    description:
      "I was part of the Mass Challenge accelerator program in 2017 that accepts top founders from around the world and provides access to the tools, resources, mentorship, and opportunities innovators need to make transformational impact.",
  },
  {
    title: "Creative Destruction Labs",
    logo: "/images/cdl.png",
    link: "https://creativedestructionlab.com/companies/?stream=artificial-intelligence",
    description:
      "Orai was a Finalist in the Creative Destruction Labs Toronto in 2018.",
  },
  {
    title: "Hack Princeton (Fall 2018)",
    logo: "/images/hackprinceton.png",
    link: "https://devpost.com/software/hackprinceton2018-fall",
    description:
      "I participated in the Hack Princeton hackathon in the Fall of 2018 and won the best use of Google Cloud Platform award.",
  },
];
