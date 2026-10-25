// This checker lives outside the worker workspace. Each review executes current source
// in a separate process; producer prose and an unchanged output cannot satisfy it.
const completionPercent = require(process.argv[2]);
const cases = [
  ["empty plan progress", 0, 4, 0],
  ["half complete", 2, 4, 50],
  ["fully complete", 4, 4, 100],
  ["nearest integer", 2, 3, 67],
  ["no planned items", 0, 0, 0],
  ["negative plan count", 1, -1, 0],
  ["extra completed items", 7, 4, 100],
  ["negative completion count", -1, 4, 0],
  ["non-finite plan count", 1, Infinity, 0],
  ["non-finite completion count", NaN, 4, 0],
];
const rows = cases.map(([label, done, total, expected]) => {
  const actual = completionPercent(done, total);
  return { label, expected, actual, passed: actual === expected };
});
const passed = rows.every((row) => row.passed);
console.log(JSON.stringify({ passed, rows }));
process.exit(passed ? 0 : 1);
