import test from "node:test";
import assert from "node:assert/strict";
import { CandleStore } from "../src/market/candleStore.js";

test("upserts duplicate candle timestamps", () => {
  const store = new CandleStore();
  store.ingest({ symbol: "MNQ", timeframe: "1m", time: 1, timestamp: "one", close: 10 });
  store.ingest({ symbol: "MNQ", timeframe: "1m", time: 1, timestamp: "one", close: 11 });

  assert.equal(store.getCandles("MNQ", "1m").length, 1);
  assert.equal(store.latestCandle("MNQ", "1m").close, 11);
});

