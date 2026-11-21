openapi-artifact-wrapper
========================

Node cli can emit and manipulate pom.xml used to publish Maven artifacts of Open API specification.

How to use / getting started
----------------------------
### Node scripts
Scripts may be run on ci or locally on developer PC with appropriate Node installation, like so:  
* `node openapi-artifact-cli.mjs help`
* `npx @statens-pensjonskasse/openapi-artifact-wrapper help`

Get started by generating bootstrap setup: `node ./openapi-artifact-cli.mjs bootstrap some.group.id`, then edit generated pom.xml as appropriate.  
Example of use in [skatt-inntekt-api](https://github.com/statens-pensjonskasse/skatt-inntekt-api)  

**Note**: artifact published to github packages under organization "statens-pensjonskasse" may not be available outside of SPK.  
...so until we have fixed that, fork the repo and use the code.

### Reusable workflows
Reusable workflows are chained from top to bottom:  
1. `api-versioning.yml` output released=true if git tag matching api version is found
2. `api-release.yml` uses `api-versioning.yml`, performs a release if not released already, output release-performed=true/false
3. `api-publish.yml` uses `api-release.yml`, publishes artifacts if a new release was performed


License, contact, support
-------------------------
[MIT](LICENSE).  
Repo owned and maintained by SPK Team "integrasjon-og-samhandling".  
Errors, problems and wishes may be reported as [issue on GitHub](https://github.com/statens-pensjonskasse/openapi-artifact-wrapper/issues).

Development
-----------
Develop using node scripts primarily: `node ./openapi-artifact-cli.mjs help`

Maven is needed only for testing deploy manually  
Open Pull requests for changes.  

**BEWARE**: After release, bump version (in package.json) manually as it may not be upped by workflow: `npm version prepatch --preid=dev --no-git-tag-version`

### TODO
mvn publish by pom  
workflow `api-release.yml` must check preconditions  
remove workflow `api-publish.yml`


### SNAPSHOTs and development versions
Should you care to publish SNAPSHOT/development versions of a wrapped API artifact, you must do so manually

#### Maven
```
mvn install:install-file \
-DpomFile=pom.xml -DgeneratePom=false -DuniqueVersion=false -Dversion=${version}-SNAPSHOT \
-Dclassifier=openapi -Dtype=yaml -Dfile=${artifactId}.yaml
```
(or `mvn deploy:deploy-file-DrepositoryId=github -Durl=https://maven.pkg.github.com/statens-pensjonskasse/${artifactId} ...` if you want to distribute SNAPSHOT outside your machine)

#### Node
```
npm version prepatch --preid=beta --no-git-tag-version
npm publish --tag beta
git checkout package.json package-lock.json # reset
```
