/**********************************************************************************************************************
// scripts for accessing Open API specification (in yaml file) and generate defaults (from info in git and package.json)
***********************************************************************************************************************/

import { exists, readYamlFile } from './fileIO.mjs';
import { github } from "./git.mjs";

const yamlSpec = `${github.repo.name}.yaml`;

export const api = {
    artifactId: github.repo.name,
    yamlSpec,
    version: function () {
        if (exists(yamlSpec)) {
            return readYamlFile(yamlSpec)?.info?.version;
        }
        console.error(`${yamlSpec} not found, version unavailable.`);
        process.exit(1);
    }
}
