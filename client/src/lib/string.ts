const URL_RESERVED_CHARACTERS = /[/\\?#%]/;
export const URL_RESERVED_CHARACTERS_MESSAGE = 'cannot contain / \\ ? # or %';
export const isUrlSafeName = (name: string): boolean => !URL_RESERVED_CHARACTERS.test(name);
