export const consoleOutput = {
  name: "console",
  async deliver(result) {
    if (result.action !== "none") {
      console.log(JSON.stringify(result, null, 2));
    }
    return {
      ok: true,
      adapter: "console",
      deliveredAt: new Date().toISOString()
    };
  }
};

