
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

<p align="center"><strong>English</strong> · <a href="./README.th.md">ภาษาไทย</a></p>

Zublo is an open source subscription tracker for people who want every recurring payment in one place, full control over their data, and a deployment flow that takes minutes instead of a weekend.

It gives you a clean web UI, recurring payment visibility, reminders, calendar and statistics views, API access, and a Docker-first setup built for self-hosters.

It also has one of the most differentiated parts of the product built in: an AI layer that can analyze spending, power chat-based workflows, and connect to multiple LLM providers instead of locking you into a single vendor.

If you want a focused alternative to bloated finance software or closed SaaS trackers, this is the repo.

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
| Payment account | Record which account a subscription is billed to, e.g. an Apple ID |
| Calendar | Upcoming payments and member expiries in a calendar view |
| Dashboard | High-level cost visibility and summary metrics |
| Statistics | Spending breakdowns and trend visibility |
| Currencies | Multi-currency handling with exchange-rate sync |
| API access | REST usage through scoped API keys |
| AI | Chat-based workflows, recommendations, and pluggable providers |
| Authentication | TOTP-based 2FA |
| Deployment | Single self-hosted app with Docker |

## Family Sharing, Services & Brand Logos

Made for plans you share or resell, such as a Microsoft 365 Family or Spotify Family plan split between several people.

**Family sharing members**

- Open **Members** from a subscription card to add, edit or remove the people it is shared with: name, email, the amount each one pays and an optional expiry date.
- Each member gets a status badge: active, expiring within 7 days, or expired. The card shows a member count tinted by the most urgent status.
- Member expiries appear on the calendar next to payments, without being counted in payment totals. Clicking one opens the members dialog.
- An hourly job sends reminders before a member expires. It reuses the reminder slots (days before + hour) and notification providers from your notification settings, and never sends the same reminder twice in a day.
- Members are removed together with their subscription.

**Services and brand logos**

- The **Service** field in the subscription form lists 48 popular services and searches the [Brandfetch](https://brandfetch.com/developers/logo-api) brand database for anything else. You can also type any domain, e.g. `canva.com`.
- Choosing a service fills an empty name and URL and sets the logo. Only the domain is stored.
- Logos come from the Brandfetch CDN. Brandfetch requires hotlinking, so Zublo never downloads or stores them: `/api/brand-logo` redirects the browser to the CDN.
- Subscriptions without an uploaded logo or a service fall back to the logo of their URL's domain. An uploaded logo always wins.
- Brand logos need `BRANDFETCH_CLIENT_ID` (see [Configuration](#configuration)). Without it, a letter placeholder is shown.

**Payment account and subscription summary**

- **Payment account** records which account a subscription is billed to, such as the Apple ID that holds an in-app subscription. It is shown on the card and in the summary.
- Clicking a subscription card opens a summary with:
  - cost per billing period, per month, per year, and total spent so far
  - billing dates and reminders
  - payment details
  - members and their expiry status
  - URL and notes
  - shortcuts to edit, members and history

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

Create a `docker-compose.yml` like this:

```yaml
services:
  zublo:
    image: ghcr.io/danielalves96/zublo:latest
    container_name: zublo
    restart: unless-stopped
    ports:
      - "9597:9597"
    environment:
      PB_ENCRYPTION_KEY: "change-me-in-production"
    volumes:
      - ./zublo-data:/pb/pb_data
```

Start it:

```bash
docker compose up -d
```


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
├── README.md      # English
└── README.th.md   # Thai
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
