const express = require('express');
const agentState = require('../state/agentState');

const router = express.Router();

/**
 * Returns latest health and AI decision – used by frontend to visualize.
 */
router.get('/', (req, res) => {
  res.json({
    lastPollAt: agentState.lastPollAt,
    serverA: agentState.serverA,
    serverB: agentState.serverB,
    lastDecision: agentState.lastDecision,
    history: agentState.history,
  });
});

module.exports = router;
