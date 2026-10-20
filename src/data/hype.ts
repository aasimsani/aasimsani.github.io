// Copy for the hero's hype slider. Stop 1 is the default and is the original
// whoami, so a visitor who never touches the slider reads the human version. Every claim
// traces back to src/data/*.ts; only the tone changes between stops.
export type HypeStop = {
  label: string;
  html: string;
};

export const hypeLabels = { less: "Touch grass", more: "Thought leader" };

export const hypeDefault = 1;

export const hypeStops: HypeStop[] = [
  {
    label: "Touched grass",
    html: `I write software and I've started a couple of companies. I ride bikes, make pottery and have climbed a few hills.`,
  },
  {
    label: "Normal human",
    html: `<p>I'm the founding engineer at <a href="https://taxwire.com">Taxwire</a>, where we automate global sales tax compliance, saving finance teams time and money.</p><p>Before this I co-founded <a href="https://orai.com">Orai</a> (Techstars '18, <a href="https://www.forbes.com/30-under-30/2021/education/?profile=orai">Forbes 30 Under 30 in Education</a>), an AI public speaking coach that scaled to 1M+ users. I also co-founded <a href="https://copycat.dev">CopyCat</a>, a generative-AI Figma &rarr; React.js compiler that cut front-end build time by 80% for 20k+ developers. (OnDeck 14, VC-backed.)</p><p>Outside work: ex-pro cyclist, certified mountaineer. I read a lot (<a href="https://www.goodreads.com/user/show/67959119-aasim-sani">Goodreads</a>).</p>`,
  },
  {
    label: "Hireable",
    html: `Two-time AI founder. <a href="https://www.forbes.com/30-under-30/2021/education/?profile=orai">Forbes 30 Under 30</a>. First engineer at <a href="https://taxwire.com">Taxwire</a>. I've scaled a product to a million users, raised $2.3M, and shipped a compiler that 20,000 developers used. Today I build tax engines that are fast and correct, and I'm building with AI again.`,
  },
  {
    label: "Thought leader",
    html: `🚀 Thrilled to share that I'm the Founding Engineer at <a href="https://taxwire.com">Taxwire</a>! As a 2x founder and Forbes 30 Under 30 honoree, I'm passionate about building high-performance, compliant systems at scale. Grateful for the journey from intern to co-founder. Let's connect! #AI #Founder #Leadership`,
  },
  {
    label: "Agree? 👇",
    html: `AGREE? 👇 Founder. Builder. Disruptor. Cyclist. &lt;insert synergy here&gt;. 1M users ✅ $2.3M raised ✅ Forbes 30U30 ✅ Sleep ❌ I don't write code, I architect paradigms. Compliance isn't a feature, it's a lifestyle. AI isn't a tool, it's a journey 🚀 #Hustle #ThoughtLeadership #AI #Grateful #OpenToSynergy #Web4 #&lt;insert buzzword&gt; #BlessedAndHighlyLeveraged`,
  },
];
