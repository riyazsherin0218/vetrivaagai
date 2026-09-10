# Vetrivaagai Chit Funds Private Limited — Website

A front-end-only (HTML / CSS / JavaScript) website. No build step, no server, no
dependencies. Double-click `index.html` to open it in any browser.

---

## Pages

| File | Page | What's on it |
|---|---|---|
| `index.html` | Home | Hero, trust pillars, 6 value cards, 3 featured plans, 4-step process, achievements, 8 uses, testimonials |
| `about.html` | About Us | Who we are / what we do / our promise, mission, vision, 5 core values, why choose us, achievements |
| `plans.html` | Our Plans | All 9 TF groups as cards with a filter, comparison table, full 25-month bid & dividend chart, Karur branch chits |
| `how-it-works.html` | How It Works | What a chit is, 4-step cycle, the full ₹5,00,000 arithmetic, early vs. late takers, terms |
| `benefits.html` | Why Chit Fund | 12 company specialities, chit vs. RD/FD/mutual fund/loan comparison, uses, joining steps, documents needed |
| `gallery.html` | Gallery | Photo placeholders for branches, auction days, member meetings; branch details |
| `contact.html` | Contact Us | Enquiry form, all phone numbers, WhatsApp, office hours, branch cards, FAQs |
| `calculator.html` | Chit Calculator | Three affordability calculators (by income, by instalment, by target amount), plan matching, and the auction / dividend / prize-money calculator |

---

## Folder structure

```
vetrivaagai-website/
├── index.html
├── about.html
├── plans.html
├── how-it-works.html
├── benefits.html
├── gallery.html
├── contact.html
├── calculator.html
├── README.md
├── _tests/engine.test.js      ← 106 assertions, run with node
└── assets/
    ├── css/style.css          ← all styling, one file
    ├── js/main.js             ← shared site interactions
    ├── js/chit-plans.js       ← ★ THE ONE PLACE TO EDIT CHIT PLANS
    ├── js/chit-engine.js      ← pure calculation functions (no DOM)
    ├── js/calculator.js       ← calculator UI wiring
    └── img/
        ├── logo-mark-gold.png ← the star mark (header, footer, founder sign)
        ├── logo-mark.png      ← same mark, kept for anything still pointing here
        ├── logo-mark-192.png  ← small copy used as favicon / touch icon
        ├── hero-cover.jpg     ← home-page hero photograph
        ├── mascot.png/.webp   ← Vetri, the chit buddy
        ├── founder.jpg/.webp  ← leadership portrait (About Us)
        ├── md.jpg/.webp       ← second leadership portrait, ready but unused
        └── bg/                ← 21 section backgrounds, .webp + .jpg of each
```

---

## Colour palette

Deliberately different from the navy-and-gold in the reference material.

| Role | Hex | Where it's used |
|---|---|---|
| Emerald 800 | `#0A3D2E` | Primary brand colour, headings |
| Emerald 900 | `#062A20` | Dark section backgrounds |
| Emerald 950 | `#04211A` | Footer, deepest gradient stop |
| Champagne Gold 500 | `#C9A227` | Buttons, accents, rules |
| Champagne Gold 300 | `#E8CE8E` | Gold text on dark backgrounds |
| Ivory | `#FBF9F4` | Page background |
| Ink | `#16211D` | Body text |

All colours are CSS custom properties at the top of `assets/css/style.css`
(the `:root` block). Change a value there and it updates across all 8 pages.

**Fonts:** Playfair Display (headings), Manrope (body), Noto Sans Tamil (Tamil
text) — loaded from Google Fonts. An internet connection is needed for the fonts
to appear exactly as designed; without one the browser falls back to Georgia and
a system sans-serif, and the layout is unaffected.

---

## What's already interactive

- Sticky header that condenses on scroll
- Mobile hamburger drawer with overlay
- Scroll-reveal animations on every section
- Animated number counters on the achievement stats
- Plan filter buttons on the Plans page (All / Starter / Growth / Premium)
- Enquiry form with browser validation and a success message
- Back-to-top button, floating WhatsApp and Call buttons
- Fully responsive down to 390px, plus a print stylesheet

---

## The chit calculator

`calculator.html` has four calculators. Every figure updates live as you type.

**1 · By income** — Salary and existing commitments in, affordable chit out.

```
Surplus Income      = Monthly Salary − Existing Commitments
Applicable Chit EMI = Surplus Income × 50%
Maximum Chit Value  = Applicable Chit EMI × Tenure
```

**2 · By instalment** — `Maximum Chit Value = Monthly Instalment × Tenure`

**3 · By target amount** — `Monthly Instalment = Desired Chit Amount ÷ Tenure`

All three then match against the plans in `chit-plans.js`, showing only plans
where `Plan Chit Value ≤ Maximum Chit Value`, sorted lowest to highest.

**4 · Auction, dividend and prize money**

```
Chit Amount           = Monthly Instalment × Number of Members
Bid Offer Amount      = Chit Amount × Auction Discount %
Prize Money           = Chit Amount − Bid Offer Amount
Foreman Commission    = Chit Amount × Foreman Commission %
Total Dividend        = Bid Offer Amount − Foreman Commission
Dividend Per Customer = Total Dividend ÷ Number of Members
Next Month Instalment = Monthly Instalment − Dividend Per Customer
```

### Editing the plans

Open `assets/js/chit-plans.js`. It is the single source of truth — all three
affordability calculators and the auction plan-picker read from it. Add,
remove or edit a plan there and every calculator updates. Nothing else
hard-codes a plan.

```js
{
  code: 'TF R',
  chitValue: 200000,
  monthlyInstallment: 8000,
  tenure: 25,
  members: 25,
  tier: 'growth',
  branch: 'All',
  active: true
}
```

Set `active: false` to hide a plan without deleting it. Company defaults
(5% foreman commission, 30% bid cap, 50% affordability ratio, ₹500 enrolment
charge) live in the `CHIT_DEFAULTS` object at the bottom of the same file.

### Connecting to a backend later

`assets/js/chit-engine.js` is pure — every function takes numbers and returns
numbers or plain objects, and nothing touches the DOM. It already exports for
Node (`module.exports`), so it can be dropped into an Express route, a
serverless function or a React app unchanged:

```js
const E = require('./assets/js/chit-engine.js');
E.calculateByIncome({ monthlySalary: 50000, existingCommitments: 5000, tenureMonths: 60 });
// → { surplusIncome: 45000, applicableChitEmi: 22500, maxChitValue: 1350000, ... }
```

`assets/js/calculator.js` is the only file that reads inputs and paints
results — it contains no formulas.

### Running the tests

```
node _tests/engine.test.js
```

106 assertions covering every formula, the validation rules, plan matching,
currency formatting, and the accounting identities (prize + bid = chit amount;
dividend + commission = bid offer).

---

## Things to do before going live

1. **The enquiry form does not send email yet.** It validates and shows a
   success message, but nothing is transmitted. Connect it to Formspree, Web3Forms,
   Google Forms, or your own backend — the form has `id="enquiryForm"` and the
   submit handler is at the bottom of `assets/js/main.js`.

2. **Replace the gallery placeholders.** In `gallery.html`, swap each
   `<div class="gal-inner">…</div>` for an `<img src="assets/img/your-photo.jpg" alt="…">`.
   Keep the surrounding `<figure class="gal-item">` — the rounded corners and
   hover lift come from it.

3. **Add real social media links.** In `assets/css/../..` → each page's footer,
   the Facebook, Instagram and YouTube links currently point at `#`.

4. **Check the Karur branch address.** The reference material gave phone numbers
   for Karur but not a street address; `gallery.html` and `contact.html` currently
   describe the branch without one.

5. **Verify the month 24–25 figures** in the chart on `plans.html`. The printed
   chart showed Gain Value of ₹1,40,000 for months 24 and 25, which does not
   follow the pattern of the rows above it. The site uses ₹1,88,000 and ₹1,90,000
   (chit value minus bid amount). If the printed figures were correct, edit those
   two rows in `plans.html`.

6. **The calculator's default tenure is 60 months** on the income tab, matching the
   worked example. Your actual groups run 25 months. If most visitors should start
   at 25, change `value="60"` on `#incTenure` and `#incTenureRange` in
   `calculator.html`.

7. **Add a favicon** if you want something other than the gold star, and consider
   a proper Google Maps embed on `contact.html`.

---

## Details taken from the reference material

- All 9 TF groups: TF M, A, P, S, R, T, X, I, V — ₹2,000 to ₹1,00,000 monthly,
  ₹50,000 to ₹25,00,000 chit value, 25 months, 25 members
- The complete 25-month bid / gain / balance / dividend chart for a ₹2,00,000 chit
- Karur branch: six open groups including 14-month DP variants
- Foreman commission 5%, maximum discount 30%, ₹500 first-month enrolment charge
- Address: No. 66, Lingagounden Valasu, Sivagiri, Erode, Tamil Nadu – 638109
- Phones: 96007 13333 · 93631 32333 · 93639 44284 · 88385 76767
- Email: enroll@vetrivaagai.com
- Website: www.vetrivaagai.com
- Achievements: 725+ members, ₹1 crore+ chit business value, 9+ years
- Core values, mission, vision, why-choose-us list, company specialities and
  terms from the English and Tamil brochures
- Testimonials from Karthik M., Priya S. and Ramesh P.

---

## Update — 1 September 2026

**1. Founder section on About Us**
A new *Leadership* section sits between "Who we are" and "Mission / Vision".
Drop the photograph in as `assets/img/founder.jpg` (portrait, roughly 4:5, at
least 640 × 800 px) and it appears automatically. Until then the frame shows a
gold monogram placeholder rather than a broken image.
Edit the name and title in `about.html` — search for `founder-sign-name`; it
currently reads "Founder & Managing Director".

**2. Hero image edge removed**
The hero photograph is now feathered into the blue panel with a CSS mask instead
of stopping at a visible line. See `.hero-bg::before` / `::after` in
`assets/css/style.css`, with separate masks for tablet and phone widths.

**3. "Our Plans" navigation**
Every plan link across the site was audited — all 88 resolve correctly. "Our
Plans" now carries a gold pill highlight (`.nav-key`) in the header and drawer
so it reads as the primary destination.
The header nav was also overflowing and clipping the "Join a Chit" button between
about 1220 px and 1520 px; two new breakpoints tighten the nav so it fits.

**4. New career application form** (`career.html`, anchor `#apply`)
Replaces the old "email us" instruction with a proper form:
- Employee / Sales track chooser; the position dropdown repopulates for each
- Each role card's **Apply Now** jumps to the form with that track and position
  already selected
- Required: name, 10-digit mobile, position, branch, consent. Inline errors,
  cleared as soon as the person starts typing
- On submit it opens WhatsApp to **96007 13333** with the application formatted
  and ready to send, then shows a confirmation panel

To change the destination number, edit `WA_NUMBER` in `assets/js/main.js`.
To move to a real backend later, replace the `applyForm` submit handler — the
field names (`name`, `phone`, `email`, `role`, `branch`, `experience`,
`qualification`, `city`, `about`, `track`) are already set for a POST.

---

## Update — 1 September 2026 (mascot)

**Mascot artwork**
`Cartoon.jpeg` was cut out of its white background and saved as
`assets/img/mascot.webp` (58 KB, used by every modern browser) with
`assets/img/mascot.png` (287 KB) as the fallback. Both are referenced through a
`<picture>` element, so nothing extra is needed to make it work. The original
JPEG's soft grey ground-shadow was removed as well, so he sits cleanly on the
navy sections.

**Where he appears**
1. `index.html` — standing in the "Start your financial journey" CTA band at the
   foot of the home page (`.cta.cta-mascot`)
2. `career.html` — greeting card above the application form (`.mascot-band`)
3. `calculator.html` — lead-in above the affordability calculators

He is sized by height (`.mascot-fig`), so he always stands on the band's floor;
on screens under 900 px each band stacks and centres him above the text.
To use him somewhere else, copy a `.mascot-band` block — it takes a heading, one
or two paragraphs and the "Vetri · Your Chit Buddy" line. Add `on-dark` to the
band's class list when placing it on a navy section.
The name "Vetri" is a placeholder — change it in the `.mb-name` span on both
pages if you want a different one.

**Two mobile bugs fixed along the way**
- The calculator's input panel was 488 px wide on a 390 px phone, pushing roughly
  100 px of every field off-screen. Grid children now get `min-width:0`, field
  labels wrap, and the long plan-picker option no longer stretches its field.
- Nothing else on the site overflows now; the plan and comparison tables still
  scroll sideways inside `.table-wrap`, which is intended.

**Trust strip removed (1 September 2026)**
The navy "Safe · Transparent · Trusted · Together We Grow" bar was removed from
all ten pages, along with its now-unused CSS (`.strip`, `.strip-inner`,
`.strip-item` and the `.strip + .section` spacing rule). On the home page the
hero now runs straight into the "Why members choose us" section; on inner pages
the first section follows the header directly.

**Nav pill and top spacing (1 September 2026)**
The gold pill around "Our Plans" in the nav was removed — it now looks like every
other link, with just the gold underline on hover and on the current page. The
`.nav-key` class and its CSS are gone entirely.
Inner pages were also left with a large gap under the header once the trust strip
went, since the first section fell back to the full `.section` padding. A new
`.page-offset + .section{padding-top:clamp(26px,3vw,46px)}` rule pulls that first
section up — roughly 50 px under the header on desktop, 34 px on a phone.

---

## Update — 1 September 2026 (full-bleed hero)

The home hero was rebuilt to the full-bleed pattern: the cover photograph fills
the panel edge to edge, the headline and subline sit centred over it, and there
is a single gold **Get Started** button. The hero stands at 88% of the screen
height on desktop and 82% on a phone, so a sliver of the next band shows and
invites a scroll.

**Swapping the photograph**
Replace `assets/img/hero-cover.jpg` — nothing else needs changing. Use a
landscape image, 1920 px wide or more; it is drawn with `background-size:cover`
from the centre, so keep the subject near the middle of the frame. A dark
navy wash and vignette sit over it (`.hero-bg::after`), deep enough that white
type stays readable over a bright photo. If a new picture ends up too dark or
too light, that one rule is the only thing to adjust.

**Other changes in the same pass**
- The Safe / Transparent / Trusted pillars moved out of the hero into their own
  white band directly beneath it (`.pillars-band`), restyled for a light
  background.
- The gold half of the headline uses a drop-shadow rather than a text-shadow —
  `.gold-text` is a clipped gradient, so a text-shadow shows through the letters
  and muddies them.
- On phones the eyebrow's leading dash is hidden, since it stranded itself on
  its own line when the label wrapped.
- Dead CSS for the old hero (`.hero-grid`, `.hero-visual`, `.hero-card`,
  `.float-badge` and its `bob` animation) was removed. `.hc-rows` / `.hc-row`
  were kept — how-it-works.html still uses them.

**Trust pillars removed (1 September 2026)**
The Safe / Transparent / Trusted band under the hero was taken out of the home
page, along with its CSS (`.pillars-band`, `.pillars`, `.pillar`, `.pillar-ic`
and the mobile stacking rules) — no other page used it. The hero now runs
straight into "Built for families who plan ahead".

**Hero photograph replaced (1 September 2026)**
`Hero Image.png` (the family / wedding celebration shot) is now the hero cover.
It was converted to `assets/img/hero-cover.jpg` at its native 1672 × 941 and
quality 86 — 317 KB, down from a 2.4 MB PNG.

Three adjustments went with it, because the new picture is bright and warm where
the old one was dark:
- The copy block sits lower in the frame (`.hero` padding-top raised) so the
  headline falls below the faces instead of across them, and the background is
  positioned at `center 34%` to keep the group in view as the panel crops.
- The blanket navy wash over the photo was lightened, so the colour survives.
- A soft blurred scrim sits behind the copy only (`.hero-copy::before`), which is
  what keeps the type readable. Measured contrast against the brightest pixels
  behind each line: 6.5:1 on the headline, 11.9:1 on the subline, 8.5:1 on the
  eyebrow — all past the 4.5:1 mark.
If you swap the photo again and the text looks weak, that scrim's alpha
(currently .72) is the one value to raise.

**Hero framing adjusted (1 September 2026)**
The cover photo is now anchored to its top edge (`center top` rather than
`center 34%`), so the garlands and roof above the group stay in frame and
nothing is cropped above anyone's face — the crop comes off the bottom instead.
The navy fade at the foot of the panel was eased (bottom stop .88 → .6, with the
vignette pulled back to match) so the photo runs cleanly into the white section
below rather than ending on a dark band. On phones the copy scrim reaches
further up, since the narrower column pushes the eyebrow toward its edge.
Contrast after the change: 6.2–6.9:1 on the headline, 4.6–7.5:1 on the eyebrow,
10.8:1 or better on the subline.

**Centre scrim removed (1 September 2026)**
The blurred dark pool behind the hero copy (`.hero-copy::before`) is gone — the
photograph is now unobstructed across the whole panel. Legibility rides on
text-shadows that hug the letters instead: a tight 1–2 px shadow plus a wider
soft one on the headline, subline and eyebrow, and a matching pair of
drop-shadows on the gold half of the headline (a clipped gradient, so it needs
`filter`, not `text-shadow`).
This trades some contrast for a clean image — the subline is the weakest line,
sitting over the bright cream sherwani. If it ever reads too faint, the options
in order of least visual cost are: deepen the subline's own text-shadow, raise
the 44% stop of the wash in `.hero-bg::after`, or bring the scrim back.

**Bottom of the hero opened up (1 September 2026)**
The foot of the panel was still carrying a heavy navy fade, which read as a dark
strip rather than photograph — measured at brightness 51 against 88 for the rest
of the image. The bottom stops of both gradients in `.hero-bg::after` were
lifted (linear tail .6 → .1, vignette edge .5 → .26), so the picture now runs at
its own brightness all the way down to the white section: 89 against 104.
With no scrim and a lighter wash, the subline carries its own weight now — it is
solid white at weight 500 with four stacked tight shadows, which hug the letters
instead of putting a patch on the image.

**Hero photograph replaced again — Vetri.jpeg (1 September 2026)**
The branded wedding shot (family seated, Vetrivaagai board and mascot on an easel
to the right) is now `assets/img/hero-cover.jpg` — 1536 × 1024, quality 86, 370 KB.
The board and the mascot both stay in frame at every width tested.

This picture has faces spread across the whole frame, unlike the previous one, so
a scrim behind the copy came back — there is no face-free band for the text to
sit in. It is gentler than the first attempt: 60% alpha over a 58 px blur and a
wider ellipse, so it reads as depth in the drapes rather than a panel.
Contrast now: 4.6–5.8:1 on the headline, 4.7–5.5:1 on the eyebrow, 6.8–7.9:1 on
the subline.
If you swap in a photo that has open sky, wall or floor behind the headline, the
scrim can come out again — delete `.hero-copy::before` and its mobile override.

**Hero shows the whole photograph (1 September 2026)**
The panel now carries `aspect-ratio: 3 / 2` — the cover image's own proportions —
so nothing is cropped off any edge on desktop or tablet. The `transform:scale`
zoom was removed too; the picture is shown as shot.

Because a 3:2 panel is taller than a wide browser window, the copy is positioned
against the viewport (`align-items:start` with a vh-based top padding) rather
than centred in the panel. The Get Started button therefore sits above the fold
at every width tested (636px down on a 1900 × 890 window), and the lower part of
the photograph — the lamps, offerings and fruit — reveals as you scroll.

Two things worth knowing if you change this:
- `aspect-ratio` and `min-height` together let the browser derive the *width*
  from the height, which pushed the hero 116px past the viewport at 1024. The
  fix is the explicit `width:100%`; don't reintroduce `min-height` here.
- Below 900px a 3:2 band is too short to hold the copy, so the aspect-ratio is
  switched off and the panel goes back to a cropped 80svh. On a phone that means
  roughly 38% of the image width is visible — unavoidable for a landscape photo
  in a portrait frame. If the sides matter on mobile, the answer is a second,
  squarer crop of the same picture swapped in by media query.

**Copy scrim removed for good (1 September 2026)**
`.hero-copy::before` and its mobile override are gone — the photograph is
completely unobstructed. Legibility now rests entirely on the stacked
text-shadows on `.hero h1`, `.hero-sub` and `.hero .eyebrow`, plus the paired
`drop-shadow` filters on the gold half of the headline.
This is a deliberate choice of image over measured contrast: the subline in
particular sits over bright cream and gold. If a line ever needs strengthening,
add a fourth shadow stop to that line rather than reintroducing a scrim.


---

## Update — 2 September 2026 (site-wide imagery)

Every page now sits on artwork rather than flat ivory, the wordmark has been
rebuilt, and the Gallery and About Us placeholders have been filled.

### Where the pictures come from

All of it is **original vector artwork**, generated to the site's own navy +
champagne palette — no stock photography, no licensing to track. The motifs are
drawn from the business: pulli kolam lattices, a town skyline with a gopuram,
coin stacks, a ledger ruling, an auction gavel with bid rings, ascending bars,
member silhouettes. Each piece is rendered large, given a bloom-and-vignette
pass, and written out as a `.webp` with a `.jpg` beside it.

They are deliberately quiet. Nothing in `assets/img/bg/` is meant to be *looked
at* — it is there so that no part of a page is ever blank, and so the eye has
somewhere to rest between cards.

### The three layers

Everything lives in **section 33 of `style.css`**.

1. **`body::before`** — one fixed canvas (`bg/canvas-light`) behind the whole
   document. Because it is `position:fixed` it covers the entire scroll no
   matter how long the page is, which is what guarantees there are no plain
   stretches anywhere.
2. **`.has-bg::before` / `::after`** — each section's own artwork plus the scrim
   that keeps the words on top of it readable. The scrim is denser at the top
   and bottom edges than in the middle, so neighbouring sections melt into one
   another instead of meeting at a hard line.
3. **`body::after`** — a single film-grain tile over everything at 5.5% opacity.
   This is what stops flat vector art reading as clipart. It is one small inline
   SVG, so it costs nothing.

### Adding a background to a new section

```html
<section class="section has-bg bg-trust">   <!-- light -->
<section class="section section-tint has-bg bg-table">
<section class="section section-dark has-bg bg-auction">   <!-- dark -->
```

`.has-bg` supplies the machinery; the second class picks the picture. The
available names are listed under *33.3 The artwork map* — `bg-trust`,
`bg-plans`, `bg-growth`, `bg-family`, `bg-voices`, `bg-ledger`, `bg-faq`,
`bg-journey`, `bg-contact`, `bg-heritage`, `bg-compass`, `bg-table` for light
sections, and `bg-auction`, `bg-branch`, `bg-uses`, `bg-math`, `bg-apply` for
dark ones. A section's direct `.wrap` / `.wrap-wide` child is lifted above the
layers automatically; if you nest the content deeper, give that wrapper
`position:relative;z-index:3`.

### Readability

This was measured, not eyeballed. Every text run that sits **directly on
artwork** — 102 of them across the ten pages — was sampled against the pixels
actually painted behind it, and all of them clear WCAG AA. Three rules do the
work, and they are the ones to keep in mind if you restyle:

- `.has-bg .lead`, `.has-bg .purpose-note` and `.has-bg .scroll-hint` step up
  from `--muted` to `--ink-2`.
- `.has-bg .eyebrow` deepens to `#8C6209`. The old `--gd-600` eyebrow was only
  2.3:1 even on flat white; the antique gold clears 4.5:1 while the bright
  champagne dash beside it keeps the sparkle.
- Cards, tables and form panels stay **solid white**. That is the safety net —
  the body copy inside them never touches the artwork at all. Don't make them
  translucent.

### The header and the wordmark

- A 3px champagne rule runs across the very top, navy at the ends.
- The pane is a bright white→ivory glass with a gold hairline underneath, so the
  navy wordmark reads at full strength.
- `.brand-name` is Playfair 800 with a navy vertical gradient
  (`#12508F → #031A3E`) clipped to the text, and a solid `#062A5B` fallback
  underneath for browsers without `background-clip:text`.
- `.brand-sub` gained a champagne dash before it and a fading rule after it.
- A soft gold halo sits behind the logo mark so it rests *on* the glass.
- The footer wordmark inverts to a white gradient via `.f-brand .brand-name`.

### Gallery

Each tile is a `<div class="gal-img gi-…">` layer inside the existing
`<figure class="gal-item">`. Captions moved to the foot of the tile, left
aligned, which is why the wash is now a bottom-up gradient rather than a
centre spot — the picture stays open above the words.

To swap in a real photograph, change the one rule in *33.6*:

```css
.gi-auction{background-image:url("../img/your-auction-photo.jpg")}
```

Nothing else needs touching — the wash, the caption, the hover zoom and the
rounded corners all come from `.gal-item`.

### Leadership portraits

`founder.jpg` is wired into the About Us frame. It is a **rim-lit silhouette**,
not an invented face: a featureless but fully-lit portrait reads as a broken
avatar, whereas a figure held in shadow and described by a single gold
rim-light reads as a designed choice — which is what a placeholder for a real
photograph should be. Drop a real photograph in at the same path and it takes
over; the frame, the gold halo and the "9+ Years" chip are unchanged.

`md.jpg` is a second, deliberately different portrait sitting unused in
`assets/img/`. The About Us page currently has **one** leadership block, signed
*Founder & Managing Director*. If those are two different people, duplicate the
`.founder` block, point the second `<img>` at `md.jpg`, and give each its own
name and title.

### Weight

All 21 backgrounds plus both portraits come to about **450 KB of `.webp` in
total** — roughly 16 KB each. A typical page pulls 100–200 KB of new imagery.
The grain is CSS rather than baked into the files, which is most of why they are
small: noise is the one thing image codecs cannot compress.

### Regenerating

The artwork is procedural. If you ever want to re-tune it, the generator is not
shipped with the site — ask for `art/lib.py` (motifs and the render pipeline),
`art/make.py` (backgrounds) and `art/make2.py` (gallery tiles and portraits).


---

## Update — 2 September 2026 (brand mark, wordmark, Career artwork)

### The logo

`logo-mark-gold.png` and `logo-mark.png` are now the supplied star mark,
trimmed to its own bounding box, squared with a 3% margin and written at
512px with a transparent background. It reads correctly on both the light
header and the navy footer. `logo-mark-192.png` is a 192px copy — every page's
favicon and `apple-touch-icon` point at that rather than the full-size file,
which saves ~145 KB per page load.

### The wordmark

Set to match the brand artwork exactly: **Vetrivaagai** in Playfair 800 at
1.72rem with a navy vertical gradient, and **CHIT FUNDS PVT. LTD.** in gold
directly under it. The flanking dash and trailing rule that were there before
are gone — the artwork sets the sub-line plain, so the site does too. The mark
sits at 50px with a soft gold halo behind it, and everything steps down
proportionally when the header shrinks on scroll and again below 1340px.

### Career page

The Career page now has its own artwork rather than borrowing the generic set.
Three new pieces in `assets/img/bg/`:

- **`sec-career`** — a line of candidates in business dress, daylight. Used on
  the intro band and behind the application form.
- **`sec-hire`** — the hiring desk: résumés laid out, a document case, staff
  either side. Used behind *Open roles*.
- **`dark-interview`** — the interview itself: a panel across a desk from a
  candidate holding a folder, warm lamp light. Used behind *How to apply*.

The figures are drawn as bust silhouettes with the clothing made explicit —
an open jacket with lapels, a light shirt panel, a gold tie, sleeves separated
from the torso by a hairline of light. All four of those matter: drop any one
and the shape stops reading as a person in professional dress. The proportions
are keyed to the head (a shoulder line of about two head-widths); sizing
shoulders off the overall height instead is what turns a figure into a bell.

Because the people on this page are meant to be *seen* rather than merely
felt, `.bg-career`, `.bg-hire` and `.bg-interview` each override the default
scrim: heavy at the top where the headings sit, thinning to 46% lower down
over the figures. Contrast was re-measured after that change — all 102 text
runs sitting directly on artwork still clear WCAG AA.
