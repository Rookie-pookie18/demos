# demos

My portfolio of demo websites. **This whole folder is one Git repo and one Cloudflare Pages
project.** That's the important idea: set it up once, and every demo I ever make afterwards
goes live by adding a folder and pushing.

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

The `-1g7` is Cloudflare's doing — `demos.pages.dev` was already taken by someone else, so it
added a suffix. If that bothers you later, point a proper domain at this project in the
Cloudflare dashboard under Custom domains, and send clients that instead.

## Adding a new demo — the whole process

1. Make a folder: `brand-name-standard` or `brand-name-premium`. Lowercase, hyphens.
2. Put an `index.html` in it. Sub-files (`js/`, `logo.png`) go inside that same folder.
3. Add a card for it in `index.html` at the root — copy an existing `<a class="card">` block.
4. Three commands:
   ```powershell
   git add .
   git commit -m "Add brand-name-premium demo"
   git push
   ```
5. Cloudflare rebuilds on its own. Live in about a minute.

## The two-copies rule

Every brand gets **both** tiers, `-standard` and `-premium`, so a client can open them side
by side on their phone and see what the extra money buys. A Premium demo on its own only
tells them it's expensive.

If a brand only has one tier built so far, that's fine — but it's an open item, not a
finished demo.

## Made-up brands

Demo brands are invented (Anna Mills is not a real rice mill). Every demo carries a
placeholder note in its footer and `<meta name="robots" content="noindex">` in its head, so
they don't get indexed by Google and mistaken for a real company's site. Keep both when you
add a new one.

Real client work does **not** go in this repo. It gets its own repo under
`Websites\live\` or `Websites\building\`.

## Rules for this repo

- Static files only — no build step. Cloudflare Pages serves the folder as-is, which is why
  there's nothing to configure and nothing to break.
- Each demo is self-contained. No shared CSS or JS between demos: if two demos share a file
  and you edit it for one, you silently break the other.
- External libraries load from a CDN (`cdn.jsdelivr.net`). That's fine and it's what the
  artifacts already do.
