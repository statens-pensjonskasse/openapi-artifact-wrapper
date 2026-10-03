/**************************************************************************************************************************
// maven-stuff, like deploy (=publish) Open API specification artifacts, and updating version in pom to reflect API version
**************************************************************************************************************************/

import { execFileSync } from 'node:child_process';
import { ApiRegistry } from './openapi-artifact.mjs';
import { readFile, writeFile } from './workdir.mjs';

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

/** Writes pom-file */
export function updatePomVersion(desiredVersion) {
  // TODO: if file not found, emit bootstrap-version
  const pomXml = readFile(pomXmlPath);
  const match = /<version>.+<!--APIVERSION-->/
  const nextPomXml = pomXml.replace(match, `<version>${desiredVersion}<!--APIVERSION-->`);

  if (nextPomXml === pomXml) {
    console.log(`No update to pom.xml`);
  } else {
    writeFile(pomXmlPath, nextPomXml);
  }
}

/** Deploys the specification to the Maven repository */
export function deployToMaven() {
  
  const version = ApiRegistry.downloadedVersion
  updatePomVersion(version);

  const deploy2url = pomValue('project.distributionManagement.repository.url');
  const yamlFilePath = ApiRegistry.specYaml;
  const jsonFilePath = ApiRegistry.specJson;

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
