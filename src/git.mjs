/**********************************
// scripts for doing git operations
***********************************/

import { execFileSync } from 'node:child_process';

/** Return the origin URL in git+https form when the remote uses SSH syntax. */
function originUrl() {
    return execFileSync('git', ['remote', 'get-url', 'origin'], {
        encoding: 'utf8',
    }).trim();
}

const origin = originUrl();                                     // git@github.com:statens-pensjonskasse/openapi-artifact-wrapper.git
const https = origin.replace(/^git@([^:]+):/, 'https://$1/');   // https://github.com/statens-pensjonskasse/openapi-artifact-wrapper.git
const organization = https.split('/').slice(-2, -1)[0];
const repoName = https.split('/').pop().replace(/\.git$/, '');
const repoPath = https.split('/').slice(-2).join('/').replace(/\.git$/, '');

export const github = {
    origin,
    organization,
    repo: {
        name: repoName,
        path: repoPath,
    },
};
