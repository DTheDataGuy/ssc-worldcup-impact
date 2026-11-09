// The Impact Story: one narrative in four chapters, following the flow of Visit Seattle's
// Sept. 22, 2026 release and the SeattleFWC26 Executive Summary, as Jo and April asked.
// Every figure is pulled by id from the verified data bank (data.js). Quotes are word for word.
// {{KEY}} in a paragraph renders as a source chip for KIT.sources[KEY].

KIT.prologue = {
  kicker: "Prologue · 22 days on the world stage",
  lead: "For 22 days, the world watched as our city stood out as a premier host.",
  leadSrc: "VS",
  body: "Seattle hosted six matches, eight national teams and fans from around the world. This is the story of what that summer generated for our economy, how it reached every corner of the region, who it brought together, and what it leaves behind for the next generation.",
  figs: ["days", "matches", "teams", "hostcity"]
};

KIT.chapters = [
  {
    id: "ch-economy", n: "01", name: "Economic impact", verb: "What it generated",
    head: "$889 million for Seattle and King County, a \u201cgreater-than-expected total.\u201d",
    hero: "impact",
    paras: [
      "Visit Seattle estimates the tournament generated $889 million in total economic impact for Seattle and King County. That includes $109 million in state and local tax revenue, benefiting key government programs such as housing, social services, and the arts. The tournament also supported about 20,000 jobs. {{VS}}",
      "Behind the total is spending by visitors and by the event itself. The SeattleFWC26 Final Report counts $513.3 million in off-site visitor spending and $110.6 million in operational spending. The tournament touched nearly every part of the region, from airports and hotels to restaurants and neighborhood business districts. {{LOC}}",
      "It also came in higher than expected. Visit Seattle's forecast moved from $929 million in December 2024 to $846 million in March 2026, then landed at $889 million. Visit Seattle credits a larger contingent of international fans, more overnight visitors at watch parties than anticipated, and a second U.S. Men's National Team match. {{PRE}} {{VS}}"
    ],
    figs: ["tax", "jobs", "offsite", "ops"],
    honest: {
      h: "The full hospitality picture",
      t: "Results were mixed. Some businesses reported record days and weeks while others saw year-over-year dips. Hotel occupancy declined as cruise and convention travel were displaced, but higher room rates drove a year-over-year rise in overall revenue. June and July were the first two months in Seattle history with an average daily rate above $300.",
      srcs: ["VS", "VSSUM"],
      figs: ["adr300", "hrev", "occ"]
    },
    means: "Large events and the hospitality industry, working together, move the regional economy and generate revenue for the public programs residents rely on.",
    visual: "trail",
    quotes: [2]
  },
  {
    id: "ch-region", n: "02", name: "Regional & local impact", verb: "Where it reached",
    head: "It moved through the whole region, by train, bus, boat and on foot.",
    paras: [
      "The impact didn't stay inside the stadium. Four out of five ticketed fans arrived without a personal car. {{LOC}} On July 6, Link light rail carried 309,000 riders, a Sound Transit all-time record; the record before the tournament was 225,000, set at the Seahawks parade. Across the six match days, King County Metro and Sound Transit logged 3.4 million boardings. {{STDEB}} {{KCM}}",
      "Downtown became the region's gathering place. More than 3 million visitors came downtown on the six match days, and foot traffic rose 17% over the same days in 2025. Watch parties at Occidental Square and Westlake Park drew 565,271 visits. {{LEG}} {{DSA}}",
      "Neighborhoods and small businesses felt it too. Pioneer Square counted 149,800 domestic visitors on June 19, the highest since DSA began recording in 2019, and pedestrian traffic in the Chinatown–International District rose 10%. SeattleFWC26 supported more than 350 small businesses. {{LOCGS}} {{LOC}}"
    ],
    figs: ["nocar", "link", "downtown", "foot17", "ps149", "smallbiz"],
    honest: {
      h: "What the neighborhoods taught us",
      t: "SeattleFWC26 found that small businesses nearest the event, close to transit, or along pedestrian approaches benefited from fan traffic, while others may do better with strategies to keep regular customers visiting. In the report's words: \u201cjust one block makes a big difference in fan traffic.\u201d",
      srcs: ["LOC"]
    },
    means: "Great transit and inviting public spaces let a major event lift downtown, the neighborhoods and small businesses, not just the stadium district.",
    visual: "link",
    quotes: [8, 6]
  },
  {
    id: "ch-community", n: "03", name: "Community engagement", verb: "Who it brought together",
    head: "The world came to Seattle, and Seattle showed up.",
    paras: [
      "Seattle Stadium hosted six matches and 401,400 ticketed fans, with eight national teams from four continental confederations. The U.S. Men's National Team played here twice, including the Juneteenth Match Day against Australia, and Egypt vs. IR Iran was Seattle's Pride Match. {{LOC}} {{FIFA}} {{LEG}}",
      "The celebration reached far past the stadium gates. More than 1.2 million people attended Seattle's official fan sites, more than 70,000 attended fan zones across the state, and more than 70,000 fans marched to matches, including the two largest fan marches in Seattle history. More than 2,000 volunteers from around the state helped welcome them. {{LOC}} {{LEG}}",
      "The world noticed. Seattle ranked as the No. 1 U.S. host city for fans on the Action Network Fan Experience Index and No. 1 for stadium experience from The Athletic and The New York Times, and six first-ever post-match drone scoreboards generated 767 million global impressions. {{LOC}}"
    ],
    figs: ["fans", "fansites", "statefz", "march", "vols", "fancity"],
    fun: ["dimsum", "lesson", "waterfront", "taxi", "impressions", "markets"],
    means: "Hosting the world renewed civic pride in the place we call home and put Seattle's neighborhoods, cultures and hospitality in front of a global audience.",
    visual: "matches",
    quotes: [9, 3]
  },
  {
    id: "ch-legacy", n: "04", name: "Lasting legacy", verb: "What it leaves behind",
    head: "The final whistle was just the beginning.",
    headSrc: "LOC",
    paras: [
      "SeattleFWC26 created more than 35 community and legacy projects. A promise of 26 community soccer fields grew into 52 permanent RAVE Foundation playfields for free play across Washington, and more than 1,400 young people and caregivers got free tickets and support to attend matches through the tournament's largest youth program. {{LOC}} {{LEG}}",
      "The investments reach well beyond soccer: more than 50 art and cultural projects, a Pacific Northwest hub for USABA Blind Soccer, upgraded facilities at UW, SU, GU and Lumen Field, more than 2,500 training licenses to identify and prevent human trafficking, support for MLK Labor's launch of UNtemp, and five community playbooks. {{LOC}}",
      "It also leaves Seattle ready for what's next. SeattleFWC26's lessons call for earlier decisions, streamlined permitting, planning block by block, and a standing organizing structure that keeps relationships and know-how in place for future major events. Visit Seattle expects the global exposure to drive visitation to the region for years to come. {{LOC}} {{VS}}"
    ],
    figs: ["legacy", "pitches", "youth", "art", "traffick", "playbooks", "usaba", "facil"],
    means: "Seattle keeps the places to play, the programs for young people, and the experience to compete for the next major event.",
    visual: "legacy",
    quotes: [0, 1]
  }
];

KIT.storyLines = [
  { n: "01", name: "Economic impact", line: "An estimated $889M in total economic impact, $109M in state and local taxes, and about 20,000 jobs supported." },
  { n: "02", name: "Regional & local", line: "4 of 5 fans arrived without a car, Link set a 309K one-day record, and 3M+ visitors came downtown on match days." },
  { n: "03", name: "Community", line: "401,400 ticketed fans, 1.2M+ at Seattle fan sites, 2,000+ volunteers, and the No. 1 U.S. host city for fans." },
  { n: "04", name: "Legacy", line: "35+ community and legacy projects, 52 playfields, and 1,400+ youth and caregivers at matches." }
];

// Story slides for the Infographic Studio. One per chapter, plus the lessons.
KIT.takeaways = [
  { eyebrow: "Chapter 1 of 4 · Economic impact", t: "What it generated.", srcs: ["VS"], figs: ["tax", "jobs", "offsite"],
    text: "An estimated $889M in total economic impact for Seattle & King County, including $109M in state and local tax revenue, and about 20,000 jobs supported. Visit Seattle calls it a \u201cgreater-than-expected total.\u201d" },
  { eyebrow: "Chapter 2 of 4 · Regional & local impact", t: "Where it reached.", srcs: ["LOC", "LEG"], figs: ["nocar", "link", "downtown", "smallbiz"],
    text: "Four out of five ticketed fans arrived without a personal car. Link light rail set a one-day record of 309K riders, and more than 3M visitors came downtown on match days." },
  { eyebrow: "Chapter 3 of 4 · Community engagement", t: "Who it brought together.", srcs: ["LOC"], figs: ["fans", "fansites", "vols", "fancity"],
    text: "401,400 ticketed fans across six matches, more than 1.2M attendees at Seattle fan sites, and 2,000+ volunteers from around the state. Seattle ranked No. 1 among U.S. host cities for fans." },
  { eyebrow: "Chapter 4 of 4 · Lasting legacy", t: "What it leaves behind.", srcs: ["LOC", "LEG"], figs: ["legacy", "pitches", "youth", "art"],
    text: "More than 35 community and legacy projects, including 52 RAVE Foundation playfields and free tickets and support for more than 1,400 young people and their caregivers." },
  { eyebrow: "Looking ahead", t: "The lessons are part of the win.", srcs: ["VS", "LOC"], figs: ["occ", "hrev"],
    text: "Hospitality results were mixed, and hotel occupancy fell even as revenue rose. SeattleFWC26's lessons, like \u201cjust one block makes a big difference in fan traffic,\u201d point the way for the next major event." }
];

// Which chapter each quote in KIT.quotes fits best (index in KIT.chapters).
KIT.quoteChapter = { 0:3, 1:3, 2:0, 3:2, 4:1, 5:0, 6:1, 7:1, 8:1, 9:2 };

// Data bank follows the story: categories in chapter order, each tagged with its chapter.
KIT.catChapter = { headline:0, economy:0, hotels:0, transit:1, downtown:1, stadium:2, fans:2, records:2, region:2, legacy:3 };
(function(){
  const order = ['all','headline','economy','hotels','transit','downtown','stadium','fans','records','region','legacy'];
  KIT.cats.sort((a,b) => order.indexOf(a.id) - order.indexOf(b.id));
  KIT.stats.sort((a,b) => order.indexOf(a.cat) - order.indexOf(b.cat));
  // Media angles in chapter order
  const angCh = [0,1,1,0,3,2,2,3];
  KIT.angles.forEach((a,i) => a.ch = angCh[i]);
  KIT.angles.sort((a,b) => a.ch - b.ch);
})();
