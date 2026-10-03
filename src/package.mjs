/***********************************************************************
 // common functions to process package.json (the published package in repository root)
 ***********************************************************************/

import {readJsonFile, writeJsonFile} from "./workdir.mjs";

export const packageJson = readJsonFile('package.json');

/** Updates package.json version */
export function updatePackageVersion(desiredVersion) {
    if (desiredVersion === packageJson.version) {
        console.log(`No update to package.json`);
    } else {
        const nextPackageJson = {
            ...packageJson,
            version: desiredVersion
        };
        writeJsonFile('package.json', nextPackageJson);
    }
}
