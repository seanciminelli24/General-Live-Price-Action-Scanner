# General Live Scanner

A local-first, open-source live price-action scanner for confirmed candle data.

General Live Scanner receives live OHLCV candles, normalizes them, stores configurable multi-timeframe context, and lets user-defined strategy plugins react to candle closes. It is designed to be generic: any symbol, multiple symbols at once, multiple timeframes, and multiple output adapters.

This project starts with TradingView webhook ingestion and scan-only behavior. It does not place trades by default.

## What It Does

- Receives confirmed candle-close webhooks from TradingView.
- Normalizes candles into one consistent format.
- Watches multiple symbols through configurable watchlists.
- Maintains tiered multi-timeframe candle memory.
- Exposes scanner status and health endpoints.
- Provides a plugin-style strategy interface.
- Supports output adapters such as console logs, webhooks, and alerts.

## What It Does Not Do By Default

- It does not provide financial advice.
- It does not guarantee profitable trading signals.
- It does not place live broker orders.
- It does not upload secrets or broker credentials.

## Project Status

Early planning and MVP scaffold.

The first implementation target is:

1. TradingView webhook ingestion.
2. Normalized multi-symbol candle storage.
3. Configurable data retention and preload settings.
4. Status endpoints.
5. Simple local dashboard.
6. Plugin-style strategy adapter.

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

Then configure a TradingView alert to send confirmed bar JSON to:

```text
http://localhost:8790/webhook/tradingview/bar
```

For remote TradingView webhooks, expose your local server through a secure tunnel such as Cloudflare Tunnel or another HTTPS tunnel.

## Example Candle Payload

```json
{
  "secret": "replace-me",
  "confirmed": true,
  "source": "tradingview",
  "instrument": "MNQ1!",
  "timeframe": "1m",
  "timestamp": "2026-06-08 09:31:00",
  "open": 29100.25,
  "high": 29120.5,
  "low": 29095,
  "close": 29110.75,
  "volume": 1250
}
```

## Public Safety Defaults

```text
SCANNER_MODE=SCAN_ONLY
EXECUTION_ENABLED=false
DEMO_TRADING_ENABLED=false
LIVE_TRADING_ENABLED=false
REQUIRE_CONFIRMED_BARS=true
```

Live trading adapters, if added later, should remain disabled unless explicitly enabled by the user.

## Documentation

- [Project Brief](./GENERAL_LIVE_SCANNER_PROJECT_BRIEF.md)
- [Quickstart](./QUICKSTART.md)
- [TradingView Pine Script](./tradingview/generic-live-bar-feed.pine)

## Disclaimer

This software is for educational, research, and development purposes only. It is not financial advice, investment advice, or a recommendation to buy or sell any asset. Trading involves risk. Use at your own discretion.

