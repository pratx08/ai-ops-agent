const axios = require('axios');
const agentState = require('../state/agentState');
const { getAIDecision } = require('./aiService');
const { log } = require('../utils/logger');

const SERVER_A = process.env.SERVER_A_BASE_URL;
const SERVER_B = process.env.SERVER_B_BASE_URL;
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || 5000);

async function fetchHealth(baseUrl) {
  try {
    const res = await axios.get(`${baseUrl}/health`, { 
      timeout: 3000,
      // CRITICAL FIX: Bypass Ngrok warning page
      headers: { "ngrok-skip-browser-warning": "true" }
    });
    return { reachable: true, health: res.data, error: null };
  } catch (err) {
    return { reachable: false, health: null, error: err.message };
  }
}

async function pollOnce() {
  log('--- Starting Poll Cycle ---');

  // 1. Fetch metrics in parallel
  const [aResult, bResult] = await Promise.all([
    fetchHealth(SERVER_A),
    fetchHealth(SERVER_B),
  ]);

  const now = new Date().toISOString();
  agentState.lastPollAt = now;

  // 2. Update In-Memory State
  agentState.serverA = {
    reachable: aResult.reachable,
    health: aResult.health,
    lastError: aResult.error
  };

  agentState.serverB = {
    reachable: bResult.reachable,
    health: bResult.health,
    lastError: bResult.error
  };

  // 3. Prepare data for AI
  const healthA = {
    reachable: aResult.reachable,
    metrics: aResult.health?.metrics || {},
    error: aResult.error
  };

  const healthB = {
    reachable: bResult.reachable,
    metrics: bResult.health?.metrics || {},
    error: bResult.error
  };

  // 4. Get AI Decision
  const decision = await getAIDecision(healthA, healthB);

  // 5. Update History
  agentState.lastDecision = {
    timestamp: now,
    ...decision,
  };

  agentState.history.push({
    timestamp: now,
    chosenServer: decision.chosenServer,
    summary: decision.summary,
    severity: decision.severity,
  });

  if (agentState.history.length > 50) {
    agentState.history.shift();
  }

  log(`Cycle Complete. Chosen: ${decision.chosenServer}. Next poll in ${POLL_INTERVAL_MS}ms.`);

  // 6. Schedule NEXT poll only after this one finishes
  setTimeout(pollOnce, POLL_INTERVAL_MS);
}

function startMonitoring() {
  if (!SERVER_A || !SERVER_B) {
    log('ERROR: SERVER_A_BASE_URL or SERVER_B_BASE_URL missing in .env');
    return;
  }
  log(`Starting monitoring... Interval: ${POLL_INTERVAL_MS}ms`);
  pollOnce();
}

module.exports = { startMonitoring };