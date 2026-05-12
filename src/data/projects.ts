export type Project = {
  title: string;
  logo?: string;
  logoFallback?: "terminal";
  link?: string;
  linkLabel?: string;
  github?: string;
  githubExtra?: { label: string; href: string };
  paragraphs: string[];
  extraHeadline?: string;
};

export const projects: Project[] = [
  {
    title: "MeowLearning",
    logo: "/images/meowlearning.png",
    link: "https://github.com/aasimsani/meow-learning",
    linkLabel: "See on Github",
    github: "aasimsani/meow-learning",
    paragraphs: [
      `This is a pick-your-problem style guide I created to educate everyone, from my leadership team to my ML engineers on working with AI in production settings. This is the stuff you won't learn in most ML/AI courses.`,
    ],
  },
  {
    title: "Artificial Manga Panel Dataset",
    logo: "/images/ampd.png",
    link: "https://github.com/aasimsani/artificial_manga_panel_dataset",
    linkLabel: "See on Github",
    github: "aasimsani/artificial_manga_panel_dataset",
    paragraphs: [
      `I love manga, but I can't read Japanese &mdash; and Google Translate's OCR + translation pipeline isn't great with manga text. So I set out to build a speech-bubble detector to localize manga into English faster (which would also help official translators). There was no free, publicly available dataset to train it on, so I generated one.`,
    ],
  },
  {
    title: "Second Brain Slipbox",
    logo: "/images/secondbrain.png",
    link: "https://www.linkedin.com/posts/aasimsani_secondbrain-slipbox-knowledge-activity-6962170106504167424-_HKW/",
    linkLabel: "Sneak a peek of my second brain",
    paragraphs: [
      `Why build a <a href="https://www.buildingasecondbrain.com/">Second Brain</a>? Even though I have a good memory, it isn't enough to solve problems fast. I'm an avid reader and podcast listener, yet so much of what I consumed was getting lost. So I built this system based on the <a href="https://zettelkasten.de/posts/overview/">Slipbox Method (Zettelkasten)</a> to organize my knowledge in an interconnected way.`,
    ],
  },
  {
    title: "gwt — Git Worktree Manager",
    logoFallback: "terminal",
    link: "https://github.com/aasimsani/gwt-zsh",
    linkLabel: "See on Github",
    github: "aasimsani/gwt-zsh",
    githubExtra: {
      label: "PowerShell port",
      href: "https://github.com/aasimsani/gwt-powershell",
    },
    paragraphs: [
      `Stupidly simple git worktree management for ZSH (and PowerShell). Smart branch naming, interactive pruning, and automatic config copying so you can hop between parallel workstreams without losing your shell setup. Built because I kept losing track of half-finished branches and re-cloning repos to escape merge-conflict purgatory.`,
    ],
  },
  {
    title: "ML Project Template",
    logo: "/images/copycat.png",
    link: "https://github.com/aasimsani/ml_project_template",
    linkLabel: "See on Github",
    github: "aasimsani/ml_project_template",
    paragraphs: [
      `An open-source template repository to kickstart new Machine Learning projects in a standardized way. Originally built for CopyCat's ML team (saving ~2 hours per project), it works for any ML team that wants a repeatable starting point.`,
    ],
  },
  {
    title: "Agile Connects",
    logo: "/images/agileconnects.png",
    link: "https://www.agileconnects.com/",
    extraHeadline: "Energy savings algorithm Development",
    paragraphs: [
      `I researched an algorithm for calculating the theoretical maximum possible energy savings and cost savings from air conditioning units which would use scheduling algorithms to turn on and off using AgileConnects' IOT products.`,
    ],
  },
];
