<div align="center">

<img src="docs/logo.svg" alt="Carly Taylor Jewelry" width="440">

<br>

# Shopify Theme

**A custom Shopify storefront for a demi-fine jewelry brand — built on Dawn, restyled from the ground up.**

Warm editorial art direction, a token-driven design layer, and three bespoke sections —
without forking Dawn's rendering logic, accessibility work, or Online Store 2.0 contract.

[![Shopify](https://img.shields.io/badge/Shopify-Online%20Store%202.0-BE9373?labelColor=3A2D23&logo=shopify&logoColor=F8F1E8)](https://shopify.dev/docs/themes)
[![Liquid](https://img.shields.io/badge/Liquid-Templating-BE9373?labelColor=3A2D23)](https://shopify.github.io/liquid/)
[![Base](https://img.shields.io/badge/Base-Dawn-BE9373?labelColor=3A2D23)](https://github.com/Shopify/dawn)
[![CSS](https://img.shields.io/badge/CSS-Custom%20Properties-BE9373?labelColor=3A2D23&logo=css3&logoColor=F8F1E8)](#design-tokens)
[![JS](https://img.shields.io/badge/JavaScript-Vanilla%20%2F%20No%20Build-BE9373?labelColor=3A2D23&logo=javascript&logoColor=F8F1E8)](#no-build-step)
[![A11y](https://img.shields.io/badge/A11y-WCAG%202.1%20AA%20intent-BE9373?labelColor=3A2D23)](#accessibility)

</div>

---

## Table of contents

- [Overview](#overview)
- [Landing page design](#landing-page-design)
- [Design system](#design-system)
- [Architecture](#architecture)
- [Feature set](#feature-set)
- [Project structure](#project-structure)
- [Local development](#local-development)
- [Merchant controls](#merchant-controls)
- [Accessibility](#accessibility)
- [Performance](#performance)
- [Roadmap](#roadmap)
- [Credits](#credits)

---

## Overview

Carly Taylor Jewelry sells gold and silver pieces in the $25–$100 band — jewelry meant to be
layered and *lived in* rather than kept in a box. The storefront had to read as boutique and
editorial while still behaving like a high-volume commerce theme: fast, accessible, and fully
editable by a non-technical merchant from the Shopify theme editor.

This theme takes [Dawn](https://github.com/Shopify/dawn) as its base and treats it as a
**dependency, not a starting point to overwrite**. Dawn's cart logic, Section Rendering API
wiring, predictive search, variant picker, and focus management are left untouched. Everything
brand-specific lives in an additive `ct-*` layer alongside it.

| | |
|---|---|
| **Base theme** | Shopify Dawn (Online Store 2.0, theme blocks enabled) |
| **Custom sections** | 3 built from scratch (`ct-hero`, `ct-category-grid`, `ct-newsletter`) + 8 Dawn sections extended |
| **Custom stylesheets** | 7 scoped files, all built on one shared token layer |
| **Custom JavaScript** | 2 files, both pure progressive enhancement |
| **Build step** | None — ships as-is to Shopify |
| **Typography** | Cormorant Garamond (self-hosted) + Karla (Shopify font library) |

---

## Landing page design

The homepage is composed entirely of theme-editor sections defined in
[`templates/index.json`](templates/index.json) — every heading, image, link and colour scheme
below is a merchant-editable setting, not hardcoded markup.

### Composition

```
┌──────────────────────────────────────────────────────────────────────┐
│  ANNOUNCEMENT BAR            scheme-7 · ink on warm white            │
│  "Welcome to Carly Taylor — use code WELCOME for 10% off…"           │
├──────────────────────────────────────────────────────────────────────┤
│  HEADER   ⌂ logo        « main menu »               ⌕   ⌾   ⛃        │
│  sticky · transparent over the hero · solidifies after 40px scroll   │
╞══════════════════════════════════════════════════════════════════════╡
│                                                                      │
│   ▏CARLY TAYLOR JEWELRY                          ░░░░░░░░░░░░░░░░░   │
│   ▏                                              ░░  hero image  ░   │
│   ▏Pieces you'll reach                           ░░░░░░░░░░░░░░░░░   │
│   ▏  for every day                               ░░░░░░░░░░░░░░░░░   │
│   ▏                                              ░░░░░░░░░░░░░░░░░   │
│   ▏Gold and silver jewelry made to be lived in.  ░░░░░░░░░░░░░░░░░   │
│   ▏                                              ░░░░░░░░░░░░░░░░░   │
│   ▏( Shop the collection )                       ░░░░░░░░░░░░░░░░░   │
│                                                                      │
│   ① ct-hero · 100vh · left-to-right scrim · eager-loaded LCP image   │
╞══════════════════════════════════════════════════════════════════════╡
│                        Shop by category                              │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                │
│   │         │  │         │  │         │  │         │                │
│   │ NECKLACE│  │ BRACELET│  │ EARRING │  │ ANKLET  │                │
│   └─────────┘  └─────────┘  └─────────┘  └─────────┘                │
│                     ( View all pieces )                              │
│   ② ct-category-grid · 4-up → 2-up · zoom-on-hover · collection-bound│
╞══════════════════════════════════════════════════════════════════════╡
│                      CUSTOMER FAVORITES                              │
│                        Featured pieces                               │
│   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐                 │
│   │  img ⊕ │   │  img ⊕ │   │  img ⊕ │   │  img ⊕ │  ⊕ = circular  │
│   │        │   │        │   │        │   │        │      quick add  │
│   └────────┘   └────────┘   └────────┘   └────────┘                 │
│    Tigerlily     Ava          Debbie        Julia                    │
│    necklace      earrings     anklet        earrings                 │
│   ③ featured-collection · 8 hand-picked products · 4-up → 2-up      │
╞══════════════════════════════════════════════════════════════════════╡
│  ░░░░░░░░░░░░░░░░░░░░░                                               │
│  ░░  banner image   ░░              The Art of Everyday Luxury       │
│  ░░░░░░░░░░░░░░░░░░░░░              Inspired by you, designed by us  │
│  ░░░░░░░░░░░░░░░░░░░░░                                               │
│  ░░░░░░░░░░░░░░░░░░░░░              [  SHOP NOW  ]                   │
│   ④ ct-hero reused · mirrored scrim · square CTA · lazy-loaded       │
╞══════════════════════════════════════════════════════════════════════╡
│                     Experience Carly Taylor                          │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                │
│   │   ◈     │  │   ◈     │  │   ◈     │  │   ◈     │                │
│   │Made for │  │ Quality │  │Priced to│  │Gifts    │                │
│   │Every Day│  │That Lasts│ │  Layer  │  │That Feel│                │
│   │  ⋯⋯⋯    │  │  ⋯⋯⋯    │  │  ⋯⋯⋯    │  │  ⋯⋯⋯    │                │
│   └─────────┘  └─────────┘  └─────────┘  └─────────┘                │
│   ⑤ multicolumn restyled · 96px PNG icons · flush equal-height cards│
╞══════════════════════════════════════════════════════════════════════╡
│   STAY IN TOUCH                             ░░░░░░░░░░░░░░░░░░░░░    │
│   Be first to meet                          ░░░░░░░░░░░░░░░░░░░░░    │
│     the new pieces                          ░░  newsletter img  ░    │
│                                             ░░░░░░░░░░░░░░░░░░░░░    │
│   [ Your email address    ] ( Subscribe )   ░░░░░░░░░░░░░░░░░░░░░    │
│   ⑥ ct-newsletter · image side is a setting · inline success state  │
╞══════════════════════════════════════════════════════════════════════╡
│  FOOTER                              scheme-7 · ink surface          │
│  ◆ Carly Taylor   Shop        Company        Follow along           │
│    brand blurb    All pieces  Contact        ⓘ ⓕ ⓟ                  │
│                   Necklaces   Shipping       Questions?              │
│                   Bracelets   Privacy        hello@carlytaylor.co    │
│  ─────────────────────────────────────────────────────────────────   │
│  © 2026 Carly Taylor Jewelry            [visa] [mc] [amex] [shop]    │
└──────────────────────────────────────────────────────────────────────┘
```

### Section breakdown

| # | Section | Type | What it does | Key decisions |
|---|---------|------|--------------|---------------|
| ① | Hero | `ct-hero` *(custom)* | Full-viewport brand statement with directional scrim and pill CTA | `eager_load` flag marks it as the LCP image; `<em>` inside the heading renders in italic Cormorant, controlled from the editor |
| ② | Category grid | `ct-category-grid` *(custom)* | Four collection tiles bound to real collections | Falls back to bundled placeholder art when a collection has no image; label overlays are readable at any crop |
| ③ | Featured pieces | `featured-collection` *(extended)* | Eight hand-picked products, secondary image on hover | Added a `product_list` setting so merchandising is explicit rather than "first N in collection"; added circular inline quick-add |
| ④ | Promo banner | `ct-hero` *(reused)* | Mid-page campaign break | Deliberately **not** a second section type — same section, mirrored `gradient_direction` and `content_position`, square CTA variant |
| ⑤ | Experience grid | `multicolumn` *(extended)* | Four value propositions with custom iconography | Added `ct_icon` (theme-asset PNG instead of an uploaded image) and `ct_card_style` so Dawn's stock multicolumn still works untouched when the flag is off |
| ⑥ | Newsletter | `ct-newsletter` *(custom)* | Split image / email capture | Wraps Shopify's native `customer` form, so double opt-in and spam handling stay native |

### Art direction

- **Editorial, not e-commerce-default.** Serif display type, generous vertical rhythm
  (72–88px section padding), and photography that bleeds to the viewport edge.
- **Warm neutrals only.** No pure black, no pure white anywhere on the page — the darkest
  ink is `#3a2d23` and the lightest surface is `#fbf7f2`.
- **One accent family.** Bronze and champagne carry every hover, focus ring, and eyebrow.
- **Two heading breaks are intentional.** The hero and newsletter headings break before their
  italic phrase, matching the source design, and both are editor-editable rich text.
- **Motion is a whisper.** A single `0.35s ease` token drives every transition, and every
  animated rule has a `prefers-reduced-motion` counterpart.

---

## Design system

All brand values live in one file — [`assets/ct-tokens.css`](assets/ct-tokens.css) — loaded once
in `layout/theme.liquid` immediately after Dawn's `base.css`.

### Design tokens

**Ink & surfaces**

| Token | Value | Role |
|---|---|---|
| `--ct-ink` | `#3a2d23` | Headings, dark surfaces, primary buttons |
| `--ct-cream` | `#fbf7f2` | Page background (scheme-6) |
| `--ct-surface` | `#f1e8dc` | Raised cards, category tiles |
| `--ct-body` | `#5c4e40` | Body copy — deliberately lighter than heading ink |
| `--ct-muted` | `#7a6a5a` | Captions, form labels, meta |
| `--ct-on-dark` | `#f3e6d8` | Text on the ink footer (scheme-7) |

**Brand accents**

| Token | Value | Role |
|---|---|---|
| `--ct-accent` | `#a67b5b` | Secondary button label |
| `--ct-bronze` | `#be9373` | Eyebrows, link hover, button hover |
| `--ct-champagne` | `#dbb894` | Focus rings, on-dark hover, announcement highlight |

**Borders & feedback**

| Token | Value | Role |
|---|---|---|
| `--ct-border` | `#e9ddd0` | Hairline dividers |
| `--ct-border-strong` | `#c9b49e` | Chips, outlined controls |
| `--ct-input-border` | `#dacbb7` | Form fields |
| `--ct-success` / `--ct-error` | `#7c9070` / `#b0563e` | Form and inventory states |

**Geometry & motion**

| Token | Value | Note |
|---|---|---|
| `--ct-container` | `128rem` (1280px) | Dawn's `page_width` setting only steps in hundreds, so the exact value is pinned here |
| `--ct-radius-pill` | `999px` | Exceeds every Dawn radius setting's 40px cap |
| `--ct-radius-panel` … `--ct-radius-sm` | `20 / 16 / 14 / 10px` | Cards, drawers, inputs |
| `--ct-ease` | `0.35s ease` | Single shared duration for all interactive transitions |
| `--ct-tracking-eyebrow` | `0.3em` | Uppercase eyebrow labels |

### Typography

| Role | Family | Delivery | Weights |
|---|---|---|---|
| Display / headings | **Cormorant Garamond** | Self-hosted `.woff2` in `assets/` | 400, 500, 600, 400 italic |
| Body / UI | **Karla** | Shopify font library (`settings.type_body_font`) | 400 |

Cormorant Garamond is not available under that exact name in Shopify's `font_picker` library —
only the visually distinct *Cormorant* display cut — so it is self-hosted rather than substituted.
The 400 weight is `<link rel="preload">`ed because it renders the above-the-fold hero copy.

### Shared primitives

Three classes are defined once in the token layer and reused by every section, so there is a
single definition of each brand control: `.ct-eyebrow`, `.ct-btn` (with `--dark`, `--light`,
`--square`, `--outline` variants), and `.ct-chip`.

### Colour schemes

Two schemes were added to Dawn's native colour-scheme system rather than being hardcoded, so
merchants can apply them to any section from the theme editor:

| Scheme | Background | Text | Used by |
|---|---|---|---|
| `scheme-6` | `#fbf7f2` cream | `#3a2d23` ink | Every light section, cards, cart drawer |
| `scheme-7` | `#3a2d23` ink | `#f3e6d8` warm white | Announcement bar, footer |

---

## Architecture

### Dawn-first principle

The guiding rule of this codebase: **if Dawn can already express it, Dawn expresses it.**

- Dawn's settings-driven variables (`--color-*`, `--page-width`, radius settings) remain the
  source of truth. The `ct-*` tokens only cover roles Dawn's six-field colour-scheme model has
  no slot for.
- No cart, variant, search, or form logic is reimplemented. The custom cart drawer styling sits
  on top of Dawn's own drawer; the newsletter section wraps Shopify's native `customer` form.
- Extended Dawn sections stay backwards compatible. `multicolumn` and `featured-collection` gain
  new settings that are **off by default** — with the flag off, the section renders exactly as
  stock Dawn does.
- Section Rendering API contracts are preserved. `sections/cart-icon-bubble.liquid` mirrors the
  header's cart markup so live cart updates don't desync the header.

### Naming convention

Every brand-owned file, class, setting, and locale key is prefixed `ct-` / `ct_`. This makes the
custom surface area greppable in one command and makes future Dawn upgrades a mechanical diff
rather than an archaeology exercise.

```bash
# Everything this project owns, in one query
grep -rn "ct-\|ct_" --include=*.liquid --include=*.css --include=*.js .
```

### Stylesheet scoping

Each stylesheet is loaded by the section that needs it, not globally:

| File | Loaded by | Scope |
|---|---|---|
| `ct-tokens.css` | `layout/theme.liquid` | Global — tokens + shared primitives only |
| `ct-header.css` | `header.liquid`, `announcement-bar.liquid` | `.ct-header` |
| `ct-homepage-sections.css` | hero, category grid, featured, multicolumn, newsletter | Per-section roots |
| `ct-footer.css` | `footer.liquid` | `.footer` |
| `ct-product.css` | `main-product.liquid` | `.ct-product` |
| `ct-cart-drawer.css` | `cart-drawer.liquid` | `.ct-cart-*` |
| `ct-contact.css` | `contact-form.liquid` | `.ct-contact` |

### No build step

No bundler, transpiler, or preprocessor. The theme is plain Liquid, CSS custom properties, and
vanilla JavaScript — it deploys to Shopify exactly as it exists in this repository. That keeps
the theme editor's live preview honest and removes an entire class of "works locally, breaks in
production" failures.

---

## Feature set

### Storefront

- **Sticky, context-aware header** — transparent over the homepage hero, solidifying past a 40px
  scroll threshold. Measures the announcement bar and header as one group so the hero pull-up
  clears both, and recalculates after webfonts settle.
- **Announcement bar** with merchant-controlled inline emphasis (the promo code is a rich-text
  `<strong>`, not hardcoded markup).
- **Predictive search** and **customer accounts** wired into the header as explicit,
  merchant-toggleable settings.

### Product page

- Breadcrumb derived from the current collection, falling back through `collection` →
  `product.collections.first` → product type.
- **Accordion detail tabs** — Dawn's native `<details>` markup, height-animated via the Web
  Animations API. With JavaScript disabled the accordions still open and close correctly.
- **Mobile sticky add-to-bag bar** — a Dawn-less component that never duplicates form state; its
  button targets the real product form via the HTML `form=` attribute, so the same
  `product-form.js` handler runs.
- **Live line total** on the add-to-bag button (`Add to bag — 2 × $48`), updating with quantity.
- Inventory state indicators (in stock / low / backorder / out).

### Cart

- **Free shipping progress bar** in the cart drawer, driven by a merchant-set threshold
  (`ct_free_shipping_threshold`, default `$75`) with a live remaining-amount message.
- Branded empty state using the monogram mark.
- **Circular inline quick-add** on product cards, with proper `aria-label` per product.

### Contact

- Rebuilt two-column contact page — intro column plus form column, with accessible error
  summary, per-field error links, and a focus-managed success state.

---

## Project structure

```
.
├── assets/
│   ├── ct-tokens.css              # Design tokens, @font-face, shared primitives
│   ├── ct-header.css              # Header + announcement bar
│   ├── ct-homepage-sections.css   # Hero, category grid, newsletter, featured, experience
│   ├── ct-footer.css              # Footer
│   ├── ct-product.css             # Product detail page
│   ├── ct-cart-drawer.css         # Cart drawer + free-shipping bar
│   ├── ct-contact.css             # Contact page
│   ├── ct-accordion.js            # PDP accordion height animation (progressive enhancement)
│   ├── ct-sticky-atc.js           # Mobile sticky add-to-bag bar
│   ├── cormorant-garamond-*.woff2 # Self-hosted display typeface
│   ├── full-logo.svg / mark.svg   # Wordmark + monogram
│   └── ct-*.jpg / ct-icon-*.png   # Section placeholder art + experience icons
│
├── sections/
│   ├── ct-hero.liquid             # ★ Custom — hero and promo banner
│   ├── ct-category-grid.liquid    # ★ Custom — shop-by-category tiles
│   ├── ct-newsletter.liquid       # ★ Custom — split image / email capture
│   ├── header.liquid              # Extended — sticky + transparent-over-hero
│   ├── footer.liquid              # Extended — manual link blocks + follow block
│   ├── featured-collection.liquid # Extended — product_list, eyebrow, circular quick add
│   ├── multicolumn.liquid         # Extended — theme-asset icons, card style
│   ├── main-product.liquid        # Extended — breadcrumb, accordions, sticky ATC
│   └── contact-form.liquid        # Rebuilt — two-column layout
│
├── snippets/
│   ├── card-product.liquid        # Extended — inline circular quick add
│   ├── cart-drawer.liquid         # Extended — free-shipping progress, branded empty state
│   └── buy-buttons.liquid         # Extended — live line total
│
├── templates/
│   ├── index.json                 # Landing page composition
│   ├── product.json
│   └── page.contact.json
│
├── config/
│   ├── settings_data.json         # Brand palette (scheme-6/7), typography, layout
│   └── settings_schema.json       # + free-shipping threshold setting
│
├── locales/
│   ├── en.default.json            # Storefront strings
│   └── en.default.schema.json     # Theme-editor strings for all custom settings
│
└── docs/                          # Repository documentation only — not uploaded to Shopify
    ├── logo.svg                   # Wordmark (fixed bronze, for this README)
    └── mark.svg                   # Monogram
```

★ = section that does not exist in Dawn.

---

## Local development

Requires the [Shopify CLI](https://shopify.dev/docs/api/shopify-cli) (v3+) and a development
store.

```bash
# 1. Authenticate
shopify auth login

# 2. Start a live-reloading dev server against your store
shopify theme dev --store your-store.myshopify.com

# 3. Lint against Shopify's theme rules
shopify theme check

# 4. Push to an unpublished theme for review
shopify theme push --unpublished --theme "Carly Taylor — Review"
```

> **Note** — the homepage expects collections with the handles `necklace`, `bracelets`,
> `earrings`, and `anklets`. Without them, the category grid renders its bundled placeholder
> art and links to `/collections/all`.

---

## Merchant controls

Everything below is editable from **Online Store → Themes → Customize** — no code changes needed.

| Setting | Location | Default |
|---|---|---|
| Hero image, heading, body, CTA label & link | Hero section | Bundled art + brand copy |
| Hero height, scrim direction, content position | Hero section | Fullscreen, left, middle-left |
| CTA style (light / dark / square) | Hero section | Light |
| Category tiles — collection, label, image | Category grid blocks | 4 tiles |
| Featured products — explicit product list | Featured collection | 8 products |
| Experience cards — icon, title, body | Multicolumn blocks | 4 cards |
| Newsletter image side, heading, body | Newsletter section | Right |
| Free shipping threshold | Theme settings → Cart | `$75` |
| Announcement text + promo emphasis | Announcement bar | Welcome offer |
| Footer links, contact email, copyright | Footer blocks | Brand defaults |
| Search / account icon visibility | Header section | Both on |

---

## Accessibility

Accessibility is treated as a constraint, not a pass at the end.

- **Dawn's foundations are preserved** — focus trapping in the drawer and modals, skip links,
  `visually-hidden` labelling, and live regions are untouched.
- **Reduced motion is honoured everywhere.** Every transition and animation in the `ct-*` layer
  has a `prefers-reduced-motion: reduce` counterpart; the PDP accordion script exits early and
  falls back to native `<details>` behaviour.
- **Progressive enhancement, strictly.** Both custom scripts null-check every lookup and fail
  silently to a working baseline. With JavaScript off: accordions still toggle, the product form
  still submits, the cart still works.
- **Focus is always visible** — `:focus-visible` rings use `--ct-champagne` at 2px with 2px
  offset, on every custom control.
- **Semantic headings** — heading levels are editor-controlled (`heading_tag`) so a merchant
  can keep exactly one `<h1>` per page.
- **Icon-only controls** carry per-item accessible names (e.g. quick-add announces the product
  title, not just "Add").

## Performance

- **No build, no framework, no runtime dependency.** Total custom JavaScript is two small
  vanilla files, both `defer`-loaded, plus a handful of inline section scripts.
- **LCP is explicit.** The hero exposes an `eager_load` setting that drives `loading="eager"` and
  `fetchpriority="high"`; the mid-page banner reuse leaves it off and lazy-loads.
- **Fonts are self-hosted with `font-display: swap`,** and only the single above-the-fold weight
  is preloaded.
- **Stylesheets are section-scoped** — the product page never downloads footer or contact CSS.
- **Scroll work is throttled** through `requestAnimationFrame` with passive listeners.

---

## Roadmap

- [ ] Collection page template restyle (filters, sort, pagination)
- [ ] Blog / journal template
- [ ] Product bundle and "complete the look" cross-sell block
- [ ] Metafield-driven care instructions on the PDP
- [ ] Additional locale files beyond `en.default`

---

## Credits

Built on [Shopify Dawn](https://github.com/Shopify/dawn), Shopify's reference Online Store 2.0
theme, which is released under the [MIT License](https://github.com/Shopify/dawn/blob/main/LICENSE.md).

Typefaces: [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) and
[Karla](https://fonts.google.com/specimen/Karla), both under the SIL Open Font License.

Brand, art direction, and all `ct-*` source in this repository are the property of
Carly Taylor Jewelry.

---

<div align="center">

<img src="docs/mark.svg" alt="" width="34">

<sub>Built with Liquid, CSS custom properties, and a strong preference for not reinventing Dawn.</sub>

</div>
