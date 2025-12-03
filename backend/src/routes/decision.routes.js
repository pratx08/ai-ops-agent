const express = require('express');
const agentState = require('../state/agentState');

const router = express.Router();

/**
 * Returns only the AI decision (lighter payload).
 */
router.get('/', (req, res) => {
  res.json(agentState.lastDecision || { message: 'No decision yet' });
});

module.exports = router;
