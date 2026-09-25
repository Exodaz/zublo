<p align="center">
  🇹🇭 <a href="./README.md"><strong>ภาษาไทย</strong></a> &nbsp;|&nbsp; 🇬🇧 <strong>English</strong>
</p>


<p align="center">
  <img src=".github/assets/logo-main.png" alt="Zublo" width="90%" />
</p>

<p align="center">
  <strong>Self-hosted subscription tracking with AI that is actually useful.</strong>
</p>

<p align="center">
  Open source. Docker-first. Built for self-hosters, homelabs, and people who want control over recurring payments.
</p>

<p align="center">
  <a href="#deploy-in-minutes"><strong>Deploy in minutes</strong></a>
  ·
  <a href="#demo"><strong>See the demo section</strong></a>
  ·
  <a href="./ARCHITECTURE.md"><strong>Read the architecture</strong></a>
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-1f6feb?style=flat-square" alt="Apache 2.0 License" /></a>
  <a href="https://github.com/danielalves96/zublo/stargazers"><img src="https://img.shields.io/github/stars/danielalves96/zublo?style=flat-square" alt="GitHub stars" /></a>
  <a href="https://github.com/danielalves96/zublo/issues"><img src="https://img.shields.io/github/issues/danielalves96/zublo?style=flat-square" alt="GitHub issues" /></a>
  <a href="#deploy-in-minutes"><img src="https://img.shields.io/badge/deploy-Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker deployment" /></a>
  <a href="https://pocketbase.io/"><img src="https://img.shields.io/badge/backend-PocketBase-111111?style=flat-square" alt="PocketBase" /></a>
  <a href="#ai-built-in"><img src="https://img.shields.io/badge/AI-built--in-0f766e?style=flat-square" alt="AI built in" /></a>
  <a href="#perfect-for"><img src="https://img.shields.io/badge/model-self--hosted-2f855a?style=flat-square" alt="Self-hosted" /></a>
</p>

Zublo is an open source subscription tracker for people who want every recurring payment in one place, full control over their data, and a deployment flow that takes minutes instead of a weekend.

It gives you a clean web UI, recurring payment visibility, reminders, calendar and statistics views, API access, and a Docker-first setup built for self-hosters.

It also has one of the most differentiated parts of the product built in: an AI layer that can analyze spending, power chat-based workflows, and connect to multiple LLM providers instead of locking you into a single vendor.

If you want a focused alternative to bloated finance software or closed SaaS trackers, this is the repo.

> **This fork** adds features for shared and resold family plans:
> - members and expiry reminders
> - brand logos and service tabs
> - payment accounts and a subscription summary
> - export/import with members
> - free Frankfurter exchange rates
>
> See [Fork Features](#fork-features). Install from `ghcr.io/exodaz/zublo`.

## Why This Repo Gets Attention

- It solves a real problem with a narrow, practical scope
- It is self-hosted, so your data stays under your control
- It is easy to deploy and easy to understand
- It uses a compact stack instead of a pile of infrastructure
- It is useful on day one, even if you never touch the code

## At A Glance

| What matters | Why it lands |
|---|---|
| One job, done well | Track recurring payments without turning into a full finance suite |
| Fast deployment | A simple Docker setup gets the app running quickly |
| Real ownership | Your data lives on your infrastructure |
| AI that is actually useful | Chat, recommendations, and provider flexibility are part of the product |
| Compact architecture | React frontend, PocketBase runtime, no unnecessary platform sprawl |
| Forkable codebase | Small enough to understand, practical enough to extend |

## Perfect For

| Use case | Why Zublo fits |
|---|---|
| Self-hosters | One container, SQLite persistence, no heavy platform requirements |
| Homelab users | Small footprint, easy backup story, easy reverse proxy integration |
| Privacy-minded users | Your subscription data stays on your own infrastructure |
| Indie builders | Compact full-stack codebase that is practical to fork and extend |
| Teams tracking shared spend | Clear recurring cost visibility without adopting a full finance suite |

## Demo

Demo screenshots


<p align="center">
  <img src="./.github/assets/dashboard.png" alt="Zublo dashboard demo" width="100%" />
</p>

<p align="center">
  <img src="./.github/assets/subscriptions.png" alt="Subscriptions view" width="100%" />
</p>

<p align="center">
  <img src="./.github/assets/calendar.png" alt="Calendar view" width="100%" />
</p>

<p align="center">  
  <img src="./.github/assets/statistics.png" alt="Statistics view" width="100%" />
</p>

<p align="center">
  <img src="./.github/assets/chat.png" alt="Chat view" width="100%" />
</p>

## Feature Overview

| Area | What you get |
|---|---|
| Subscriptions | Recurring billing cycles, due dates, payment context, change history with total spent |
| Subscription summary | Click any subscription for a one-screen summary: cost per period, month and year, billing, payment account, members, notes |
| Family sharing | People each subscription is shared with: name, email, amount paid, expiry date |
| Expiry reminders | Notifications before a shared member's access expires, through the same providers as payment reminders |
| Services & brand logos | 48 preset services (Netflix, YouTube, Spotify, Prime Video, HBO Max, Microsoft 365, …) plus Brandfetch search, with hotlinked brand logos |
| Service tabs & grouping | Tabs per service (MS365, Netflix, Spotify, …) built from each subscription's service or URL, and an optional grouped view with a count, yearly cost and member total per service |
| Payment account | Record which account a subscription is billed to, e.g. an Apple ID |
| Export / import | Full backup and restore as JSON or Excel, members included; Wallos JSON import |
| Calendar | Upcoming payments and member expiries in a calendar view |
| Dashboard | High-level cost visibility and summary metrics |
| Statistics | Spending breakdowns and trend visibility |
| Currencies | Multi-currency handling with exchange-rate sync from [Frankfurter](https://frankfurter.dev) (free, no API key, 200+ currencies), Fixer.io or APILayer |
| API access | REST usage through scoped API keys |
| AI | Chat-based workflows, recommendations, and pluggable providers |
| Authentication | TOTP-based 2FA |
| Deployment | Single self-hosted app with Docker |

## Fork Features

This fork adapts Zublo to **shared and resold family plans**: Microsoft 365 Family, Spotify Family, YouTube Premium Family and similar plans split between several people, where you need to track who pays what and whose access ends when.

| # | Feature | Where | Since |
|---|---|---|---|
| 1 | [Family sharing members](#1-family-sharing-members) | Members button on a card | 0.7.0-family.1 |
| 2 | [Member expiry reminders](#2-member-expiry-reminders) | Automatic | 0.7.0-family.1 |
| 3 | [Member expiries on the calendar](#3-member-expiries-on-the-calendar) | Calendar page | 0.7.0-family.1 |
| 4 | [Services and brand logos](#4-services-and-brand-logos) | Subscription form | 0.7.0-family.1 |
| 5 | [Payment account](#5-payment-account) | Subscription form | 0.7.0-family.1 |
| 6 | [Subscription summary](#6-subscription-summary) | Click a card | 0.7.0-family.1 |
| 7 | [Export and import](#7-export-and-import) | Subscriptions page | 0.7.0-family.2 |
| 8 | [Frankfurter exchange rates](#8-frankfurter-exchange-rates) | Settings → Exchange Rate API | 0.7.0-family.3 |
| 9 | [Service tabs and grouping](#9-service-tabs-and-grouping) | Top of the Subscriptions page | 0.7.0-family.4 |

### 1. Family sharing members

- Open **Members** (people icon) on a subscription card, or "Manage members" in the summary.
- Each member has:
  - a name (required)
  - an email
  - the amount they pay, in the subscription's currency. It is shown as the collected total only and is not added to spending statistics.
  - an expiry date, optional. Empty means no expiry.
  - notes
- Status badges:
  - 🟢 active
  - 🟡 expiring within 7 days or today
  - 🔴 expired
- The card shows a member count tinted by the most urgent status.
- Members are removed together with their subscription.

### 2. Member expiry reminders

- An hourly job reminds you before a member expires.
- It uses the reminder slots (days before + hour) from Settings → Notifications.
- It sends through every configured provider: email, Telegram, Discord, Gotify, ntfy, webhook, …
- Each reminder is sent once per day, and inactive subscriptions are skipped.

### 3. Member expiries on the calendar

- The Calendar shows member expiries as dashed sky-blue chips next to payments. They are never counted in payment totals.
- Selecting a day lists its expiries under "Member expiries".
- Clicking an expiry opens the members dialog, e.g. to extend the date.

### 4. Services and brand logos

The **Service** field at the top of the subscription form offers:

1. 48 presets, including:
   - streaming and music: Netflix, YouTube Premium, Spotify, Prime Video, HBO Max, Disney+, Viu, WeTV, TrueID, JOOX
   - productivity and storage: Microsoft 365, Google One, iCloud+, Canva
   - AI: ChatGPT, Claude
2. [Brandfetch](https://brandfetch.com/developers/logo-api) brand search for anything else
3. any domain you type, e.g. `canva.com`

Choosing a service:

- It fills an empty name and URL and sets the logo. The Logo section previews it, and you can still search or upload another image.
- Logos are chosen in this order:
  1. uploaded logo
  2. selected service
  3. the domain in the subscription's URL, so older records get logos too
  4. the first letter of the name
- They appear on cards (grid and list), the summary, the calendar and the dashboard.

Brandfetch requirements:

- Brandfetch requires hotlinking, so only the domain is stored and images always load from its CDN.
- Brand logos and brand search need `BRANDFETCH_CLIENT_ID` (see [Configuration](#configuration)). Without it, letter placeholders are shown.

### 5. Payment account

- **Payment account** records which account a subscription is billed to, e.g. the Apple ID or Google account that holds it.
- It is free text, separate from the payment method (Visa, PayPal, …).
- It is shown on cards; hover to see a long email in full.

### 6. Subscription summary

Click anywhere on a card, or press Enter on a focused card, to open a summary:

| Section | Contents |
|---|---|
| Header | Logo, name, category, active/inactive |
| Cost | Price per period, per month, per year, and total spent so far |
| Billing | Next payment (days left), start date, auto renew, payment count or end date, cancellation date, reminder |
| Payment | Currency, payment method, payment account, payer |
| Members | Count, collected total, each member with an expiry badge |
| Notes | URL (clickable) and full notes |

Buttons lead to **History**, **Manage members** and **Edit**. The card's own buttons keep working without opening the summary.

### 7. Export and import

**Export** and **Import** on the Subscriptions page back up or move everything. Exported data:

- every field: price, cycle, dates, finite schedules, reminders, auto mark paid, notes, URL
- the service and the payment account
- category, payment method and payer, by name
- family-sharing members

| Format | What you get | Import |
|---|---|---|
| JSON | One file: `{ "format": "zublo", "version": 2, "subscriptions": [...] }` with members nested in each subscription | ✓ |
| Excel (.xlsx) | Two sheets: **Subscriptions**, and **Members** linked through `subscription_id` | ✓ edit in Excel, then import back |
| Wallos JSON | Export from [Wallos](https://github.com/ellite/Wallos) | ✓ |

How import handles your data:

- It **adds records and never overwrites**, so importing the same file twice creates duplicates.
- Categories, payment methods and payers are matched by name, and created if missing.
- Currencies are matched by code. Unknown codes fall back to your main currency.
- A toast reports imported subscriptions and members.
- Older Zublo exports still import.

### 8. Frankfurter exchange rates

- In **Settings → Exchange Rate API**, choose **Frankfurter (free, no API key)** and press **Save**. It is the default for new setups.
- [Frankfurter](https://frankfurter.dev) publishes daily central-bank reference rates for 200+ currencies, including THB, with no sign-up and no API key.
- Rates update twice a day (midnight and noon) or on demand with **Update exchange**. Changing the main currency refreshes them.
- Fixer.io and APILayer (API key required) still work, and a stored key survives switching providers.

### 9. Service tabs and grouping

- The top of the Subscriptions page has **one tab per service**, e.g. `[All 50] [Microsoft 365 49] [Google Gemini 1]`, each with its logo and count.
  - Tabs are built from each subscription's service, or else its URL domain.
  - Anything without either lands in **Other**.
- A tab filters the list, together with search and the existing filters.
- **Group by service** shows a header per service with:
  - its logo
  - the number of subscriptions
  - the **yearly cost** in your main currency, counting active expenses only
  - the member total
- The grouping choice is remembered in the browser.

### Example: a Microsoft 365 Family plan shared by five people

1. **Add subscription:**
   - Pick **Microsoft 365** as the service. The name, URL and logo are filled in.
   - Set the yearly price, cycle **Yearly** and the next payment date.
   - Put the paying Apple ID in **Payment account**.
2. Open **Members** and add the five customers with email, amount paid (e.g. 400) and expiry date.
3. Set a reminder in **Settings → Notifications**, e.g. 7 days before at 09:00. You get reminded both about the payment and about each customer's expiry.
4. Use the **Microsoft 365** tab and **Group by service** to see all accounts and their yearly total.
5. **Export** to Excel as a backup, or bulk-edit and **Import** back.

### Changelog

| Version (image tag) | Added | Migration |
|---|---|---|
| `0.7.0-family.1` | Family members, expiry reminders, calendar expiries, services & brand logos, payment account, subscription summary | Yes (members table, `brand_domain`, `payment_account`) |
| `0.7.0-family.2` | Full export/import (members, Excel) and a fix for imports dropping the start date | No |
| `0.7.0-family.3` | Frankfurter exchange rates | Yes (adds the `frankfurter` option) |
| `0.7.0-family.4` | Service tabs and group-by-service view | No |

Migrations run automatically on start and keep existing data.

## AI Built In

This is not a cosmetic AI checkbox.

Zublo includes an AI layer that can work with your subscription data and support real product workflows:

- AI-powered recommendations from your spending data
- chat interface wired into app capabilities
- support for multiple provider setups instead of a single locked vendor
- compatibility with local or self-hosted inference paths

Supported provider model includes:

- Google Gemini
- OpenAI
- Ollama
- OpenAI-compatible endpoints such as OpenRouter, Groq, Mistral, and similar gateways

That makes Zublo interesting not only as a self-hosted subscription tracker, but also as a practical example of an AI-enabled product that still keeps deployment and ownership simple.

## Why It Feels Good To Self-Host

| Characteristic | What that means in practice |
|---|---|
| Single app runtime | Frontend and backend ship together |
| SQLite persistence | Simple backups and low operational overhead |
| PocketBase core | Auth, data, and admin capabilities without a large backend stack |
| Docker-first packaging | Easy to run on VPS, NAS, mini-PC, or homelab |
| Narrow product scope | Less maintenance drag than a general finance platform |

## What Zublo Is Not

- not a full accounting suite
- not a bookkeeping platform
- not a bank sync product
- not a cloud-only SaaS

That narrow scope is the point.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, TanStack Router, React Query, Tailwind CSS |
| Backend runtime | PocketBase |
| Backend customization | PocketBase JS hooks and migrations |
| Persistence | SQLite via PocketBase |
| Packaging | Docker, Docker Compose, GHCR |

## Deploy In Minutes

Images are published to GitHub Container Registry for `linux/amd64` and `linux/arm64`:

| Tag | Use it for |
|---|---|
| `ghcr.io/exodaz/zublo:latest` | The newest build of this fork |
| `ghcr.io/exodaz/zublo:0.7.0-family.1` | A pinned version (recommended for servers) |

This fork adds family sharing, services with brand logos, payment accounts and the subscription summary. The upstream image without these features is `ghcr.io/danielalves96/zublo`.

**1. Create a folder with a `.env` file**

```bash
mkdir zublo && cd zublo
cat > .env <<'ENV'
PB_ENCRYPTION_KEY=replace-with-a-long-random-string
BRANDFETCH_CLIENT_ID=
ENV
```

Generate a key with `openssl rand -hex 32`. `BRANDFETCH_CLIENT_ID` is optional (see [Configuration](#configuration)).

**2. Create `docker-compose.yml`**

```yaml
services:
  zublo:
    image: ghcr.io/exodaz/zublo:latest
    container_name: zublo
    restart: unless-stopped
    ports:
      - "9597:9597"
    environment:
      PB_ENCRYPTION_KEY: ${PB_ENCRYPTION_KEY}
      BRANDFETCH_CLIENT_ID: ${BRANDFETCH_CLIENT_ID:-}
    volumes:
      - ./zublo-data:/pb/pb_data
```

**3. Start it**

```bash
docker compose up -d
```

Or with plain Docker:

```bash
docker run -d --name zublo --restart unless-stopped \
  -p 9597:9597 \
  -e PB_ENCRYPTION_KEY=replace-with-a-long-random-string \
  -e BRANDFETCH_CLIENT_ID= \
  -v "$(pwd)/zublo-data:/pb/pb_data" \
  ghcr.io/exodaz/zublo:latest
```

**Upgrading**

```bash
docker compose pull && docker compose up -d
```

Database migrations run automatically on start. Back up `zublo-data` before upgrading between versions.

**Switching from the upstream image**

Change `image:` to `ghcr.io/exodaz/zublo:latest` and keep the same `pb_data` volume. The new migrations add columns and a table, so existing data stays as it is.


Then open:

- `http://localhost:9597` for the app
- `http://localhost:9597/_/` for PocketBase admin
- `http://localhost:9597/api/` for the REST API

Important:

- persist `/pb/pb_data`
- set `PB_ENCRYPTION_KEY` in real deployments
- the first registered user becomes the initial admin
- optionally set `BRANDFETCH_CLIENT_ID` for brand logos (see below)

### Configuration

| Variable | Required | Purpose |
|---|---|---|
| `PB_ENCRYPTION_KEY` | Recommended | Encrypts PocketBase settings at rest. Set it to a long random value in real deployments. |
| `BRANDFETCH_CLIENT_ID` | Optional | Enables brand logos and brand search for services. Get a free Client ID at https://developers.brandfetch.com/register (Logo API section). |

About `BRANDFETCH_CLIENT_ID`:

- **Use the Client ID, not the API key.** The Client ID is short and starts with `1id…`. It is meant to appear in public image URLs.
- The API key is a secret and does not work with the logo CDN.
- The free tier covers up to 1M requests per month.
- With Docker Compose, put the values in a `.env` file next to `docker-compose.yml`:

```dotenv
PB_ENCRYPTION_KEY=change-me-in-production
BRANDFETCH_CLIENT_ID=1idXXXXXXXXXXXXXXX
```

### Running Behind A Reverse Proxy

Zublo is a single PocketBase process, so any proxy that forwards plain HTTP to `9597` without buffering or rewriting the request body works. A minimal Caddy example:

```
zublo.example.com {
    reverse_proxy localhost:9597
}
```

If you enable MFA or update your profile and get unexpected `400` responses, the most common cause is a proxy directive that buffers, compresses, or rewrites the request body (large `client_max_body_size`/`request_body` tweaks, aggressive compression, or a `Content-Length`/chunked mismatch). Keep the proxy config as close to a plain passthrough as possible; there's no proxy-specific handling required on the Zublo side.

## Local Development

If you want to work on the repo itself:

```bash
bun install
bun run dev
```

This starts:

- Vite on `http://localhost:5173`
- PocketBase on `http://127.0.0.1:8080`

For non-Docker local development, the repository expects a PocketBase binary at `apps/backend/pocketbase`. It is git-ignored; download the version pinned in the `Dockerfile` (`PB_VERSION`) for your platform from the [PocketBase releases](https://github.com/pocketbase/pocketbase/releases).

To try brand logos locally, pass the Client ID when starting:

```bash
BRANDFETCH_CLIENT_ID=1idXXXXXXXXXXXXXXX bun run dev
```

Tests:

```bash
bun run test            # frontend + backend
bun run test:coverage   # same, enforcing the 100% coverage thresholds CI uses
bun run lint
```

## Architecture At A Glance

Zublo is intentionally compact.

- `apps/web` contains the React application
- `apps/backend` contains PocketBase hooks, migrations, runtime assets, and backend behavior
- the frontend is built into `apps/backend/pb_public` for production serving
- PocketBase serves both the API and the built frontend in production
- mutable runtime data lives in `/pb/pb_data`

In local development:

- Vite serves the frontend
- PocketBase serves the API
- Vite proxies `/api` to PocketBase

In production:

- one container serves the frontend and backend together

For the full repository-level architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md).
For frontend-specific structure and page composition rules, see [apps/web/ARCHITECTURE.md](./apps/web/ARCHITECTURE.md).

## Repository Layout

```text
.
├── apps/
│   ├── backend/   # PocketBase hooks, migrations, runtime assets
│   └── web/       # React application
├── scripts/       # Maintainer utilities
├── Dockerfile
├── docker-compose.yml
├── Makefile
├── README.md      # Thai (main)
└── README.en.md   # English
```

## Who This Repository Is For

- self-hosters
- homelab users
- contributors who want a small, understandable full-stack app
- developers interested in PocketBase-backed products

## Why The Codebase Stays Approachable

- React frontend and PocketBase backend live in the same repo
- custom backend logic is grouped by domain in hook files
- the production runtime is compact and easy to reason about
- the deployment model is simple enough for solo operators
- the product scope is intentionally constrained

## Contributing

Zublo is still shaping its public open source surface. Good contributions right now are the ones that improve clarity, onboarding, maintainability, and narrowly scoped behavior.

Start here:

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [SUPPORT.md](./SUPPORT.md)
- [SECURITY.md](./SECURITY.md)
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

## Maintainer

Zublo is maintained by Daniel Luiz Alves.

GitHub: `@danielalves96`

## License

Zublo is licensed under Apache License 2.0.

Copyright Daniel Luiz Alves.

See [LICENSE](./LICENSE) and [NOTICE](./NOTICE).
