#!/usr/bin/env node

import { bootstrap, downloadedVersion, deployToMaven, renovateApi, updateSpec } from './src/openapi-artifact.mjs';

const [command, ...args] = process.argv.slice(2);
/* Should you need:
function groupId() {
    if (args[0])
        return args[0];
    throw new Error('Missing groupId argument, aborting');
};
const workingDir = process.cwd();
*/

const helpText = `

From empty project: start with "node ./openapi-artifact-cli.mjs bootstrap some.group.id"
then edit openapi-artifact.json and pom.xml as appropriate

Usage: "node ./openapi-artifact-cli.mjs <command>"
Commands:
  api-version   Show the API version
  bootstrap     Emits openapi-artifact.json + pom.xml, needed for further work 
  renovate-api  Update the OpenAPI specification for the desired version
  update-api    Download the OpenAPI specification for the desired version
  mvn-deploy    Deploy the OpenAPI specification to Maven repository
  help          Show this help message
`;

switch (command) {
    case 'api-version':
        const version = downloadedVersion();  // workingDir);
        if (!version) {
            process.exitCode = 1;
            break;
        }
        console.log(version);
        break;
    case 'bootstrap':
        await bootstrap();  // workingDir);
        break;
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
