/** Numeric major.minor.patch ordering. A prerelease suffix does not count as ahead. */
export function compareSemver(left: string, right: string): number {
  const parse = (value: string): number[] => {
    const core = value.split(/[-+]/u)[0] ?? "";
    const parts = core.split(".").map((piece) => Number(piece));
    return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
  };
  const a = parse(left);
  const b = parse(right);
  for (let index = 0; index < 3; index += 1) {
    const diff = (a[index] ?? 0) - (b[index] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }
  return 0;
}

/**
 * Patch + 1 on the current line.
 *
 * A commit-count version would leave 0.221.x or hide an offset that still has to be stored.
 * Readers already compare this line with semver. Each stamp reads the checked-in version and
 * adds one patch, so the number only increases along first-parent main. `--version` may set
 * a higher number. A number that is not greater is refused.
 */
export function bumpPatch(version: string): string {
  const match = /^(\d+)\.(\d+)\.(\d+)$/u.exec(version);
  if (!match) throw new Error(`Cannot bump ${version}. Expected major.minor.patch.`);
  return `${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
}

export function isSemver(version: string): boolean {
  return /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/u.test(version);
}
