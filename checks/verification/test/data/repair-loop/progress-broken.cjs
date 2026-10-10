module.exports = function completionPercent(done, total) {
  return Math.round((done / (total + 1)) * 100);
};
