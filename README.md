# demos

My portfolio of demo websites. **This whole folder is one Git repo and one Cloudflare Pages
project.** Set up once; every demo after that goes live by adding a folder and pushing.

```
demos\
  index.html              the showcase page clients land on
  .gitignore
  _template\              starting point for a new demo pair
  anna-mills-premium\
  kestrel-premium\
  kestrel-standard\
  calder-finch-premium\
```

## Live at

**https://demos-1g7.pages.dev/** — the showcase page
https://demos-1g7.pages.dev/anna-mills-premium/
https://demos-1g7.pages.dev/kestrel-premium/
https://demos-1g7.pages.dev/kestrel-standard/
https://demos-1g7.pages.dev/calder-finch-premium/

GitHub: `Sidak-dang/demos` · Cloudflare Pages project: `demos-1g7`

`demos.pages.dev` was taken, so Cloudflare added `-1g7`. To lose it, point a real domain at
this project under **Custom domains** in the Cloudflare dashboard and send clients that.

---

## Adding a new demo — your part

You don't edit any files yourself. Three steps.

**1.** Open a Claude Code session on this folder: `C:\Projects\Websites\demos`

**2.** Say what you want, in plain words. For example:

> Add a new Premium demo for a fictional restaurant chain.

> Turn the concept site in this zip into a demo. Rebrand it to a fictional company.

Claude reads `CLAUDE.md` in this folder automatically, so it already knows the rules —
the folder naming, the card attributes the picker needs, the noindex tag, the fictional
brand, and the full checklist for stripping a real client's details out of a concept site.
You don't have to remember or mention any of it.

**3.** When it says it's done, run these three lines in PowerShell:

```powershell
git add .
git commit -m "Add the new demo"
git push
```

Then open https://demos-1g7.pages.dev/ and scroll the new demo top to bottom. If something
looks wrong, say so in the same Claude session.

That's the whole thing. Everything technical lives in `CLAUDE.md` — that file is written
for Claude, not for you, and you never need to open it.

---

## The picker — sending a client only the relevant demos

**Control panel:** https://demos-1g7.pages.dev/?pick ← bookmark this

Tick the demos you want, press **Copy link**, send it. Quick buttons for All, None, and one
per industry.

The selection is stored **inside the link** (`?show=kestrel-premium,kestrel-standard`), not
on a server. So every link is independent: sending a new one never changes an old one, and
there's nothing to maintain.

Two things to remember:

- **It isn't private.** Anyone can trim the URL and see everything. It's tidying, not security.
- **Don't split a tier pair.** Standard + Premium of the same brand side by side is the whole
  sales argument. Filter by industry, keep both tiers.

Below about ten demos, filtering makes you look thin rather than curated. Use the plain
link until the library is bigger.

---

## Turning a real client concept into a demo

Say so in the Claude session and it handles it. A concept built for a real client hides
their identity in about eleven places a plain search won't find — logos split across tags,
text painted onto a canvas, phone numbers in five formats, the founder's real biography,
map coordinates, file-number prefixes. The full checklist is in `CLAUDE.md`.

The one thing worth knowing yourself: **always check an invented brand name isn't a real
company.** "Northway Immigration" and "Ardent Immigration" both looked invented and both
turned out to be real Canadian firms.

## The two-copies rule

Every brand gets **both** tiers so a client can put them side by side and see what the extra
money buys. A Premium demo on its own only says "expensive".

A brand with one tier built is an open item, not a finished demo.

## Made-up brands

Demo brands are invented. Every demo carries a fictional-company note in its footer and
`noindex` in its head. Keep both when you add one.

Real client work does **not** go here. It gets its own repo under `Websites\live\` or
`Websites\building\`.

## Rules for this repo

- Static files only — no build step. Cloudflare serves the folder as-is, which is why
  there's nothing to configure and nothing to break.
- Each demo is self-contained. No shared CSS or JS between demos: edit a shared file for one
  and you silently break the other.
- External libraries load from a CDN (`cdn.jsdelivr.net`). That's fine.
