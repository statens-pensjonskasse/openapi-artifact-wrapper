/*********************
// Templated Maven pom
**********************/

import { execFileSync } from 'node:child_process';
import { api } from "./api.mjs";
import { exists, readFile, writeFile } from "./fileIO.mjs";
import { github } from "./git.mjs";


const pomXmlPath = 'pom.xml';

const pomTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <!-- BEWARE: pom is generated and manipulated by scripts, leave markers (comments) untouched -->
    <groupId>some.group<!--API-GROUP--></groupId>
    <artifactId>artifact<!--API-NAME--></artifactId>
    <version>0.0.0<!--API-VERSION--></version>
    <packaging>pom</packaging>

    <scm>
        <url>https://github.com/some-organization/\${project.artifactId}<!--REPO-PATH--></url>
    </scm>

    <distributionManagement>
        <repository>
            <id>github</id>
            <url>https://maven.pkg.github.com/some-organization/\${project.artifactId}<!--DISTRO-PATH--></url>
        </repository>
    </distributionManagement>

    <build>
        <plugins>
            <plugin>
                <groupId>org.codehaus.mojo</groupId>
                <artifactId>build-helper-maven-plugin</artifactId>
                <inherited>false</inherited>
                <executions>
                    <execution>
                        <id>attach-openapi</id>
                        <phase>package</phase>
                        <goals>
                            <goal>attach-artifact</goal>
                        </goals>
                        <configuration>
                            <artifacts>
                                <artifact>
                                    <!-- yaml specification is primary, should not be deleted -->
                                    <file>artifact.yaml<!--API-YAML--></file>
                                    <type>yaml</type>
                                    <classifier>openapi</classifier>
                                </artifact>
                                <!-- Feel free to add artifact with type=json as well -->
                            </artifacts>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>`;

/** Updates version in pom-file */
function updateVersion(pomXml, desiredVersion) {
    const match = /<version>.+<!--API-VERSION-->/
    return pomXml.replace(match, `<version>${desiredVersion}<!--API-VERSION-->`);
}

/** Value of a pom expression as resolved by maven, e.g. project.distributionManagement.repository.url */
function pomValue(expression) {
    const value = execFileSync('mvn', [
        'help:evaluate', `-Dexpression=${expression}`, '-q', '-DforceStdout',   // '-f', pomXmlPath,
    ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (!value || value === 'null' || value.startsWith('null object')) {
        throw new Error(`${expression} is not set in pom.xml`);
    }
    return value;
}

/** version in pom */
export function pomVersion() {
    return pomValue('project.version');
}

/** Emits a bootstrap pom.xml based on template above to working directory */
export function writeBootstrapPom(groupId) {
    if (exists(pomXmlPath)) {
        console.log(`pom.xml exists, not written.`);
        return;
    }

    const repoPath = github.repo.path;

    const matchGroup = /<groupId>.+<!--API-GROUP-->/
    const matchName  = /<artifactId>.+<!--API-NAME-->/
    const matchYaml  = /<file>.+\.yaml<!--API-YAML-->/
    const matchRepo  = /github.com\/.+<!--REPO-PATH-->/
    const matchDist  = /github.com\/.+<!--DISTRO-PATH-->/
    
    const nextPomXml = pomTemplate
        .replace(matchGroup, `<groupId>${groupId}<!--API-GROUP-->`)
        .replace(matchName,  `<artifactId>${api.artifactId}<!--API-NAME-->`)
        .replace(matchYaml, `<file>${api.yamlSpec}<!--API-YAML-->`)
        .replace(matchRepo, `github.com/${repoPath}<!--REPO-PATH-->`)
        .replace(matchDist, `github.com/${repoPath}<!--DISTRO-PATH-->`);

    writeFile(pomXmlPath, nextPomXml);
    console.log(`pom.xml generated with bootstrap content. Please edit to match your API and project.`);
}

/** Updates version in pom-file */
export function updatePomVersion(desiredVersion) {
    const pomXml = readFile(pomXmlPath);
    const nextPomXml = updateVersion(pomXml, desiredVersion);

    if (nextPomXml === pomXml) {
        console.log(`pom.xml not updated. Current version: ${desiredVersion}`);
    } else {
        writeFile(pomXmlPath, nextPomXml);
        console.log(`pom.xml updated to desired version: ${desiredVersion}`);
    }
}
