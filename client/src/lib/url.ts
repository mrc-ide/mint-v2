import { env } from '$env/dynamic/public';

export const regionUrl = (projectName: string, regionName: string) => `/projects/${projectName}/regions/${regionName}`;
export const regionFormUrl = () => env.PUBLIC_API_URL + '/options';
export const runEmulatorUrl = () => env.PUBLIC_API_URL + '/emulator/run';
export const getCompareParametersUrl = () => env.PUBLIC_API_URL + '/compare-parameters';
