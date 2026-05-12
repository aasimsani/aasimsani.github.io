export type Education = {
  school: string;
  logo: string;
  link: string;
  description: string;
  mat?: "dark" | "white" | "cream";
};

export const education: Education[] = [
  {
    school: "Georgia Tech",
    logo: "/images/gatech.png",
    link: "https://www.cc.gatech.edu/",
    description: `I'm pursuing my M.S. in Computer Science at Georgia Tech with a specialization in Computing Systems &mdash; partly to formalize my CS background, partly to challenge myself with something genuinely hard.`,
    mat: "white",
  },
  {
    school: "Drexel University",
    logo: "/images/drexel.png",
    link: "https://www.drexel.edu/close/",
    description: `I studied Entrepreneurship and Computer Science with minors in Marketing and Health Innovations while on a 60% scholarship at Drexel University. I was part of the <a href="https://drexel.edu/close/">Charles D. Close School of Entrepreneurship</a> which is the world's only dedicated college of entrepreneurship and is <a href="https://www.princetonreview.com/college-rankings?rankings=top-50-entrepreneurship-ugrad">ranked #16 globally by the Princeton Review and is #2 in the mid-Atlantic region.</a> It's was an intense but amazing experience that allowed me to run Orai while studying and work on research, created amazing projects and cycle around Philadelphia a lot!`,
    mat: "bleed",
  },
  {
    school: "Mahindra United World College of India",
    logo: "/images/muwci.png",
    link: "https://uwcmahindracollege.org/",
    description: `I went to Mahindra United World College to do my IB diploma for the last two years of high school on a 50% scholarship. It is one of 18 schools across the world that <a href="https://www.uwc.org/">"makes education a force to unite people, nations and cultures for peace and a sustainable future."</a> I was a part of the Class of 2016, which consisted of 120 students with more than 60 different countries represented in one year from socio-economic backgrounds spanning children from the village next to the school all the way to royalty. It was a fantastic experience that allowed me to make friends from all around the world and learn about their cultures and ways of life.`,
  },
];
