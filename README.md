openapi-artifact-wrapper
========================

Repository of tools used to track, update, wrap and publish Open API specifications on swaggerhub:  
* **Tracking**: bump `desiredVersion` (in `openapi-artifact.json`) when a newer version of API is available on swaggerhub
  * manually with script `renovate-api`
  * by renovate if you extend preset `github>statens-pensjonskasse/openapi-artifact-wrapper:renovate-swaggerhub-artifact`.
* **Updating**: node script `update-api` will download `desiredVersion` of specification and update package.json + pom.xml
* **Wrapping**: you should provide package.json and pom.xml with basic setup, a bootstrap script may some day find its way to this repo to help with that.
* **Publishing**: node publish is fine, script `mvn-deploy` will deploy properly qualified and typed Maven artifacts:  
  * some-api.json deployed with classifier=openapi, type=json
  * some-api.yaml deployed with classifier=openapi, type=yaml

Reusable workflows are chained (so you just pick the 1 that fits) and does the following:  
1. `api-versioning.yml` checks if git tag matching api version is found, output released=true if so
2. `api-release.yml` uses `api-versioning.yml`, performs a release if not released already, output release-performed=true/false
3. `api-publish.yml` uses `api-release.yml`, publishes artifacts if a new release was performed

Reusable workflows generally use the scripts, the scripts may also be run locally on a developer PC with appropriate Node installation, like so:  
`npx @statens-pensjonskasse/openapi-artifact-wrapper <command>` or `node openapi-artifact-cli <command>`  

Repo owned and maintained by SPK Team "integrasjon-og-samhandling".

Development
-----------
This project is developed using node and `package.json` primarily, maven is needed only for testing deploy manually.  
Open Pull requests for changes.  
**BEWARE**: You must bump version (in package.json) as it is not upped by workflow

Usage
-----
See functional example of use in [skatt-inntekt-api](https://github.com/statens-pensjonskasse/skatt-inntekt-api)  
Suggested steps:  
1.  Set up a node project with devDependency @statens-pensjonskasse/openapi-artifact-wrapper
2.  `npm install`
3.  Add file `openapi-artifact.json` (and specify contents)
4.  run `node openapi-artifact-cli update-api` (or the npx version)
5.  add .gitignore, renovate setup and workflows as you see fit

### openapi-artifact.json contents
*  "registry": url to swaggerhub api endpoint returning versions of api ([like this](https://api.swaggerhub.com/apis/skatteetaten/inntekt-api))
*  "desiredVersion": duh
*  "localJson" + "localYaml": file names should match files in your package.json (and localJson must be used as parameter to `api-publish.yml` workflow)

### Note on use of openapi-artifact-wrapper
Given that published npm scripts are found on github packages for organization "statens-pensjonskasse"  
You (and ci-job) need a github token (PAT) with read:packages to install the npm package, and you may have a hard time using openapi-artifact-wrapper in CI workflows.

If you are outside organization "statens-pensjonskasse", don't bother fixing, just fork the code you need.  
If you are inside organization "statens-pensjonskasse", simplest option is to make api wrapping repository internal.

We may eventually be able to publish open source artifacts as well as code.

### Note on licensing (of wrapped API)
Respect the work of others and the LICENSE carried by wrapped Open API specifications.  
**How**: check that license and only attach what is required or compatible with that license. Redo if license is changed in a new version of the API.
