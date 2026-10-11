# Auravya theme — install & setup guide

A Shopify Online Store 2.0 theme for an Indian 925 silver jewellery brand: ₹ pricing in
Indian format, COD, pincode delivery check, WhatsApp chat, festive offers and shop-by-price.
The theme lives in [`auravya-theme/`](auravya-theme). Everything is editable from
**Online Store → Themes → Customize**, so you don't need to touch code.

---

## 1. Install

1. Download `auravya-theme.zip` (or zip the *contents* of `auravya-theme/`, so `layout/`,
   `sections/` and the other folders are at the top level of the zip).
2. In Shopify go to **Online Store → Themes → Add theme → Upload zip file**.
3. Click **Customize** to preview it, then **Publish** when ready.

The theme passes Shopify's official Theme Check with 0 errors.

## 2. Store settings (one-time)

| Where | What to set |
|---|---|
| Settings → Store details | Currency **Indian Rupee (INR)**. |
| Settings → Markets | India as primary market. |
| Settings → Payments | Razorpay / PayU / Cashfree for UPI and cards. Enable **Cash on Delivery (COD)** under manual payment methods. |
| Settings → Taxes and duties | Turn on "All prices include tax" (Indian MRP is tax-inclusive). |
| Settings → Shipping | Your free-shipping rule (e.g. ₹1,499+) — match it in Theme settings → Cart. |
| Apps → **Shopify Search & Discovery** (free) | Add filters: Availability, Price, Coating (option), Size (option), Product type. These power the collection filters. |
| Discounts | Create the coupon codes you show in the offer strip / "Available offers" (FESTIVE15, SILVER10…). |

## 3. Menus (Online Store → Navigation)

| Handle | Used for |
|---|---|
| `main-menu` | Header. An item titled **Shop All** opens the mega menu (rename in Theme settings → Header). |
| `footer-shop`, `footer-help`, `footer-company` | Footer columns and mega-menu column links. |
| `footer-coatings` | Mega menu "By metal finish" column. |

## 4. Collections used by the homepage

`best-seller`, `new-arrival`, `necklaces`, `earrings`, `rings`, `bracelets`, `anklets`,
`daily-wear`, `festive`, `gifts-for-her`, `men`. You can create these, or pick different
collections on each section in the editor.

## 5. Products

- **Options:** name the finish option `Coating` (or Color / Finish / Plating) to get swatches,
  and size options `Size` / `Ring Size` / `Chain Length` to get size pills and the size guide.
  Swatch colours are set in **Theme settings → Product options → Swatch colours**.
- **Variant images:** assign an image to each coating variant so the gallery switches. If you
  haven't uploaded one yet, the theme tints the photo with the swatch colour.
- **MRP / sale price:** put the MRP in *Compare-at price*. The theme shows `₹1,499  MRP ₹1,999  25% off`.
- **Optional metafields (namespace `custom`):** `material`, `dimensions`, `weight`, `stone`,
  `plating`. Tag a product `no-engraving` to hide engraving on it, and `bestseller` for the
  badge.
- **Reviews:** install any review app (Judge.me, Loox, Yotpo…). Stars read Shopify's standard
  rating metafields. Add the app's block on the product page if it has one.

## 6. Paid engraving & gift wrap (optional)

By default engraving and gift wrap are **free** line-item notes. To charge for them:

1. Create a product called **Engraving** (₹199) and one called **Gift wrap** (₹149). Keep them
   out of your collections and the search channel.
2. In **Theme settings → Product options**, pick them under *Engraving charge product* and *Gift
   wrap charge product*.

The theme then adds the charge to the cart automatically, alongside the piece.

## 7. Indian-store features and where to edit them

| Feature | Where |
|---|---|
| ₹ lakh format (₹1,49,999), hide .00 | Theme settings → Currency & pricing |
| "MRP inclusive of all taxes" note, MRP label | Theme settings → Currency & pricing |
| COD note | Theme settings → Product options / Trust & policies |
| Pincode check: delivery days, blocked pincodes, non-COD pincodes | Theme settings → Product options |
| WhatsApp floating button + pre-filled message | Theme settings → Social media |
| Announcement bar messages (separate with `\|`) | Theme settings → Header & announcement |
| Free-shipping progress bar | Theme settings → Cart & wishlist |
| Festive offer strip with coupon + countdown | Homepage → Offer strip |
| Shop by price (Under ₹999…) | Homepage → Shop by price |
| Shop by occasion | Homepage → Category grid |
| Shoppable reels (vertical videos) | Homepage → Shoppable reels |
| Available offers on product page | Product template → Available offers block |
| GSTIN / address / support hours | Footer section settings |

## 8. Pages

Create pages and assign the template in the page editor:

| Page | Template |
|---|---|
| About us | `page.about` |
| FAQ | `page.faq` (adds FAQ rich results for Google) |
| Contact | `page.contact` |
| Size guide (handle `size-guide`) | `page.size-guide`. Its content also shows in the size-guide popup. |

Policies (refund, shipping, privacy, terms) come from **Settings → Policies** and link
automatically in the footer.

## 9. Long-term maintenance

- No build step: plain Liquid, CSS and vanilla JS. Edit with `shopify theme dev` or the code editor.
- Check before uploading: `shopify theme check` (or `npx @shopify/theme-check-node`).
- Every product-page row is a block, so it can be reordered or removed in the editor, and
  review/upsell apps can be added as app blocks.
- Strings are in `locales/en.default.json`. Duplicate it as `hi.json` to add Hindi.

## What changed from the uploaded zip

**Fixes for things that broke install or the live store**
- 6 sections declared `blocks` as an object, so Shopify rejected the upload. They now use the correct array format.
- Invalid `unit` attributes on number settings, which also blocked the upload, were removed.
- All JavaScript loaded in `<head>` before the page existed, so the header, slider,
  wishlist, announcement rotation and quick add didn't work. Scripts are now `defer`red.
- Theme fonts were never loaded. They're now loaded with `font_face` and preloaded.
- The newsletter posted to the contact form and never created subscribers. It now uses
  Shopify's customer form, with success and error states.
- Engraving and gift wrap showed "+₹199 / +₹149" but never charged. They now charge through real add-on products.
- Filters and sorting only reorganised the 12 products on the current page. They now use
  Shopify's native filtering and sorting, with AJAX updates and a mobile drawer.
- Predictive search, quick view and recommendations called the wrong endpoints. They now use
  the Predictive Search, Section Rendering and Product Recommendations APIs.
- Cart drawer HTML wasn't escaped (engraving text could inject HTML). The cart page
  quantity and remove buttons did nothing.
- Card swatches only matched "Coating". Dynamic checkout (Buy now / UPI) buttons never rendered.
- Ratings read the wrong metafield shape. Low-stock never updated on variant change.
- Sold-out combinations weren't greyed out.

**Additions:** Indian ₹ formatting, the MRP label, real delivery-date pincode estimate with COD
rules, the WhatsApp button, festive offer strip with countdown, shop by price, shoppable reels,
Instagram grid, FAQ with schema, rich text, recently viewed, product recommendations, the
"Available offers" block, a block-based product page with app-block support, a gift card page,
About and FAQ page templates, and editable footer contact details.
