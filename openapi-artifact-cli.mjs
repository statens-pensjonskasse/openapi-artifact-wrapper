#!/usr/bin/env node

import {renovateApi, updateSpec} from './src/openapi-artifact.mjs';
import { deployToMaven } from './src/mvn-deploy.mjs';

const [command] = process.argv.slice(2);
const workingDir = process.cwd();
const helpText = `
Usage: node openapi-artifact-cli <command>
Commands:
  renovate-api  Update the OpenAPI specification for the desired version
  update-api    Download the OpenAPI specification for the desired version
  mvn-deploy    Deploy the OpenAPI specification to Maven repository
  help          Show this help message
`;

switch (command) {
    case 'renovate-api':
        await renovateApi();  // workingDir);
        break;
    case 'update-api':
        await updateSpec();  // workingDir);
        break;
    case 'mvn-deploy':
        await deployToMaven();  // workingDir);
        break;
    case 'help':
        console.log(helpText);
        break;
    default:
        throw new Error(`Unknown command: ${command}`);
}
