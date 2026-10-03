/*****************************************************
// gets versions with url of API from Swaggerhub
*****************************************************/


/** Versions of API found on Swaggerhub */
export async function apiVersions(registry) {
    const response = await fetch(registry);
    if (!response.ok) {
        throw new Error(`SwaggerHub request failed: GET ${registry} responded ${response.status} ${response.statusText}`);
    }

    const swaggerHubInfo = await response.json();

    const latest = swaggerHubInfo.defaultVersion;
    if (typeof latest !== 'string' || !latest) {
        throw new Error('SwaggerHub response did not include a default version');
    }

    const all = swaggerHubInfo.apis?.map((swaggerApi) => {
        const version = swaggerApi.properties?.find((property) => property.type === 'X-Version')?.value;
        const url = swaggerApi.properties?.find((property) => property.type === 'Swagger')?.url;
        if (typeof version !== 'string' || !version || typeof url !== 'string' || !url) {
            throw new Error(`SwaggerHub response did not include X-Version and Swagger URL for ${version}`);
        }
        return { version, url };
    });

    return {
        latest,
        all,
        /** Swagger url of given version, null if version is not found on SwaggerHub */
        url: function url(version) {
            const found = all?.find((api) => api.version === version);
            if (!found) {
                return null;
            }
            return found.url;
        }
    };
}
