export const packageFile = 'package.json';

export const encoding = 'utf-8';

export const determinePrefix = (args: string[], warn: (message: string) => void) => {
  const caret = args.includes('--caret') ? '^' : null;
  const tilde = args.includes('--tilde') ? '~' : null;
  if (caret && tilde) warn('Warning "--caret" and "--tilde" found as arguments. Picking "--tilde"');
  return tilde ? tilde : caret;
};

export const npmViewPackageCommand = (name: string) => ['npm', 'view', name, 'versions', '--json'];
