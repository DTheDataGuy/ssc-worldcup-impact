# Seattle's World Cup: The Story Behind the Numbers

**SSC Business Data Report No. 01** · Built by [The Data Guys™](https://www.thedataguys.org) for the Seattle Sports Commission

[![Live site](https://img.shields.io/badge/live%20site-open-3FB8AF?style=for-the-badge)](https://dthedataguy.github.io/ssc-worldcup-impact/)
[![Full report](https://img.shields.io/badge/full%20report-read-14161A?style=for-the-badge)](https://dthedataguy.github.io/ssc-worldcup-impact/report.html)
[![Data](https://img.shields.io/badge/data-CSV-F2C14E?style=for-the-badge)](data.csv)

What the FIFA World Cup 2026™ generated for Seattle and King County, what it meant, and what it leaves behind. The headline: an estimated **$889 million** in total economic impact, including **$109 million** in state and local tax revenue, per [Visit Seattle and Tourism Economics](https://visitseattle.org/press/press-releases/visit-seattle-economic-impact-fifa-2026/) (Sept. 22, 2026).

## What's inside

| Section | What it does |
|---|---|
| Story | The impact told in chapters, from headline numbers to legacy |
| Infographic builder | Turns the story into a social carousel and exports images in the browser |
| Data bank | Every figure with its label, caption, use note, source and source date |
| Channel copy | Ready-to-post text for each social and press channel |
| Story angles and press prep | Eight angles by chapter and answers to likely reporter questions |
| Sources | Where every figure comes from |
| Printable report | [`report.html`](report.html) and a [PDF](assets/SSC-World-Cup-Impact-Story.pdf) |

## The data

[`data.csv`](data.csv) is the single source for every published number. Each row carries `value`, `label`, `publication_caption`, `use_note`, `source`, `source_date` and `source_url`, so a figure can be checked before it is reused. Use notes flag common mistakes, such as reading an economic-impact estimate as city revenue.

## Run it locally

It's a static site with no build step.

```bash
git clone https://github.com/DTheDataGuy/ssc-worldcup-impact
cd ssc-worldcup-impact
python3 -m http.server 8000   # then open http://localhost:8000
```

## Reuse

Figures belong to the organizations cited in `data.csv`; cite them, not this repository, when you republish a number. For reuse of the code or design, contact [info@thedataguys.org](mailto:info@thedataguys.org).

More work: [the-data-guys-portfolio](https://github.com/DTheDataGuy/the-data-guys-portfolio) · [@DTheDataGuy](https://github.com/DTheDataGuy)
