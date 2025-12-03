require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { startMonitoring } = require('./services/monitorService');
const { log } = require('./utils/logger');

const metricsRoutes = require('./routes/metrics.routes');
const decisionRoutes = require('./routes/decision.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Simple health
app.get('/', (req, res) => {
  res.json({ message: 'AI Agent Backend is running' });
});

// API routes
app.use('/metrics', metricsRoutes);
app.use('/decision', decisionRoutes);

// Start monitoring when app starts
startMonitoring();

module.exports = app;
