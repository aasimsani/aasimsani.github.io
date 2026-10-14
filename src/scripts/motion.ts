// Page-wide motion. Each section heading assembles its lantern pixel by pixel
// and lights it, then decodes its title out of shade glyphs. Card grids land in
// a ripple that spreads from their center. Hidden start states are added here,
// so readers without JS (or with reduced motion) see a finished page.
import { animate, createTimeline, onScroll, scrambleText, spring, stagger, steps } from "animejs";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Play once when the element's top crosses a line in the viewport. An element
// already past that line on load (a reload mid-page) plays right away, so
// nothing stays hidden.
function whenVisible(el: HTMLElement, line: string, play: () => void) {
  if (el.getBoundingClientRect().top < innerHeight * (parseFloat(line) / 100)) {
    play();
    return;
  }
  let done = false;
  onScroll({
    target: el,
    enter: `${line} top`,
    onEnter: () => {
      if (done) return;
      done = true;
      play();
    },
  });
}

function headings() {
  document.querySelectorAll<HTMLElement>("[data-heading]").forEach((h) => {
    const rects = h.querySelectorAll<SVGRectElement>(".lantern rect");
    const lit = h.querySelectorAll<SVGRectElement>(".lantern .flame, .lantern .core");
    const zone = h.querySelector<HTMLElement>(".zone");
    const title = h.querySelector<HTMLElement>(".heading-text");
    rects.forEach((r) => (r.style.opacity = "0"));
    if (zone) zone.style.opacity = "0";

    const play = () => {
      // The lantern build and title decode are game flourishes, so Serious mode skips them.
      if (document.documentElement.dataset.siteMode !== "afterhours") {
        rects.forEach((r) => (r.style.opacity = "1"));
        if (zone) zone.style.opacity = "1";
        return;
      }
      const tl = createTimeline({ defaults: { ease: "outQuad" } });
      // The frame builds bottom to top, one pixel block at a time.
      tl.add(rects, { opacity: [0, 1], duration: 1, delay: stagger(45, { reversed: true }) });
      tl.add(lit, { opacity: [0.2, 1, 0.6, 1], duration: 420, ease: steps(4) }, "-=80");
      if (zone) {
        tl.add(zone, { opacity: [0, 1], duration: 1 }, "<<");
        tl.add(zone, { innerHTML: scrambleText({ chars: "shades", from: "left" }) }, "<<");
      }
      if (title) tl.add(title, { innerHTML: scrambleText({ chars: "blocks", from: "left", perturbation: 0.3 }) }, "<<+=60");
    };
    whenVisible(h, "85%", play);
  });
}

function grids() {
  document.querySelectorAll<HTMLElement>(".awardsandinvolvements .grid, .projects .grid").forEach((grid) => {
    const items = Array.from(grid.children) as HTMLElement[];
    if (!items.length) return;
    items.forEach((el) => (el.style.opacity = "0"));
    const play = () => {
      const cols = getComputedStyle(grid).gridTemplateColumns.split(" ").length;
      const rows = Math.ceil(items.length / cols);
      animate(items, {
        opacity: [0, 1],
        scale: [0.82, 1],
        y: [18, 0],
        delay: stagger(70, { grid: [cols, rows], from: "center" }),
        ease: spring({ stiffness: 160, damping: 15 }),
      });
    };
    whenVisible(grid, "88%", play);
  });
}

if (!reduce) {
  headings();
  grids();
}
