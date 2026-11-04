/*************************************
// maven-stuff, like deploy (=publish)
**************************************/

import { execFileSync } from 'node:child_process';
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

/** Deploys the specification to the Maven repository, but does not work on github - we need to deploy using pom:
**Note on Maven publish to Github**: fails in Github workflow when publishing specification files separately (using deploy-file)
and github workflows do not support more that 1-stage deploy.
Possible fix by generating pom with 1-stage publish, which will be done eventually.
This is what Google AI told me, it is deduced from doc [Immutable Releases](https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases):
"Once the very first file of a static release version (like 1.0.0) is completely processed, GitHub Packages locks down that version record and marks it as immutable.
Even if you are trying to add a completely new file type that doesn't exist yet (e.g., adding a .zip when only a .jar exists),
GitHub Packages blocks the request because it views any new upload to an existing release coordinates block as an illegal historical mutation."
*/
function deployWithoutPom(groupId, artifactId, version) {
  updatePomVersion(version);
  const deploy2url = pomValue('project.distributionManagement.repository.url');
  const yamlFilePath = `${artifactId}.yaml`;
  const jsonFilePath = `${artifactId}.json`;

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

/** Deploys the specification to the Maven repository */
export function deploy(version) {
  updatePomVersion(version);
  execFileSync('mvn', ['deploy'], { stdio: 'inherit' });
}