import { env } from '$env/dynamic/public';

// Sveltekit backend URL endpoints
export const regionUrl = (projectName: string, regionName: string) => `/projects/${projectName}/regions/${regionName}`;

// API URL endpoints
export const regionFormUrl = () => env.PUBLIC_API_URL + '/options';
export const runEmulatorUrl = () => env.PUBLIC_API_URL + '/emulator/run';
export const getCompareParametersUrl = () => env.PUBLIC_API_URL + '/compare-parameters';
export const versionEndpoint = () => env.PUBLIC_API_URL + '/version';
