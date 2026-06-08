import { createServer } from "node:http";
import { normalizeTradingViewBar } from "./providers/tradingviewWebhook.js";
import { CandleStore } from "./market/candleStore.js";
import { noopStrategy } from "./strategies/noopStrategy.js";
import { consoleOutput } from "./outputs/consoleOutput.js";

const port = Number(process.env.PORT || 8790);
const webhookSecret = process.env.WEBHOOK_SECRET || "";
const requireConfirmedBars = process.env.REQUIRE_CONFIRMED_BARS !== "false";
const store = new CandleStore();
const events = [];

function remember(event) {
  events.push({ ...event, at: new Date().toISOString() });
  if (events.length > 200) events.shift();
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, { "content-type": "application/json" });
  response.end(JSON.stringify(body, null, 2));
}

function validSecret(request, body) {
  if (!webhookSecret) return true;
  return request.headers["x-webhook-secret"] === webhookSecret || body.secret === webhookSecret;
}

async function handleBar(request, response) {
  const payload = await readJsonBody(request);
  if (!validSecret(request, payload)) {
    remember({ type: "rejected", reason: "invalid-secret" });
    sendJson(response, 401, { accepted: false, reason: "Invalid webhook secret." });
    return;
  }

  if (requireConfirmedBars && payload.confirmed === false) {
    remember({ type: "ignored", reason: "unconfirmed-bar" });
    sendJson(response, 202, { accepted: false, reason: "Ignoring unconfirmed bar." });
    return;
  }

  const candle = store.ingest(normalizeTradingViewBar(payload));
  remember({ type: "bar", symbol: candle.symbol, timeframe: candle.timeframe, timestamp: candle.timestamp });

  const strategyResult = await noopStrategy.onCandleClose({
    trigger: { symbol: candle.symbol, timeframe: candle.timeframe, candle },
    candles: store.snapshot(),
    status: store.summary()
  });
  await consoleOutput.deliver(strategyResult);

  sendJson(response, 202, { accepted: true, candle, strategy: strategyResult });
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === "GET" && request.url === "/health") {
      sendJson(response, 200, { ok: true, mode: process.env.SCANNER_MODE || "SCAN_ONLY" });
      return;
    }

    if (request.method === "GET" && request.url === "/api/scanner/status") {
      sendJson(response, 200, { ok: true, symbols: store.summary(), events: events.slice(-25).reverse() });
      return;
    }

    if (request.method === "POST" && request.url === "/webhook/tradingview/bar") {
      await handleBar(request, response);
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  } catch (error) {
    remember({ type: "error", message: error.message });
    sendJson(response, error.statusCode || 500, { error: "Request failed.", message: error.message });
  }
});

server.listen(port, () => {
  console.log(`General Live Scanner listening on http://localhost:${port}`);
});

