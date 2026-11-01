/*********************
// Templated Maven pom
**********************/

import { openApiArtifact } from './openapi-artifact.mjs';
import {readFile, writeFile} from "./resourceIO.mjs";


const pomXmlPath = 'pom.xml';

const pomTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <!-- BEWARE: NOT A MAVEN PROJECT, pom is used and manipulated by scripts -->
    <groupId>no.spk.ios<!--API-GROUP--></groupId>
    <artifactId>openapi-artifact-wrapper<!--API-NAME--></artifactId>
    <version>0.0.0<!--API-VERSION--></version>
    <packaging>pom</packaging>

    <licenses>
        <license>
            <comments>The Open API specification contained in artifacts is downloaded unmodified from Swaggerhub. Statens pensjonskasse grants no licence to it.</comments>
        </license>
    </licenses>

    <scm>
        <url>https://github.com/statens-pensjonskasse/\${project.artifactId}</url>
    </scm>

    <distributionManagement>
        <repository>
            <id>github</id>
            <url>https://maven.pkg.github.com/statens-pensjonskasse/\${project.artifactId}</url>
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
                                    <file>openapi-artifact-wrapper.yaml<!--API-YAML--></file>
                                    <type>yaml</type>
                                    <classifier>openapi</classifier>
                                </artifact>
                                <artifact>
                                    <file>openapi-artifact-wrapper.json<!--API-JSON--></file>
                                    <type>json</type>
                                    <classifier>openapi</classifier>
                                </artifact>
                            </artifacts>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
`;

/** Bootstrap pom.xml based on template above */
function bootstrapPom() {
    const apiArtifact = openApiArtifact();
    const groupId    = apiArtifact.groupId
    const artifactId = apiArtifact.artifactName
    const specYaml   = apiArtifact.specYaml
    const specJson   = apiArtifact.specJson
    // TODO: get more stuff from openapi-artifact.json


    const matchGroup = /<groupId>.+<!--API-GROUP-->/
    const matchName  = /<artifactId>.+<!--API-NAME-->/
    const matchYaml  = /<file>.+\.yaml<!--API-YAML-->/
    const matchJson  = /<file>.+\.json<!--API-JSON-->/
    return pomTemplate
        .replace(matchGroup, `<groupId>${groupId}<!--API-GROUP-->`)
        .replace(matchName,  `<artifactId>${artifactId}<!--API-NAME-->`)
        .replace(matchYaml, `<file>${specYaml}<!--API-YAML-->`)
        .replace(matchJson, `<file>${specJson}<!--API-JSON-->`);
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
