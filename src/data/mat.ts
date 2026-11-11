// How a logo sits in its circle. "bleed" is the default and fills the circle
// edge to edge. The others shrink the logo onto a backing mat of that color,
// styled by .logo-mark[data-mat] in src/styles/global.css.
export type Mat = "bleed" | "paper" | "dark" | "white";
