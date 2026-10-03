openapi-artifact-wrapper
========================

Repository with tools used to track and wrap Open API specifications on swaggerhub:  
* npm scripts that may be used from command-line (locally or on CI/CD).
* github reusable workflows that will use the above scripts to track, wrap and publish a specific Open API specifications.
* renovate preset with custom datasource that may be used to track version of a specific Open API specification.

**Track**: Repo has renovate script to update `api.json` when new version is found on swaggerhub.  

**Wrap**:   

**Artifacts**:  
*   github reusable workflows: TODO
*   npm cmd scripts: `@statens-pensjonskasse/openapi-artifact-wrapper` npm package containing scripts used for above stated purposes

Repository is owned by SPK Team "integrasjon-og-samhandling"

Usage
-----
A nice start is `npx @statens-pensjonskasse/openapi-artifact-wrapper help`

Development
-----------
node required for local development, maven only if you want to test deploy stuff manually.  
`package.json` in the root is the published npm package.  
Open Pull requests for changes.  


TODO
====
### renovate preset
```
  "customManagers": [
    {
      "customType": "jsonata",
      "description": "SwaggerHub APIs in package.json swaggerhubDependency, { \"<swaggerhub api url>\": \"<version>\" }",
      "fileFormat": "json",
      "managerFilePatterns": ["/^package\\.json$/"],
      "matchStrings": [
        "$each(swaggerhubDependency, function($v, $k) { { \"depName\": $k, \"currentValue\": $v } })"
      ],
      "datasourceTemplate": "custom.swaggerhub"
    },
    {
      "customType": "jsonata",
      "description": "SwaggerHub API in api-registry.json, desired version from registry was the latest on last scan",
      "fileFormat": "json",
      "managerFilePatterns": ["/^api-registry\\.json$/"],
      "matchStrings": [
        "{ \"depName\": registry, \"registryUrl\": registry, \"currentValue\": desiredVersion }"
      ],
      "datasourceTemplate": "custom.apiRegistry"
    }
  ],
  "customDatasources": {
    "swaggerhub": {
      "defaultRegistryUrlTemplate": "{{packageName}}",
      "transformTemplates": [
        "{\"releases\": apis.{\"version\": properties[type='X-Version'].value}}"
      ]
    },
    "apiRegistry": {
      "transformTemplates": [
        "{\"releases\": apis.{\"version\": properties[type='X-Version'].value}}"
      ]
    }
  },
```

### reusable workflow
The reusable workflow installs and runs a pinned tools version:
on:
  workflow_call:
    inputs:
      tools-version:
        type: string
        required: true

permissions:
  contents: write
  packages: read

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 24
          registry-url: https://npm.pkg.github.com

      - name: Install API tools
        env:
          NODE_AUTH_TOKEN: ${{ github.token }}
        run: npm install --no-save --ignore-scripts "@statens-pensjonskasse/openapi-artifact-wrapper@${{ inputs.tools-version }}"

      - name: Update specification
        run: npx --no-install openapi-artifact-wrapper update-spec
A caller uses the workflow like this:
jobs:
  prepare:
    uses: your-org/workflows/.github/workflows/api-prepare.yml@v1
    with:
      tools-version: 1.0.0
    secrets: inherit
Use a pinned package version rather than latest; this makes workflow executions reproducible. If every API repository already commits the tools package in devDependencies, the reusable workflow can run npm ci followed by npm run update-spec instead. That is even more reproducible because package-lock.json controls the exact tools version.
I would also remove renovateApi() from the CLI. Renovate should update api-registry.json itself; the CLI should consume desiredVersion, download that specification, and synchronize package.json and pom.xml. This keeps responsibilities separate and makes the same CLI safe to use locally and in reusable workflows.