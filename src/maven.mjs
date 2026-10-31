/**************************************************************************************************************************
// maven-stuff, like deploy (=publish) Open API specification artifacts, and updating version in pom to reflect API version
**************************************************************************************************************************/

import { execFileSync } from 'node:child_process';
import { openApiArtifact } from './openapi-artifact.mjs';
import { readFile, writeFile } from './resourceIO.mjs';
import { bootstrapPom } from './pom-bootstrap.mjs';

const pomXmlPath = 'pom.xml';

/** Value of a pom expression as resolved by maven, e.g. project.distributionManagement.repository.url */
function pomValue(expression) {
  const value = execFileSync('mvn', [
    'help:evaluate', `-Dexpression=${expression}`, '-q', '-DforceStdout', '-f', pomXmlPath,
  ], { encoding: 'utf8' }).trim();
  if (!value || value === 'null' || value.startsWith('null object')) {
    throw new Error(`${expression} is not set in pom.xml`);
  }
  return value;
}

/** Deploys the specification to the Maven repository */
function deployWithoutPom() {
  const apiArtifact = openApiArtifact();
  const version = apiArtifact.downloadedVersion();
  updatePomVersion(version);

  const deploy2url = pomValue('project.distributionManagement.repository.url');
  const yamlFilePath = apiArtifact.specYaml;
  const jsonFilePath = apiArtifact.specJson;

  const mvnOptions = [
    'deploy:deploy-file',
    '-DrepositoryId=github',
    `-Durl=${deploy2url}`,
    `-DpomFile=${pomXmlPath}`,
    '-DgeneratePom=false',
    '-DuniqueVersion=false',
    `-Dversion=${version}`,
    '-Dclassifier=openapi',
  ];

  execFileSync('mvn', [...mvnOptions, '-Dtype=yaml', `-Dfile=${yamlFilePath}`], { stdio: 'inherit' });
  execFileSync('mvn', [...mvnOptions, '-Dtype=json', `-Dfile=${jsonFilePath}`], { stdio: 'inherit' });
}

/** Updates version in pom-file */
export function updatePomVersion(desiredVersion) {
  const pomXml = readFile(pomXmlPath);
  const match = /<version>.+<!--API-VERSION-->/
  const nextPomXml = pomXml.replace(match, `<version>${desiredVersion}<!--API-VERSION-->`);

  if (nextPomXml === pomXml) {
    console.log(`No update to pom.xml`);
  } else {
    writeFile(pomXmlPath, nextPomXml);
  }
}

/** Emits a bootstrap pom.xml to working directory */
export function emitBootstrapPom() {
  const nextPomXml = bootstrapPom();
  writeFile(pomXmlPath, nextPomXml);
}

export function deployToMaven() {
  deployWithoutPom()
}