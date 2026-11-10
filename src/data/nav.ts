// The homepage's sections, in page order. Everything that walks the sections
// reads this one list: the page itself, the sticky nav and the phone menu, the
// "Zone N" labels on the headings, and the After hours game, which puts a
// mini-boss at each section. To reorder the page, reorder this list.
//
// `id` is the section's anchor. `title` is its heading. `short` is the nav
// label where the heading is too long for the bar, and it always starts the
// same way as the heading, so a link reads like the place it leads to.
export type Section = {
  id: string;
  title: string;
  short?: string;
};

export const nav: Section[] = [
  { id: "experience", title: "Work" },
  { id: "writing", title: "Writing" },
  { id: "projects", title: "Projects" },
  { id: "publicspeaking", title: "Talks" },
  { id: "news", title: "Press" },
  { id: "awards", title: "Awards and Accelerators", short: "Awards" },
  { id: "education", title: "Education" },
  { id: "research", title: "Research" },
];

/** The stops on the game's road: every section, then the footer, where the final boss waits. */
export const zoneIds = [...nav.map((s) => s.id), "footer"];
