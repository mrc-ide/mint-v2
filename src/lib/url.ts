import { env } from '$env/dynamic/public';

export const regionUrl = (projectName: string, regionName: string) => `/projects/${projectName}/regions/${regionName}`;
export const regionFormUrl = () => env.PUBLIC_MINTR_URL + '/options';
export const runEmulatorUrl = () => env.PUBLIC_MINTR_URL + '/emulator/run';
export const strategiseUrl = () => env.PUBLIC_MINTR_URL + '/strategise';
