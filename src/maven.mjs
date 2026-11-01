/*************************************
// maven-stuff, like deploy (=publish)
**************************************/

import { execFileSync } from 'node:child_process';
import { openApiArtifact } from './openapi-artifact.mjs';
import { updatePomVersion } from './pom.mjs';


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
function deployWithPom() {
  const apiArtifact = openApiArtifact();
  const version = apiArtifact.downloadedVersion();
  updatePomVersion(version);

  execFileSync('mvn', ['deploy'], { stdio: 'inherit' });
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
    `-Dversion=${version}`,
    '-Dclassifier=openapi',
  ];

  execFileSync('mvn', [...mvnOptions, '-Dtype=yaml', `-Dfile=${yamlFilePath}`], { stdio: 'inherit' });
  execFileSync('mvn', [...mvnOptions, '-Dtype=json', `-Dfile=${jsonFilePath}`], { stdio: 'inherit' });
}

export function deployToMaven() {
  deployWithPom()
}