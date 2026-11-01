/*****************************************************
// process API properties in openapi-artifact.json
*****************************************************/

import {fetchJson, fetchYaml, readJsonFile, writeJsonFile, writeFile} from "./resourceIO.mjs";
import {updatePackageVersion} from "./package.mjs";
import {updatePomVersion} from "./pom.mjs";
import {apiVersions} from "./swaggerhub.mjs";

const bootstrap = {
        _README_: [
            "********************************************************************",
            "This is just an example configuration used to test and demo the tool",
            "********************************************************************"
        ],
        registry: "https://api.swaggerhub.com/apis/skatteetaten/inntekt-api",
        desiredVersion: "1.6.2",
        artifactName: "xample-api",
        distribution: {
            id: "github",
            registry: "https://npm.pkg.github.com",
            path: "/statens-pensjonskasse/${project.artifactId}"
        },
        groupId: "no.spk.ios"
    }

export function emitBootstrap() {
    // TODO:  get details from git: git remote get-url origin | sed -E 's/^git@([^:]+):/git+https:\/\/\1\//'
    writeJsonFile('openapi-artifact.json', bootstrap);
}

/** Download specification for desired version, yaml and json format */
export function openApiArtifact() {
    const apiProperties = readJsonFile('openapi-artifact.json');
    const specJson = `${apiProperties.artifactName}.json`;
    const specYaml = `${apiProperties.artifactName}.yaml`;
    return {
        artifactName: apiProperties.artifactName,
        groupId: apiProperties.groupId,
        specJson,
        specYaml,
        registry: apiProperties.registry,
        desiredVersion: apiProperties.desiredVersion,
        downloadedVersion: () => {
            try {
                return readJsonFile(specJson).info?.version;
            } catch (error) {
                if (error.code !== 'ENOENT') {
                    throw error;
                }
                return null;
            }
        }
    };
}

/** Download specification for desired version, yaml and json format */
export async function updateSpec() {
    const apiProperties = openApiArtifact()
    const actualVersion = apiProperties.downloadedVersion();
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
    writeFile(apiProperties.specYaml, await fetchYaml(yamlUrl));
    console.log(`${yamlUrl} downloaded to ${apiProperties.specYaml}`);

    // json file is parsed for currently downloaded version, so we download it after yaml to avoid inconsistent versions
    writeJsonFile(apiProperties.specJson, await fetchJson(apiUrl));
    console.log(`${apiUrl} downloaded to ${apiProperties.specJson}`);

    updatePackageVersion(apiProperties.desiredVersion);
    updatePomVersion(apiProperties.desiredVersion);
}

/** Updates package.json swaggerhubDependency version */
export async function renovateApi() {
    const apiProperties = readJsonFile('openapi-artifact.json');
    const versions = await apiVersions(apiProperties.registry);
    if (apiProperties.desiredVersion === versions.latest) {
        console.log(`No update needed. Current version ${apiProperties.desiredVersion} is latest found on ${apiProperties.registry}`);
    } else {
        // til vi har landa på løsning for versjonering, oppdateres begge mulighetene
        const nextApiRegistry = {
            ...apiProperties,
            desiredVersion: versions.latest
        };
        writeJsonFile('openapi-artifact.json', nextApiRegistry);
        console.log(`Updated desiredVersion in openapi-artifact.json: ${versions.latest}`);
    }

}
