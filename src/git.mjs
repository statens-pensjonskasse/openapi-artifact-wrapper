/**********************************
// scripts for doing git operations
***********************************/

import { execFileSync } from 'node:child_process';
import { GitTag } from './GitTag.mjs';
import {Version} from "./Version.mjs";

/** Return the origin URL in git+https form when the remote uses SSH syntax. */
function originUrl() {
    return execFileSync('git', ['remote', 'get-url', 'origin'], {
        encoding: 'utf8',
    }).trim();
}

/** fetch a tag */
function fetch(gitRef) {
    execFileSync('git', [
        'fetch', '--no-tags', '--no-write-fetch-head', 'origin', gitRef,
    ], { stdio: ['ignore', 'inherit', 'inherit'] });

    return gitRef;
}

/** diff a file */
function diffFromTag(file, gitTag) {
    const release = fetch(gitTag.ref);
    console.log(release);
    execFileSync('git', [
        '--no-pager', 'diff', '--no-ext-diff', '--no-textconv', gitTag.ref,
        '--', `:(top)${file}`,
    ], { stdio: ['ignore', 'inherit', 'inherit'] });
}

/** release tags on origin */
function githubReleaseTags() {
    const refs = execFileSync('git', ['ls-remote', '--tags', '--refs', 'origin'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'inherit'],
    });
    const releases = [];

    for (const ref of refs.split('\n')) {
        const [objectId, tag] = ref.split('\t');
        if (!tag) continue;  // trailing empty line
        const gitTag = new GitTag(tag, objectId)
        if (gitTag.isRelease()) {
            releases.push(gitTag);
        }
    }

    return releases;
}

/** release tag on origin with the highest version, null if none. Ties ("1.0.0" vs "v1.0.0") go to the first ref alphabetically. */
function greatestReleaseTag() {
    let greatest = null;
    let greatestVersion = null;

    for (const release of githubReleaseTags()) {
        const version = release.toVersion();
        const order = greatest === null ? 1 : version.compare(greatestVersion);
        if (order > 0 || (order === 0 && release.ref.localeCompare(greatest.ref) < 0)) {
            greatest = release;
            greatestVersion = version;
        }
    }
    return greatest;
}

const origin = originUrl();                                     // git@github.com:statens-pensjonskasse/openapi-artifact-wrapper.git
const https = origin.replace(/^git@([^:]+):/, 'https://$1/');   // https://github.com/statens-pensjonskasse/openapi-artifact-wrapper.git

export const github = {
    origin,
    organization: https.split('/').slice(-2, -1)[0],
    repo: {
        name: https.split('/').pop().replace(/\.git$/, ''),
        path: https.split('/').slice(-2).join('/').replace(/\.git$/, '')
    },
    releases: {
        all: function() { return githubReleaseTags() },
        greatest: function() { return greatestReleaseTag() },
    },
    diffSinceRelease: function(file) { return diffFromTag(file, greatestReleaseTag()) }
};
