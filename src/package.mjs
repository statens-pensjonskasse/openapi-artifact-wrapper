/***********************************************************************
 // common functions to process package.json (the published package in repository root)
 ***********************************************************************/

import {readJsonFile, writeJsonFile} from "./resourceIO.mjs";

export const packageJson = readJsonFile('package.json');

/** Updates package.json version */
export function updatePackageVersion(desiredVersion) {
    if (desiredVersion === packageJson.version) {
        console.log(`package.json not updated. Current version: ${packageJson.version}, Desired version: ${desiredVersion}`);
    } else {
        const nextPackageJson = {
            ...packageJson,
            version: desiredVersion
        };
        writeJsonFile('package.json', nextPackageJson);
        console.log(`package.json updated to desired version: ${desiredVersion}`);
    }
}
