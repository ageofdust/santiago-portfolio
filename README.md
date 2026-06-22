# santiagonino.com

A static portfolio site. No build step, no dependencies — just HTML, CSS, and a little vanilla JS, ready to deploy on GitHub Pages.

## Structure

```
index.html                  Home page
work/index.html             Work index (project list)
work/mindflow/index.html    MindFlow project page
work/art-attelier/index.html
work/yellow-scene/index.html
contact/index.html          Get in touch page
404.html                    Custom not-found page
css/styles.css              Shared stylesheet (one file, cached across every page)
js/main.js                  Shared script (mobile nav toggle, accordions)
favicon.svg                 Site icon
robots.txt, sitemap.xml     Basic SEO plumbing
.nojekyll                   Tells GitHub Pages not to run Jekyll on this repo
```

Each page is a normal static HTML file. There's no client-side routing — clicking "Work" or a project actually navigates to a new URL (e.g. `/work/mindflow/`), so links, back/forward, and bookmarking all work the way they would on any real site.

## Adding a new project page

1. Make a folder under `work/`, e.g. `work/doomsday-scenario/`.
2. Copy the structure of an existing project page (e.g. `work/mindflow/index.html`) into a new `index.html` inside it.
3. Update the `<title>`, `<meta name="description">`, the logo, the header text, and the accordion sections.
4. Add a link to it from `work/index.html`.
5. Add the new URL to `sitemap.xml`.

## Deploying

Push this folder to a GitHub repo and enable GitHub Pages (Settings → Pages → deploy from the `main` branch, root folder). If you're using a custom domain, add a `CNAME` file at the root with your domain name, and update the `https://santiagonino.com` URLs in each page's `<link rel="canonical">` and `<meta property="og:...">` tags, plus `sitemap.xml` and `robots.txt`, to match your real domain.

## Editing styles

Everything visual lives in `css/styles.css`. It's organized in sections (header, hero, project index, accordion, contact, responsive breakpoints) with comments marking each. Colors and fonts are defined as CSS variables at the very top of the file (`:root { ... }`), so palette or font-pairing changes only need to happen in one place.
