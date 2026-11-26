#!/usr/bin/env node

import { api } from './src/api.mjs';
import { packageJson, updatePackageVersion } from "./src/package.mjs";
import { pomVersion, updatePomVersion, writeBootstrapPom } from './src/pom.mjs';
import {github} from "./src/git.mjs";
import {Version} from "./src/Version.mjs";

const helpText = `

From empty project: start with "node ./apiwrap.mjs bootstrap some.group.id"
then edit pom.xml as appropriate

Usage: "node ./apiwrap.mjs <command> parameters..."
Commands:
  bootstrap <groupId>   Emits bootstrap pom.xml given groupId, other values derived from git
  update                Updates version in pom.xml and package.json to API version from local YAML
  verify                Fails if not versions are same across API, pom.xml and package.json

  diff                  Show diff of API (yaml) since last release tag
  greatest              Emits greatest release tag in git, e.g. v1.2.3
  releases              List all release tags in git
  release-ready         Emits version to release if API version is upped since last (tag), and version aligned in project files.
                        Fails otherwise
  help                  Show this help message
`;

/** api version should be same as in package.json and pom.xml */
function verifyVersions() {
    const apiVer = api.version()
    const pomVer = pomVersion()
    const pkgVer = packageJson.version
    if (apiVer === pomVer && apiVer === pkgVer) {
        return true;
    }
    console.error(`Unaligned versions! ${api.yamlSpec}: ${apiVer}, pom.xml: ${pomVer}, package.json: ${pkgVer}`);
    return false;
}

/** greatest release tag, or null with error message and failing exit code if there are none */
function greatestRelease() {
    const greatest = github.releases.greatest();
    if (!greatest) {
        console.error('No release tags found on origin.');
        process.exitCode = 1;
    }
    return greatest;
}

const [command, ...args] = process.argv.slice(2);

function groupId() {
    if (args[0])
        return args[0];
    throw new Error('Missing groupId argument, aborting');
};
// const workingDir = process.cwd();

switch (command) {
    case 'bootstrap':
        writeBootstrapPom(groupId());  // workingDir);
        break;
    case 'update':
        const apiVersion = api.version()
        updatePomVersion(apiVersion);
        updatePackageVersion(apiVersion);
        break;
    case 'verify':
        if ( ! verifyVersions()) {
            process.exit(1);
        }
        console.log(`Versions are aligned on ${api.version()}.`);
        break;
    case 'version':
        console.log(api.version());
        break;

    case 'greatest': {
        const greatest = greatestRelease();
        if (greatest) console.log(greatest.name);
        break;
    }
    case 'releases':
        for (const release of github.releases.all()) console.log(release.name);
        break;
    case 'diff':
        if (greatestRelease()) github.diffSinceRelease(api.yamlSpec);
        break;
    case 'release-ready': {
        const greatest = greatestRelease();
        if (!greatest) break;
        const version = Version.fromString(api.version());
        const upped = greatest.toVersion().compare(version) < 0;

        if (upped && verifyVersions()) {
            console.log(api.version());
        } else {
            console.error('Release is not ready.');
            process.exitCode = 1;
        }
        break;
    }

    case 'help':
        console.log(helpText);
        break;

    default:
        console.error(`Unknown command: ${command}.`);
        process.exit(1);
}
