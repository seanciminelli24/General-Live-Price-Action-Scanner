import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSymbol, normalizeTradingViewBar } from "../src/providers/tradingviewWebhook.js";

test("normalizes common TradingView futures root symbols", () => {
  assert.equal(normalizeSymbol("MNQ1!"), "MNQ");
  assert.equal(normalizeSymbol("@MES=F"), "MES");
});

test("normalizes a TradingView OHLCV payload", () => {
  const candle = normalizeTradingViewBar({
    instrument: "MNQ1!",
    timeframe: "1m",
    timestamp: "2026-06-08 09:31:00",
    open: 1,
    high: 2,
    low: 0.5,
    close: 1.5,
    volume: 10
  });

  assert.equal(candle.symbol, "MNQ");
  assert.equal(candle.rawSymbol, "MNQ1!");
  assert.equal(candle.timeframe, "1m");
  assert.equal(candle.confirmed, true);
});

