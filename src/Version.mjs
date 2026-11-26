
/** Semantic version */
export class Version {
  /**
   * @param {number} major
   * @param {number} minor
   * @param {number} patch
   */
  constructor(major, minor, patch) {
    if (![major, minor, patch].every(value => Number.isSafeInteger(value) && value >= 0)) {
      throw new Error(`Invalid version components: ${major}.${minor}.${patch}. Expected non-negative safe integers.`);
    }

    this.major = major;
    this.minor = minor;
    this.patch = patch;
  }

  toString() {
    return `${this.major}.${this.minor}.${this.patch}`;
  }

  static fromString(version) {
    const regex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
    const match = typeof version === 'string' && version.match(regex);
    if (!match) {
      throw new Error(`Invalid version: ${version}. Expected X.Y.Z.`);
    }
    const [major, minor, patch] = match.slice(1).map(Number);
    return new Version(major, minor, patch);
  }

  /** 1 if this is higher, -1 if other is higher, 0 if equal */
  compare(other) {
    if (!(other instanceof Version)) {
      throw new TypeError(`Expected Version, got ${typeof other}: ${other}`);
    }
    for (const part of ['major', 'minor', 'patch']) {
      if (this[part] !== other[part]) return this[part] > other[part] ? 1 : -1;
    }
    return 0;
  }

}
