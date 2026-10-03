/*****************************************************
// process API properties in openapi-artifact.json
*****************************************************/

import {readJsonFile, writeJsonFile, writeFile} from "./workdir.mjs";
import {updatePackageVersion} from "./package.mjs";
import {updatePomVersion} from "./mvn-deploy.mjs";
import {apiVersions} from "./swaggerhub.mjs";

const openapiArtifact = readJsonFile('openapi-artifact.json');

const apiProperties = {
    registry: openapiArtifact.registry,
    desiredVersion: openapiArtifact.desiredVersion,
    localJsonFile: openapiArtifact.localJson,
    localYamlFile: openapiArtifact.localYaml
};

/** Path to files read/written are relative to where script is run from, not script location as for imports */
const specFile = apiProperties.localJsonFile;
const specYaml = apiProperties.localYamlFile;



/** Downloaded specification, null if not downloaded yet */
function readSpec() {
    try {
        return readJsonFile(specFile);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
        return null;
    }
}

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }
    return await response.json();
}

async function fetchYaml(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }
    return await response.text();
}

/** Download specification for desired version, yaml and json format */
export async function updateSpec() {
    const actualVersion = readSpec()?.info?.version;
    const desiredVersion = apiProperties.desiredVersion;
    if ( actualVersion === desiredVersion ) {
        console.log(`No update needed. Current version: ${actualVersion}, Desired version: ${desiredVersion}`);
        return;
    } else {
        console.log(`Updating API spec to version ${desiredVersion}`);
    }

    const versions = await apiVersions(apiProperties.registry);
    const apiUrl = versions.url(apiProperties.desiredVersion);

    const yamlUrl = apiUrl + "/swagger.yaml";
    writeFile(specYaml, await fetchYaml(yamlUrl));
    console.log(`${yamlUrl} downloaded to ${specYaml}`);

    // json file is parsed for currently downloaded version, so we download it after yaml to avoid inconsistent versions
    writeJsonFile(specFile, await fetchJson(apiUrl));
    console.log(`${apiUrl} downloaded to ${specFile}`);

    updatePackageVersion(apiProperties.desiredVersion);
    updatePomVersion(apiProperties.desiredVersion);
}

/** Updates package.json swaggerhubDependency version */
export async function renovateApi() {
    const versions = await apiVersions(apiProperties.registry);
    if (apiProperties.desiredVersion === versions.latest) {
        console.log(`No update needed. Current version ${apiProperties.desiredVersion} is latest found on ${apiProperties.registry}`);
    } else {
        // til vi har landa på løsning for versjonering, oppdateres begge mulighetene
        const nextApiRegistry = {
            ...openapiArtifact,
            desiredVersion: versions.latest
        };
        writeJsonFile('openapi-artifact.json', nextApiRegistry);
        console.log(`Updated desiredVersion in openapi-artifact.json: ${versions.latest}`);
    }

}


export const ApiRegistry = {
    specJson: apiProperties.localJsonFile,
    specYaml: apiProperties.localYamlFile,
    desiredVersion: apiProperties.desiredVersion,
    downloadedVersion: readSpec()?.info?.version
};
