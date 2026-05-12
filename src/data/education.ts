export type Education = {
  school: string;
  logo: string;
  link: string;
  description: string;
  mat?: "dark" | "white" | "cream" | "bleed";
};

export const education: Education[] = [
  {
    school: "Georgia Tech",
    logo: "/images/gatech.png",
    link: "https://www.cc.gatech.edu/",
    description: `I'm pursuing my M.S. in Computer Science at Georgia Tech with a specialization in Computing Systems: partly to formalize my CS background, partly to challenge myself with something genuinely hard.`,
    mat: "white",
  },
  {
    school: "Drexel University",
    logo: "/images/drexel.png",
    link: "https://www.drexel.edu/close/",
    description: `I studied Entrepreneurship and Computer Science with minors in Marketing and Health Innovations on a 60% scholarship at Drexel. I was part of the <a href="https://drexel.edu/close/">Charles D. Close School of Entrepreneurship</a>, the world's only dedicated college of entrepreneurship, <a href="https://www.princetonreview.com/college-rankings?rankings=top-50-entrepreneurship-ugrad">ranked #16 globally by the Princeton Review and #2 in the mid-Atlantic region</a>. It was the right kind of intense: Orai got funded out of my dorm room, the research got published, the projects shipped. I also cycled around Philadelphia a lot.`,
    mat: "bleed",
  },
  {
    school: "Mahindra United World College of India",
    logo: "/images/muwci.png",
    link: "https://uwcmahindracollege.org/",
    description: `Two years of IB at Mahindra United World College (50% scholarship). One of 18 schools worldwide that <a href="https://www.uwc.org/">"makes education a force to unite people, nations and cultures for peace and a sustainable future."</a> My class: 120 students from 60+ countries, village kids next to royalty, on a campus that lives the UWC values of international understanding, service, and personal challenge. The IB diploma was the smallest thing I took away.`,
  },
];
