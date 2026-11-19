/*****************************************************
// process API properties in openapi-artifact.json
*****************************************************/

import { github } from "./git.mjs";
import { deploy } from "./maven.mjs";
import {updatePackageVersion} from "./package.mjs";
import {establishPom, updatePomVersion} from "./pom.mjs";
import {fetchJson, fetchYaml, readJsonFile, writeJsonFile, writeFile} from "./resourceIO.mjs";
import {apiVersions} from "./swaggerhub.mjs";

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

function bootstrapJson() {
    return {
        _README_: [
            "*************************************************************************",
            "Bootstrap example configuration should be edited to match API and project",
            "*************************************************************************"
        ],
        registry: "https://api.swaggerhub.com/apis/skatteetaten/inntekt-api",
        desiredVersion: "1.6.2",
        artifactName: github.repo.name,
        distribution: {
            id: "github",
            uri: "https://npm.pkg.github.com"
        },
        maven: {
            groupId: "no.spk.ios",
            artifactId: github.repo.name,
            repoPath: github.repo.path
        }
    };
}


/** If openapi-artifact.json does not exist, create it with bootstrap content */
function establishApiProperties() {
    try {
        return openApiArtifact();
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
        writeJsonFile('openapi-artifact.json', bootstrapJson());
        console.log(`openapi-artifact.json generated with bootstrap content. Please edit to match your API and project.`);
        return establishApiProperties()
    }
}

function downloadedVersion() {
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

export async function bootstrap() {
    const apiProperties = establishApiProperties();
    establishPom(
        apiProperties.maven.groupId,
        apiProperties.maven.artifactId,
        apiProperties.maven.repoPath
    );
    // might as well update to latest & greatest
    await renovateApi();  // workingDir);
    await updateSpec();  // workingDir);
}


/** Download specification for desired version, yaml and json format */
export async function updateSpec() {
    const apiProperties = establishApiProperties()
    const actualVersion = downloadedVersion();
    const desiredVersion = apiProperties.desiredVersion;
    if ( actualVersion === desiredVersion ) {
        console.log(`API spec not updated. Current version: ${actualVersion}, Desired version: ${desiredVersion}`);
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
    const apiProperties = establishApiProperties();
    const versions = await apiVersions(apiProperties.registry);
    if (apiProperties.desiredVersion === versions.latest) {
        console.log(`openapi-artifact.json not updated, desiredVersion ${apiProperties.desiredVersion} is latest found on ${apiProperties.registry}`);
    } else {
        // til vi har landa på løsning for versjonering, oppdateres begge mulighetene
        const nextApiRegistry = {
            ...apiProperties,
            desiredVersion: versions.latest
        };
        writeJsonFile('openapi-artifact.json', nextApiRegistry);
        console.log(`openapi-artifact.json updated with desiredVersion: ${versions.latest}`);
    }

}

/** Deploys the specification to the Maven repository */
export function deployToMaven() {
    deploy(downloadedVersion());
}
