module.exports = function completionPercent(done, total) {
  if (!Number.isFinite(done) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.round(Math.min(1, Math.max(0, done / total)) * 100);
};
