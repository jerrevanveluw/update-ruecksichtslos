export const packageFile = 'package.json';

export const encoding = 'utf-8';

export const determinePrefix = (args: string[], warn: (message: string) => void) => {
  const caret = args.includes('--caret') ? '^' : null;
  const tilde = args.includes('--tilde') ? '~' : null;
  if (caret && tilde) warn('Warning "--caret" and "--tilde" found as arguments. Picking "--tilde"');
  return tilde ? tilde : caret;
};

export const npmViewPackageCommand = (name: string) => ['npm', 'view', name, 'versions', '--json'];

export const parseWith = (name: string, currentVersion: string) => (data: string) => Promise.resolve(JSON.parse(data))
  .then((it: string | string[]) => Array.isArray(it) ? it : [it])
  .then((it: string[]) => [name, currentVersion, it] as const);
