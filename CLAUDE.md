# Instructions for Claude working in this folder

This is Sidak's demo-website portfolio. One Git repo, one Cloudflare Pages project, served
as static files with no build step. Live at **https://demos-1g7.pages.dev/**

Sidak is not a developer. He directs the work by prompting; he does not hand-edit HTML.
Do the file work yourself and give him only the commands he must run.

---

## Adding a new demo

When he asks for a new demo, do all of this without being asked for each part:

**1. Create the folder** — `brand-name-standard` or `brand-name-premium`, lowercase with
hyphens. `index.html` goes inside it, along with any `js/`, images, or other assets. Never
share a file between two demos: they must be independently editable.

**2. Add a card to the root `index.html`.** Copy an existing `<a class="card">` block. The
opening tag must carry both data attributes, or the demo picker will not see it:

```html
<a class="card" data-slug="brand-name-premium" data-sector="Immigration" href="brand-name-premium/" target="_blank" rel="noopener">
```

- `data-slug` must exactly match the folder name.
- `data-sector` is the industry. Reuse an existing spelling (`Immigration`, `Food & FMCG`)
  where one fits — each distinct value becomes a quick-filter button in the picker, so
  inconsistent spellings create duplicate buttons.

Give the card a background class: reuse `art-1`…`art-4` or add a new `.art-N` rule.

**3. Every demo must have**, without exception:
- `<meta name="robots" content="noindex">` in the head
- a footer line saying the company is fictional
- an invented brand — never a real company's name

**4. Tell him to run** `git add .` → `git commit -m "..."` → `git push`, then to open the
live URL and scroll the whole page.

---

## The two-copies rule

Each brand should end up with both a `-standard` and a `-premium` demo, because the pair
side by side is the sales argument. Standard = conventional site, 3–4 pages, no WebGL,
instant load. Premium = one custom scroll-driven or 3D centrepiece plus a page per
product or service. A brand with only one tier is an open item, not a finished demo.

## Inventing a brand name

**Search the web for the proposed name before using it.** This industry is saturated:
"Northway Immigration" and "Ardent Immigration" were both proposed here and both turned out
to be real Canadian firms. Verify, then use it.

## Converting a real client concept into a demo

Client concept sites carry that company's identity in places a text search will not find.
Work through all of this, then open the page and scroll it:

- [ ] **Name split across tags** — a two-tone logo is `<b>NOVA<span>WORLD</span></b>`.
      Searching "NovaWorld" finds nothing. Search each half separately.
- [ ] **Text painted onto a canvas** — `fillText('NOVA')` inside a `.js` file
- [ ] **Image files** — `logo.png` is the client's real mark; regenerate it
- [ ] **Phone numbers in every format** — `+1 (647) 404-6682`, `647-404-6682`,
      `6474046682`, `tel:+1647…`, `wa.me/1647…`. Search the bare digits.
- [ ] **Street address**, including inside a Google Maps query string
- [ ] **Named people** → `[Consultant Name]`. Never invent a replacement person.
- [ ] **The founder's biography** — arrival year, licence year, the whole arc. Changing the
      name but keeping "arrived as a student in 2004" keeps the real person's story.
- [ ] **Office locations**, including latitude, longitude and timezone strings in map code
- [ ] **Reference codes** — file numbers like `NW-2004-001` carry the old initials
- [ ] **`noindex`** — add it if the original lacked one
- [ ] **The disclaimer** — must say the firm is fictional, not "not the official X site"

Use placeholder numbers from the reserved fictional ranges (`555-01xx`) and a reserved
domain (`.example`), so nothing can resolve to a real person or business.

## Rules for this repo

- Static files only. No build step, no framework, no bundler.
- External libraries from `cdn.jsdelivr.net` are fine.
- Do not touch `index.html`'s picker script unless asked — it reads `?pick` and `?show=`.
- Real client work does not belong here. It goes in `Websites\live\` or `Websites\building\`
  with its own repo.

## Verifying

Never tell Sidak something is fixed because a write or a command succeeded. Read the file
back, and where possible open the live page and check it. This has bitten twice.
