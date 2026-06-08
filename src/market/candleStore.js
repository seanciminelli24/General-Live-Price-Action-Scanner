export class CandleStore {
  constructor({ maxBarsPerSymbolTimeframe = 5000 } = {}) {
    this.maxBarsPerSymbolTimeframe = maxBarsPerSymbolTimeframe;
    this.bySymbol = new Map();
  }

  ingest(candle) {
    const symbol = candle.symbol;
    const timeframe = candle.timeframe || "1m";
    if (!this.bySymbol.has(symbol)) this.bySymbol.set(symbol, new Map());
    const byTimeframe = this.bySymbol.get(symbol);
    const candles = byTimeframe.get(timeframe) || [];
    const existingIndex = candles.findIndex((item) => item.time === candle.time);

    if (existingIndex >= 0) {
      candles[existingIndex] = candle;
    } else {
      candles.push(candle);
      candles.sort((left, right) => left.time - right.time);
    }

    if (candles.length > this.maxBarsPerSymbolTimeframe) {
      candles.splice(0, candles.length - this.maxBarsPerSymbolTimeframe);
    }

    byTimeframe.set(timeframe, candles);
    return candle;
  }

  getCandles(symbol, timeframe = "1m") {
    return [...(this.bySymbol.get(symbol)?.get(timeframe) || [])];
  }

  latestCandle(symbol, timeframe = "1m") {
    return this.bySymbol.get(symbol)?.get(timeframe)?.at(-1) || null;
  }

  snapshot() {
    return Object.fromEntries([...this.bySymbol.entries()].map(([symbol, byTimeframe]) => [
      symbol,
      Object.fromEntries([...byTimeframe.entries()].map(([timeframe, candles]) => [timeframe, [...candles]]))
    ]));
  }

  summary() {
    return Object.fromEntries([...this.bySymbol.entries()].map(([symbol, byTimeframe]) => [
      symbol,
      {
        timeframes: Object.fromEntries([...byTimeframe.entries()].map(([timeframe, candles]) => [
          timeframe,
          candles.length
        ])),
        lastTimestamp: [...byTimeframe.values()].flat().sort((left, right) => left.time - right.time).at(-1)?.timestamp || null
      }
    ]));
  }
}

