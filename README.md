openapi-artifact-wrapper
========================

Node cli can emit and manipulate pom.xml used to publish Maven artifacts of Open API specification.

How to use / getting started
----------------------------
### Node scripts
Scripts may be run on ci or locally on developer PC with appropriate Node installation, like so:  
* `node apiwrap.mjs help`
* `npm install @statens-pensjonskasse/openapi-artifact-wrapper && npx @statens-pensjonskasse/openapi-artifact-wrapper help`

Get started by generating bootstrap setup: `node apiwrap.mjs bootstrap some.group.id`, then edit generated pom.xml as appropriate.  
Example of use in [skatt-inntekt-api](https://github.com/statens-pensjonskasse/skatt-inntekt-api)  

**Note**: artifact published to github packages under organization "statens-pensjonskasse" may not be available outside of SPK.  
...so until we have fixed that, fork the repo and use the code.

### Reusable workflows
`build-publish-api.yml` by default runs:  
1. `npm run tbv`
2. commit and push changed files
3. proceeds to publish if needed and permitted (branch & version OK)
4. publish = release, npm publish, mvn deploy


License, contact, support
-------------------------
[MIT](LICENSE).  
Repo owned and maintained by SPK Team "integrasjon-og-samhandling".  
Errors, problems and wishes may be reported as [issue on GitHub](https://github.com/statens-pensjonskasse/openapi-artifact-wrapper/issues).

Development
-----------
Develop using node scripts primarily: `node ./apiwrap.mjs help`, Maven needed only for testing / deploying manually.  
Open Pull requests for changes.  
**BEWARE** use conventional commits if you want to step up and publish new versions:  
*   trigger minor bump: "feat:" or "feat(scope)"
*   trigger major bump: "feat!:", "fix!:", "refactor(scope)!:" or "BREAKING CHANGE".


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
