# _template — how to start a new demo

Copy this folder twice, for the two tiers:

    brand-name-standard\
    brand-name-premium\

Each one needs its own `index.html`. Sub-files (`js/`, `logo.png`, images) go inside that
same folder — never shared between demos, or editing one silently breaks the other.

## Two things every demo must keep

**1. Don't let Google index it.** In the `<head>`:

    <meta name="robots" content="noindex">

Demo brands are made up. Without this, a search for the invented brand can surface your demo
as if it were a real company's website.

**2. Say it's a demo, in the footer.** Something like:

    Prototype · placeholder brand, figures and contacts

## Then

1. Add a card for it in the root `index.html` — copy an existing `<a class="card">` block.
2. `git add .` → `git commit -m "Add brand-name-premium demo"` → `git push`
3. Cloudflare rebuilds on its own. Live in about a minute.

Delete this README from your copies — it's for the template folder only.
