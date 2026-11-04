/*****************************************************
// process API properties in openapi-artifact.json
*****************************************************/

import {fetchJson, fetchYaml, readJsonFile, writeJsonFile, writeFile} from "./resourceIO.mjs";
import {updatePackageVersion} from "./package.mjs";
import { deploy } from "./maven.mjs";
import {emitBootstrapPom, updatePomVersion} from "./pom.mjs";
import {apiVersions} from "./swaggerhub.mjs";

const bootstrapJson = {
        _README_: [
            "*************************************************************************",
            "Bootstrap example configuration should be edited to match API and project",
            "*************************************************************************"
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

function openApiArtifact() {
    const apiArtifact = readJsonFile('openapi-artifact.json');
    if (!apiArtifact.registry) {
        throw new Error(`Missing registry in openapi-artifact.json`);
    }
    if (!apiArtifact.desiredVersion) {
        throw new Error(`Missing desiredVersion in openapi-artifact.json`);
    }
    if (!apiArtifact.artifactName) {
        throw new Error(`Missing artifactName in openapi-artifact.json`);
    }
    return apiArtifact;
}

function specFiles() {
    const apiArtifact = openApiArtifact();
    return  {  
        specYaml: `${apiArtifact.artifactName}.yaml`,
        specJson: `${apiArtifact.artifactName}.json`
    }
}

/** If openapi-artifact.json does not exist, create it with bootstrap content */
function forceApiProperties() {
    try {
        return openApiArtifact();
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
        // TODO:  get details from git remote get-url origin | sed -E 's/^git@([^:]+):/git+https:\/\/\1\//'
        writeJsonFile('openapi-artifact.json', bootstrapJson);
        return forceApiProperties()
    }
}

export async function bootstrap() {
    const apiProperties = forceApiProperties();
    emitBootstrapPom(
        apiProperties.groupId,
        apiProperties.artifactName
    );
    // might as well update to latest & greatest
    await renovateApi();  // workingDir);
    await updateSpec();  // workingDir);
}


export function downloadedVersion() {
    try {
        const specJson = specFiles().specJson;
        return readJsonFile(specJson).info?.version;
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
        return null;
    }
}

/** Download specification for desired version, yaml and json format */
export async function updateSpec() {
    const apiProperties = forceApiProperties()
    const actualVersion = downloadedVersion();
    const desiredVersion = apiProperties.desiredVersion;
    if ( actualVersion === desiredVersion ) {
        console.log(`No update needed. Current version: ${actualVersion}, Desired version: ${desiredVersion}`);
        return;
    } else {
        console.log(`Updating API spec to version ${desiredVersion}`);
    }

    const versions = await apiVersions(apiProperties.registry);
    const apiUrl = versions.url(apiProperties.desiredVersion);


    const localFiles = specFiles();
    const yamlUrl = apiUrl + "/swagger.yaml";
    writeFile(localFiles.specYaml, await fetchYaml(yamlUrl));
    console.log(`${yamlUrl} downloaded to ${localFiles.specYaml}`);

    // json file is parsed for currently downloaded version, so we download it after yaml to avoid inconsistent versions
    writeJsonFile(localFiles.specJson, await fetchJson(apiUrl));
    console.log(`${apiUrl} downloaded to ${localFiles.specJson}`);

    updatePackageVersion(apiProperties.desiredVersion);
    updatePomVersion(apiProperties.desiredVersion);
}

/** Updates package.json version */
export async function renovateApi() {
    const apiProperties = forceApiProperties();
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

/** Deploys the specification to the Maven repository */
export function deployToMaven() {
    deploy(downloadedVersion());
}
