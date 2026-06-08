function parseTime(value) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) {
    const error = new Error(`Invalid candle timestamp: ${value}`);
    error.statusCode = 422;
    throw error;
  }
  return time;
}

function asNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    const error = new Error(`Invalid candle ${field}: ${value}`);
    error.statusCode = 422;
    throw error;
  }
  return number;
}

export function normalizeSymbol(value) {
  const raw = String(value || "").trim().toUpperCase();
  const withoutPrefix = raw.replace(/^@/, "").replace(/=F$/, "");
  return withoutPrefix.replace(/1!$/, "") || raw;
}

export function normalizeTradingViewBar(payload = {}) {
  const rawSymbol = payload.instrument || payload.symbol || payload.ticker;
  const symbol = normalizeSymbol(rawSymbol);
  if (!symbol) {
    const error = new Error("TradingView payload is missing instrument/symbol.");
    error.statusCode = 422;
    throw error;
  }

  const time = parseTime(payload.timestamp || payload.time || payload.datetime);

  return {
    symbol,
    rawSymbol,
    timeframe: payload.timeframe || "1m",
    timestamp: new Date(time).toISOString(),
    time,
    open: asNumber(payload.open ?? payload.o, "open"),
    high: asNumber(payload.high ?? payload.h, "high"),
    low: asNumber(payload.low ?? payload.l, "low"),
    close: asNumber(payload.close ?? payload.c, "close"),
    volume: Number(payload.volume ?? payload.v ?? 0) || 0,
    source: payload.source || "tradingview",
    confirmed: payload.confirmed !== false,
    receivedAt: new Date().toISOString()
  };
}

