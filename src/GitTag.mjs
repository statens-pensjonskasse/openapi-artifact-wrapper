
/// "X.Y.Z" or "vX.Y.Z"
import {Version} from "./Version.mjs";

const VERSION_TAG = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export class GitTag {
    /** release tags are typically "refs/tags/0.0.36" or "refs/tags/v0.0.36"
     * @param {string} ref
     * @param {string} objectId
     */
    constructor(ref, objectId) {
        this.ref = ref;
        this.objectId = objectId;
        this.name = ref.replace(/^refs\/tags\//, '');
    }

    isRelease() {
        return  VERSION_TAG.test(this.name);
    }

    /** returns null if the tag is not a version */
    toVersion() {
        if ( ! this.isRelease()) return null;
        const [major, minor, patch] = this.name.match(VERSION_TAG).slice(1).map(Number);
        return new Version(major, minor, patch);
    }
}
