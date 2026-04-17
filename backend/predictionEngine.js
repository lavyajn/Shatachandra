// predictionEngine.js — Load Forecasting & Risk Scoring
const { clamp } = require('./utils');

/**
 * Run prediction for a single node based on its load history.
 * Uses linear extrapolation over the last 10 data points.
 *
 * Updates node fields: predictedLoad, predictedRisk, timeToFailure
 */
function runPrediction(node) {
  const history = node.history.load;

  // Need at least 3 history points to predict
  if (history.length < 3) {
    node.predictedLoad = null;
    node.predictedRisk = "low";
    node.timeToFailure = null;
    return;
  }

  // Use last 10 points (or fewer if not available)
  const windowSize = Math.min(10, history.length);
  const recent = history.slice(-windowSize);

  // Compute slope: (last - first) / (windowSize - 1)
  const slope = (recent[recent.length - 1] - recent[0]) / (recent.length - 1);

  // Predicted load at t+5 ticks (2.5 seconds ahead)
  const predicted = node.currentLoad + slope * 5;
  node.predictedLoad = clamp(predicted, 0, 150);

  // Risk scoring based on predicted load vs capacity
  if (node.predictedLoad < node.capacity * 0.7) {
    node.predictedRisk = "low";
  } else if (node.predictedLoad < node.capacity * 0.85) {
    node.predictedRisk = "medium";
  } else if (node.predictedLoad < node.capacity * 0.95) {
    node.predictedRisk = "high";
  } else {
    node.predictedRisk = "critical";
  }

  // Time to failure calculation
  if (slope > 0 && node.currentLoad < node.capacity) {
    // Each tick is 0.5 seconds, so slope is in MW/tick
    // Time to failure in seconds = (remaining capacity) / (slope * ticks per second)
    const ticksPerSecond = 2;
    const ttf = (node.capacity - node.currentLoad) / (slope * ticksPerSecond);
    node.timeToFailure = ttf > 0 && ttf <= 60 ? Math.round(ttf * 10) / 10 : null;
  } else {
    node.timeToFailure = null;
  }
}

/**
 * Run predictions for all nodes
 */
function runAllPredictions(nodes) {
  for (const node of nodes) {
    runPrediction(node);
  }
}

module.exports = { runPrediction, runAllPredictions };
