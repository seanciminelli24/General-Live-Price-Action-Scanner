# Quickstart

## 1. Install

```bash
npm install
```

## 2. Configure Environment

Copy `.env.example` to `.env` and set a private webhook secret.

```bash
cp .env.example .env
```

Never commit `.env`.

## 3. Configure Watchlists

Edit `config/watchlists.example.json` and copy it to `config/watchlists.json` when you are ready to run locally.

Each watchlist can define:

- Symbols.
- Timeframes.
- Sessions.
- Strategy plugins.
- Symbol sync behavior.

## 4. Add TradingView Script

Open `tradingview/generic-live-bar-feed.pine` in TradingView and create an alert with webhook delivery.

Use this webhook endpoint:

```text
https://your-public-tunnel-url/webhook/tradingview/bar
```

TradingView webhooks require a public HTTPS URL. For local development, use a secure tunnel.

## 5. Start Scanner

```bash
npm run dev
```

Health endpoint:

```text
GET http://localhost:8790/health
```

Scanner status:

```text
GET http://localhost:8790/api/scanner/status
```

## 6. Verify Data Flow

The dashboard and status endpoint should show:

- Latest candle timestamp.
- Symbol health.
- Timeframe counts.
- Accepted/rejected webhook events.

## Safety Note

The MVP is scan-only. Do not add broker execution until alerting, risk checks, stale-data handling, and explicit live-trading gates are fully tested.

