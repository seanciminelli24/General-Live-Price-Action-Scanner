# General Live Price Action Scanner Project Brief

## Purpose

Build a reusable live price-action scanner that can feed real-time, candle-close market data into any trading application, strategy engine, dashboard, alerting system, automation workflow, or research tool.

This project should be independent from the AI SMC Trading Bot. The SMC bot can be one consumer of the scanner, but the scanner itself should be generic, public-ready, and adaptable to many symbols, markets, data sources, and strategy styles.

The scanner should answer one public-user problem clearly:

> "I want a simple local service that watches live market candles, keeps clean multi-timeframe context, and lets my strategy react safely when price action changes."

## Core Idea

Most trading applications need the same foundation:

1. Receive live confirmed candle data from a charting/data source.
2. Normalize that data into a consistent internal candle format.
3. Store recent candles by symbol and timeframe.
4. Maintain higher-timeframe context without keeping unlimited old low-timeframe data.
5. Watch multiple symbols at the same time.
6. Trigger strategy/application callbacks when fresh candles close.
7. Expose status, health, logs, and configuration through an easy interface.
8. Optionally send alerts or execution requests through gated output adapters.

The scanner should not be tied to SMC, Tradovate, MNQ, MES, futures, or any one broker.

## Design Goal

Create a general-purpose service:

```text
TradingView / data provider / CSV replay / broker feed
        -> webhook or stream adapter
Live Scanner
        -> normalized candles + multi-timeframe context
Strategy plugins / apps / dashboards
        -> optional output adapters
Alerts, webhook out, database, Discord, broker demo, broker live, backtester
```

The scanner should feel like a small product, not just a script. A public user should be able to:

- Install it.
- Add symbols to a watchlist.
- Choose timeframes and history retention.
- Connect TradingView alerts.
- See whether data is flowing.
- Run a sample strategy.
- Export or replay data.
- Extend it without editing core scanner code.

## Public Product Principles

- Generic first: no hard-coded MNQ/MES/SMC assumptions in the scanner core.
- Multi-symbol by default: every module should expect one or many symbols.
- Configurable data footprint: users decide what timeframes, how much history, and whether to preload/download historical data.
- Local-first MVP: easy to run on a laptop with Node.js and TradingView webhooks.
- Adapter-based growth: data sources, strategies, outputs, and brokers plug into stable interfaces.
- Safe by default: scan-only unless the user explicitly enables alerts or execution.
- Observable: status pages, logs, event history, and clear error messages are part of the product.
- Beginner-friendly setup: guided UI and `.env.example` should explain what to configure.

## Initial Data Source

Start with TradingView webhooks because they are easy for retail users to configure.

TradingView Pine script should emit confirmed candle-close OHLCV JSON:

```json
{
  "secret": "user-webhook-secret",
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

Later data sources can include:

- CSV import and replay.
- Broker APIs.
- Polygon.
- Tradovate market data.
- Binance.
- Alpaca.
- Interactive Brokers.
- Other WebSocket feeds.

## Generic Candle Format

Internally, every candle should normalize to:

```js
{
  symbol: "MNQ",
  rawSymbol: "MNQ1!",
  timeframe: "1m",
  timestamp: "2026-06-08T09:31:00.000Z",
  time: 1780925460000,
  open: 29100.25,
  high: 29120.5,
  low: 29095,
  close: 29110.75,
  volume: 1250,
  source: "tradingview",
  confirmed: true,
  receivedAt: "2026-06-08T09:31:01.100Z"
}
```

Symbols should be normalized but preserve the original source symbol.

Examples:

```text
MNQ1! -> MNQ
MES1! -> MES
ES1!  -> ES
NQ1!  -> NQ
BTCUSD -> BTCUSD
AAPL -> AAPL
EURUSD -> EURUSD
```

## Watchlists And Multi-Symbol Scanning

The public scanner should support one or more watchlists. A watchlist is a named set of symbols, timeframes, sync rules, sessions, and enabled strategies.

Example watchlist config:

```json
{
  "watchlists": [
    {
      "name": "Index Futures",
      "enabled": true,
      "symbols": ["MNQ", "MES", "MGC"],
      "primarySymbols": ["MNQ", "MES"],
      "contextSymbols": ["ES", "NQ"],
      "timeframes": ["1m", "5m", "15m", "1h", "4h", "1d"],
      "requireSymbolSync": false,
      "sessions": ["09:30-16:00 America/New_York"],
      "strategies": ["noop", "movingAverageExample"]
    },
    {
      "name": "Crypto Majors",
      "enabled": false,
      "symbols": ["BTCUSD", "ETHUSD"],
      "timeframes": ["1m", "5m", "1h", "1d"],
      "sessions": ["24x7"],
      "strategies": ["noop"]
    }
  ]
}
```

Important multi-symbol behavior:

- Every symbol gets an independent candle store.
- Strategies can subscribe to one symbol, a watchlist, or a symbol group.
- Symbol groups may require synchronized candle closes when the strategy needs relative comparison.
- The scanner should not assume every market closes candles at the exact same second.
- Status should show stale, delayed, missing, and healthy symbols separately.
- Users should be able to pause individual symbols without stopping the whole scanner.

## Adjustable Data Download And Retention

Users need control over what data is downloaded, imported, retained, and compacted.

The scanner should separate these concepts:

- Live retention: how many recent low-timeframe bars to keep in memory.
- Historical preload: how much context to load at startup.
- Historical download: optional provider-specific data fetch before scanning.
- Storage persistence: whether candles are kept only in memory or written to disk/database.
- Compaction: how old low-timeframe bars roll into higher-timeframe bars.

Example data config:

```json
{
  "data": {
    "mode": "live_with_preload",
    "storage": "local-jsonl",
    "baseTimeframe": "1m",
    "downloadOnStartup": false,
    "download": {
      "provider": "csv",
      "symbols": ["MNQ", "MES"],
      "startDate": "2026-01-01",
      "endDate": "2026-06-08",
      "timeframes": ["1m"]
    },
    "retention": {
      "1m": "60 minutes",
      "5m": "2 days",
      "15m": "7 days",
      "1h": "30 days",
      "4h": "180 days",
      "1d": "730 days",
      "1w": "unlimited"
    }
  }
}
```

Recommended default retention:

```text
1m:  last 60 minutes
5m:  today and previous day
15m: last 7 days
1h:  last 30 days
4h:  last 180 days
1d:  last 730 days
1w:  older history
```

This mirrors how many traders think:

- 1m for precise live entries.
- 5m and 15m for intraday structure.
- 1h and 4h for swing/higher-timeframe structure.
- Daily and weekly for long-term liquidity and major levels.

These values must be configurable globally and overrideable per watchlist or symbol.

## Core Modules

### 1. Webhook Server

Responsibilities:

- Receive provider webhooks.
- Validate secret.
- Reject unconfirmed bars if configured.
- Parse JSON safely.
- Normalize symbol, timeframe, time, and OHLCV.
- Pass candles to the candle store.
- Trigger registered scanner callbacks.
- Respond quickly so providers do not time out.
- Track rejected payloads with useful reasons.

Suggested endpoints:

```text
GET  /health
GET  /api/scanner/status
GET  /api/scanner/events
GET  /api/scanner/config
PUT  /api/scanner/config
POST /webhook/tradingview/bar
POST /api/scanner/reset
POST /api/scanner/symbols/:symbol/pause
POST /api/scanner/symbols/:symbol/resume
```

### 2. Candle Store

Responsibilities:

- Store candles by symbol and timeframe.
- Upsert duplicate candle timestamps.
- Keep latest candle per symbol/timeframe.
- Track latest common close time for symbol groups.
- Compact old candles into higher timeframes.
- Persist and reload candles if configured.
- Provide safe read-only snapshots to strategies.
- Keep memory bounded.

Important methods:

```js
ingest(payload)
getCandles(symbol, timeframe)
getContext(symbols, timeframes)
latestCandle(symbol, timeframe)
latestCommonTime(symbols, timeframe)
summary()
compact()
exportCandles(options)
reset(options)
```

### 3. Symbol Registry

Responsibilities:

- Normalize symbols.
- Map provider symbols to internal symbols.
- Know tick size, point value, market type, exchange, currency, and session when provided.
- Allow custom public-user symbols without code edits.

Example:

```js
{
  raw: "MNQ1!",
  symbol: "MNQ",
  assetClass: "futures",
  exchange: "CME",
  tickSize: 0.25,
  pointValue: 2,
  currency: "USD",
  sessionTemplate: "cme-index-futures"
}
```

### 4. Timeframe Engine

Responsibilities:

- Convert lower timeframe candles into higher timeframe candles.
- Support configurable bucket alignment.
- Handle market sessions and 24/7 markets.
- Mark synthetic candles created by aggregation.
- Avoid double-counting duplicate bars.

Initial timeframes:

```text
1m, 3m, 5m, 15m, 30m, 1h, 4h, 1d, 1w
```

### 5. Strategy Adapter Interface

The scanner should not know trading logic.

Strategies should be plugins/callbacks:

```js
export async function onCandleClose(context) {
  return {
    action: "none", // none | signal | alert | orderRequest
    signal: null,
    notes: []
  };
}
```

Context should include:

```js
{
  trigger: {
    symbol,
    timeframe,
    candle
  },
  watchlist: {
    name,
    symbols,
    timeframes
  },
  candles: {
    MNQ: {
      "1m": [],
      "5m": [],
      "15m": [],
      "1h": [],
      "4h": [],
      "1d": []
    }
  },
  latestCommonTime,
  status,
  config
}
```

### 6. Output Adapter Interface

The scanner should support multiple outputs:

- Console/log only.
- Dashboard event stream.
- Webhook out.
- Discord/Telegram alert.
- Email alert.
- Local file/database.
- Demo broker order request.
- Live broker order request, gated separately.

Execution should be optional and always behind explicit gates.

Output adapter result:

```js
{
  ok: true,
  adapter: "discord",
  deliveredAt: "2026-06-08T09:31:02.000Z",
  messageId: "optional-provider-id"
}
```

### 7. Dashboard And Easy Interface

The public version should include a simple web dashboard.

Required views:

- Overview: scanner mode, uptime, webhook URL, current health.
- Watchlists: add/remove symbols, pause/resume symbols, choose strategies.
- Data: select data source, preload mode, timeframes, retention, import/export.
- Live Candles: latest candle per symbol/timeframe and stale-data warnings.
- Events: accepted bars, rejected payloads, strategy signals, output deliveries.
- Strategy Plugins: enabled strategies, config, recent decisions.
- Safety: execution gates, alert gates, secrets status, live trading lock.

The dashboard should make setup easier, but the scanner must also work through config files for advanced users.

## Configuration Files

Suggested public project config:

```text
config/
  scanner.config.json
  symbols.json
  watchlists.json
  strategies.json
  outputs.json
```

Public `.env.example` should include:

```text
PORT=8790
WEBHOOK_SECRET=replace-me
SCANNER_MODE=SCAN_ONLY
REQUIRE_CONFIRMED_BARS=true
EXECUTION_ENABLED=false
DEMO_TRADING_ENABLED=false
LIVE_TRADING_ENABLED=false
DATA_STORAGE=local-jsonl
DATA_DIR=data
LOG_LEVEL=info
```

## Safety Gates

Any public/general scanner should have strong defaults:

```text
SCANNER_MODE=SCAN_ONLY
EXECUTION_ENABLED=false
LIVE_TRADING_ENABLED=false
DEMO_TRADING_ENABLED=false
MAX_OPEN_POSITIONS=0
MAX_SIGNAL_AGE_MINUTES=3
MAX_CHASE_POINTS configurable per market
REQUIRE_CONFIRMED_BARS=true
REQUIRE_SYMBOL_SYNC=false
ALLOW_ORDER_REQUEST_OUTPUT=false
```

Live trading must require a separate explicit setting, not just a broker connection.

The scanner should also display a clear disclaimer that it is a software tool, not financial advice.

## Public Project Shape

Possible repo structure:

```text
general-live-scanner/
  src/
    server.js
    app.js
    config/
      defaults.js
      env.js
      loadConfig.js
    providers/
      tradingviewWebhook.js
      csvReplayProvider.js
    market/
      candleStore.js
      timeframes.js
      symbols.js
      sessions.js
    strategies/
      noopStrategy.js
      exampleMovingAverageStrategy.js
    outputs/
      consoleOutput.js
      webhookOutput.js
      discordOutput.js
    routes/
      healthRoutes.js
      scannerRoutes.js
      configRoutes.js
    events/
      eventBus.js
      eventLog.js
  public/
    index.html
    app.js
    styles.css
  config/
    scanner.config.example.json
    symbols.example.json
    watchlists.example.json
    outputs.example.json
  tradingview/
    generic-live-bar-feed.pine
    alert-message-template.json
  test/
    candleStore.test.js
    tradingviewWebhook.test.js
    tieredMemory.test.js
    multiSymbolScanner.test.js
    config.test.js
  README.md
  QUICKSTART.md
  .env.example
  package.json
```

## TradingView Pine Script

Generic script:

```pine
//@version=6
indicator("Generic Live Bar Feed", overlay=false)

enabled = input.bool(true, "Enable live bar feed")
secret = input.string("replace-with-your-webhook-secret", "Webhook Secret")
timeframeLabel = input.string("1m", "Timeframe Label")

canAlert = enabled and barstate.isconfirmed

string message = "{"
message := message + "\"secret\":\"" + secret + "\","
message := message + "\"confirmed\":true,"
message := message + "\"source\":\"tradingview\","
message := message + "\"instrument\":\"" + syminfo.ticker + "\","
message := message + "\"timeframe\":\"" + timeframeLabel + "\","
message := message + "\"timestamp\":\"" + str.format_time(time, "yyyy-MM-dd HH:mm:ss") + "\","
message := message + "\"open\":" + str.tostring(open) + ","
message := message + "\"high\":" + str.tostring(high) + ","
message := message + "\"low\":" + str.tostring(low) + ","
message := message + "\"close\":" + str.tostring(close) + ","
message := message + "\"volume\":" + str.tostring(volume)
message := message + "}"

plot(canAlert ? close : na, title="Confirmed bar close")

if canAlert
    alert(message, alert.freq_once_per_bar_close)
```

## MVP Requirements

The first version should prove:

1. TradingView can send live confirmed bars.
2. Server can receive and normalize bars for any symbol.
3. Users can configure a watchlist with multiple symbols.
4. Candle store can maintain tiered multi-timeframe history.
5. Status endpoint shows symbol health and last timestamps.
6. Dashboard shows live scanner state without reading logs.
7. Strategy adapter receives candle-close context.
8. Example strategy can print/log a signal.
9. Data retention and preload settings are adjustable.
10. No execution happens unless an output adapter is explicitly enabled.

## Example Status Output

```json
{
  "ok": true,
  "enabled": true,
  "mode": "SCAN_ONLY",
  "uptimeSeconds": 812,
  "watchlists": {
    "Index Futures": {
      "enabled": true,
      "symbols": ["MNQ", "MES"],
      "healthySymbols": 2,
      "staleSymbols": 0
    }
  },
  "symbols": {
    "MNQ": {
      "lastTimestamp": "2026-06-08T09:31:00.000Z",
      "status": "healthy",
      "source": "tradingview",
      "timeframes": {
        "1m": 60,
        "5m": 480,
        "15m": 672,
        "1h": 720,
        "4h": 1080,
        "1d": 730,
        "1w": 80
      }
    },
    "MES": {
      "lastTimestamp": "2026-06-08T09:31:00.000Z",
      "status": "healthy",
      "source": "tradingview",
      "timeframes": {
        "1m": 60,
        "5m": 480,
        "15m": 672
      }
    }
  }
}
```

## Suggested Build Phases

### Phase 1: Standalone Scanner MVP

- Create independent Node.js project.
- Add TradingView webhook ingestion.
- Add normalized candle format.
- Add multi-symbol candle store.
- Add configurable tiered retention.
- Add `/health` and `/api/scanner/status`.
- Add noop and moving-average example strategies.
- Add console output adapter.
- Add tests for symbol normalization, ingestion, duplicate bars, and retention.

### Phase 2: Dashboard And Configuration

- Add local web dashboard.
- Add watchlist editor.
- Add symbol registry editor.
- Add data retention/preload controls.
- Add event log view.
- Add import/export tools.
- Add config file validation.

### Phase 3: Data Providers And Replay

- Add CSV import/replay provider.
- Add historical preload from local files.
- Add optional provider download abstraction.
- Add backtest/replay mode using the same strategy interface as live mode.

### Phase 4: Output Adapters

- Add webhook out.
- Add Discord/Telegram alerts.
- Add local database/event queue.
- Add demo broker request adapter.
- Keep live broker output locked behind separate explicit gates.

### Phase 5: Public Polish

- Add README and QUICKSTART.
- Add screenshots.
- Add example TradingView setup.
- Add sample config presets for futures, crypto, stocks, and forex.
- Add troubleshooting guide.
- Add Docker option.
- Add versioned plugin API docs.

## Notes From Current SMC Bot Prototype

The AI SMC Trading Bot already proved:

- TradingView alerts can feed live candle-close OHLCV to a local bot through Cloudflare.
- MNQ/MES synchronized 1-minute bars can be detected.
- A scanner can run automatically on candle close.
- Tiered candle memory is better than keeping many days of 1-minute bars.
- Execution should be separated from scanning and gated carefully.

The general scanner should keep those lessons but remove SMC-specific assumptions.

## Suggested Next Chat Prompt

Use this prompt in a new chat:

```text
I want to build a standalone general live price-action scanner. Use the attached GENERAL_LIVE_SCANNER_PROJECT_BRIEF.md as the project context. Build it as a generic Node.js app, independent from my SMC trading bot. Start with TradingView webhook ingestion, normalized multi-symbol candle storage, configurable data retention/preload settings, status endpoints, a simple local dashboard, and a plugin-style strategy adapter. Do not add real broker execution yet.
```
