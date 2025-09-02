import { PUBLIC_MINTR_URL } from '$env/static/public';

export const regionUrl = (projectName: string, regionName: string) => `/projects/${projectName}/regions/${regionName}`;
export const regionFormUrl = () => PUBLIC_MINTR_URL + '/options';
export const runEmulatorUrl = () => PUBLIC_MINTR_URL + '/emulator/run';
