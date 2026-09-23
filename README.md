# Lupus Foundation of Africa

The website for the [Lupus Foundation of Africa](https://atindahhillary.github.io/LUPUS-FOUNDATION-AFRICA.ORG/) (LFA), an African patient-led, patient-centred organisation working so that every person living with lupus is seen, heard, diagnosed early, treated appropriately and supported to live a full and dignified life.

**Live site:** https://atindahhillary.github.io/LUPUS-FOUNDATION-AFRICA.ORG/

---

## What this is

A fast, accessible, static website set in Inter. No framework, no runtime dependencies, no build server required to view it. Pages are composed from a shared layout by a small Node script and committed as plain HTML, so GitHub Pages serves them directly.

### Pages

| Page | Purpose |
| --- | --- |
| `index.html` | Home: three-door entry (I have lupus / I want to learn / I want to help) |
| `about.html` | Who we are, mission, vision, values, three pillars, team, governance |
| `partners.html` | Clinical, mental health, diagnostic, treatment, nutrition and media partners |
| `understanding-lupus.html` | What lupus is, causes, symptoms, diagnosis, treatment, FAQs |
| `newly-diagnosed.html` | "I have lupus. What now?": five first steps |
| `living-with-lupus.html` | Living well, mental health, work, women, pregnancy, young people, myths |
| `stories.html` | Warrior and caregiver stories |
| `our-work.html` | The six programme areas |
| `advocacy.html` | Advocacy and policy, plus take-action routes |
| `research.html` | Building African lupus evidence |
| `for-professionals.html` | Recognise, refer, manage (for clinicians) |
| `events.html` | World Lupus Day 2026 and the full photo gallery |
| `news.html` | News and insights, filterable |
| `resources.html` | The Lupus Resource Centre, searchable and filterable |
| `get-involved.html` | Membership, support groups, volunteering, caregiver support |
| `partner-with-us.html` | Partnership options and enquiry form |
| `donate.html` | Ways to give |
| `contact.html` | Contact details and message form |
| `404.html` | Not-found page |

---

## Working on the site

### Editing content

Edit the files in `src/pages/`. Each page starts with a JSON front-matter block:

```html
<!--meta {
  "title": "Page title",
  "description": "Used for search engines and social sharing.",
  "nav": "about"
} -->
```

`nav` marks the active top-level menu item (`about`, `lupus`, `work`, `involved`, `news`, `resources`, `contact`).

Shared header and footer live in `src/partials/`. The page shell, meta tags and structured data live in `src/layout.html`.

### Building

```bash
node build.mjs
```

This writes the root-level HTML files plus `sitemap.xml`, `robots.txt` and `.nojekyll`. It needs Node 18 or newer and has no dependencies. The build fails loudly on an unreplaced placeholder or malformed front matter, so a broken page cannot ship silently.

### Previewing locally

```bash
python -m http.server 8787
```

Then open http://127.0.0.1:8787/.

---

## Connecting the forms

The partnership and contact forms currently open the visitor's email client with the message pre-filled, so nothing is lost while a backend is arranged.

To post submissions directly instead, set `FORM_ENDPOINT` near the top of `assets/js/site.js` to a form-handling URL (for example a Formspree endpoint):

```js
var FORM_ENDPOINT = 'https://formspree.io/f/xxxxxxxx';
```

If a request to that endpoint fails, the form falls back to the email client automatically. Both forms include a honeypot field and client-side validation.

---

## Ask LFA (the chat assistant)

`assets/js/chatbot.js` powers the "Ask about lupus" assistant in the bottom-left corner of every page.

**It is not a language model, and that is deliberate.** Answers come from a curated knowledge base of around 40 topics written and reviewed by LFA. For a patient organisation this is the safer design: answers about a medical condition are vetted rather than improvised, there is no hallucination risk, it costs nothing to run, it works offline, and nothing a visitor types about their health ever leaves their device.

It handles free-text questions through keyword scoring plus a phrase table, so "can lupus be passed to my children" reaches heredity rather than the children topic. It also:

- Detects **urgent symptoms** (chest pain, breathing difficulty, seizures, no urine output) and tells the person to seek care immediately rather than answering
- Detects **crisis language** and responds with support and the LFA number
- Says plainly when it does not know, and hands over to a real person
- Carries a "general information only" disclaimer in the header and on every session

### Adding a live model backend

If you later want it to answer anything, stand up a small serverless function (Cloudflare Worker, Vercel function) that holds your API key, then set:

```js
var CHAT_ENDPOINT = 'https://your-worker.example.workers.dev/ask';
```

It should accept `{message, history}` and return `{reply}`. The knowledge base stays as the instant-answer layer and only unmatched questions are forwarded.

**Never put an API key in `chatbot.js`.** It is a public file on a public site; a key placed there will be scraped and abused within hours.

### Editing the answers

Each entry in the `KB` array is `{ id, k, a, f, cta }`. `k` is the keyword string, `a` is the answer HTML, `f` lists follow-up topic ids shown as chips, and `cta` is an optional link. Add a topic by adding an object and referencing its id from other entries' `f` arrays.

## Notes for maintainers

- **Impact figures** appear on the home, about, our-work and donate pages. Search for `data-count` to update them. Figures still being verified are described as such rather than estimated.
- **Medical content** is written for education and awareness and carries a disclaimer on every page that contains it. It should be reviewed by a rheumatologist or qualified clinical advisory group before major changes.
- **The symptom reflection tool** (`understanding-lupus.html`) is deliberately not a diagnostic tool. It counts selections and encourages a clinical conversation. Please keep it that way.
- **Personal stories** are published with the consent of the person who shared them, and the site says so. Remove any story on request.
- **Photography** from World Lupus Day 2026 is by Raymond Kiunga and is credited in the footer and on the gallery.
- **The hero video** (`assets/video/lfa-hero.mp4`) was built from the event photographs. `.work/makevideo.sh` regenerates the master; the repo ships a 1280x720 web encode. It is muted, loops, pauses when scrolled out of view, honours `prefers-reduced-motion`, and has a visible pause control.

## Accessibility and performance

- Skip link, landmarks, visible focus rings, and labelled controls throughout
- Keyboard support for the menu, accordions, flip cards and gallery lightbox (arrow keys and Escape)
- `prefers-reduced-motion` respected for animation, scroll and the hero video
- Scroll reveals fall back to showing all content if the observer never fires, and `<noscript>` reveals everything without JavaScript
- Images are lazy-loaded below the fold with intrinsic dimensions set to avoid layout shift

## Licence and credit

Content and photography belong to the Lupus Foundation of Africa. Event photography by Raymond Kiunga.
