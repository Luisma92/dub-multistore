# Store Selection Page — Manual E2E Smoke Test

> Automated E2E coverage (Playwright) can be added later. This document describes
> the manual flow to verify the feature end-to-end in a staging or local environment.

## Prerequisites

- A running local dev server (`pnpm dev` from repo root)
- A valid workspace with at least one domain configured
- `TINYBIRD_API_URL` and `TINYBIRD_API_KEY` set in `.env.local`
- Tinybird CLI authenticated (`tb auth`) with the datasource pushed (`tb push`)

---

## Step 1 — Create a product via API

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Cookie: <your-session-cookie>" \
  -d '{
    "name": "Smoke Test Shop",
    "slug": "smoke-shop",
    "description": "E2E smoke test product",
    "platforms": [
      { "platform": "shopify", "label": "Shopify", "url": "https://smoke.myshopify.com" },
      { "platform": "amazon", "label": "Amazon", "url": "https://amazon.com/dp/smoke-test" }
    ]
  }'
```

Expected: `201 Created` with a product object including `id` and `slug`.

---

## Step 2 — Visit the store selection page

Open in a browser (or curl):

```
http://localhost:3000/p/smoke-shop
```

Expected:
- Page renders with product name "Smoke Test Shop"
- Two platform buttons are visible (Shopify, WooCommerce)
- OG meta tags are present in `<head>` (check DevTools → Elements)

---

## Step 3 — Click a platform button

Click the **Shopify** platform button.

Expected:
- Browser redirects to `https://smoke.myshopify.com`
- No error is shown before redirect

---

## Step 4 — Verify Tinybird event

Query the Tinybird pipe:

```bash
curl "https://api.tinybird.co/v0/pipes/platform_clicks.json?slug=smoke-shop" \
  -H "Authorization: Bearer $TINYBIRD_API_KEY"
```

Expected response (within ~10 seconds of the click):

```json
{
  "data": [
    { "platform": "shopify", "clicks": 1 }
  ]
}
```

---

## Step 5 — Verify 404 for unknown slug

```bash
curl -I http://localhost:3000/p/does-not-exist
```

Expected: HTTP `404 Not Found`.

---

## Cleanup

Delete the test product:

```bash
curl -X DELETE http://localhost:3000/api/products/smoke-shop \
  -H "Cookie: <your-session-cookie>"
```
