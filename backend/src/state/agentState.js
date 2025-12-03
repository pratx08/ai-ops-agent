module.exports = {
  lastPollAt: null,

  serverA: {
    health: null,       // data from /health
    reachable: false,
    lastError: null,
  },

  serverB: {
    health: null,
    reachable: false,
    lastError: null,
  },

  lastDecision: null,   // { chosenServer, summary, severity, recommendedFix, rawAi }
  history: [],          // array of { timestamp, chosenServer, summary, severity }
};
