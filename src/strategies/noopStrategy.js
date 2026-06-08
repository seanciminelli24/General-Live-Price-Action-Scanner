export const noopStrategy = {
  name: "noop",
  async onCandleClose(context) {
    return {
      action: "none",
      strategy: "noop",
      trigger: context.trigger,
      signal: null,
      notes: ["Noop strategy received candle close."]
    };
  }
};

