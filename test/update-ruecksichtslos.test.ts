// @deno-types="https://unpkg.com/@types/mocha@7.0.2/index.d.ts"
import 'https://unpkg.com/mocha@7.2.0/mocha.js';
import { expect } from 'https://deno.land/x/expect@v0.2.6/mod.ts';

import { Package, Update } from '../src/update-ruecksichtslos.ts';

// @ts-ignore
mocha.setup({ ui: 'bdd', reporter: 'spec' });
// @ts-ignore
mocha.checkLeaks();

const createReader = ({ dependencies, devDependencies }: Package) => () =>
  Promise.resolve({
    dependencies,
    devDependencies,
  });

const executor = (name: string) => Promise.resolve([name, ['0.0.1', '0.2.4', '1.0.0-rc']] as readonly [string, string[]]);

// @ts-ignore
describe('Update Rücksichtslos package.json', async () => {
  // @ts-ignore
  it('with dependencies and devDependencies', async () => {
    const dependencies = { someDependency: '0.0.1' };
    const devDependencies = { someDevDependency: '0.0.1' };

    Update(createReader({ dependencies, devDependencies }), executor, data => {
      const { dependencies, devDependencies } = JSON.parse(data);
      expect(dependencies.someDependency).toBe('0.2.4');
      expect(devDependencies.someDevDependency).toBe('^0.2.4');
    });
  });

  // @ts-ignore
  it('with undefined dependencies and devDependencies', async () => {
    Update(createReader({}), executor, data => {
      const { dependencies, devDependencies } = JSON.parse(data);
      expect(dependencies).toEqual({});
      expect(devDependencies).toEqual({});
    });
  });

  // @ts-ignore
  it('with "file://" reference', async () => {
    const dependencies = {
      someDependency: '0.0.1',
      localFile: 'file://../../some/folder',
    };

    Update(createReader({ dependencies }), executor, data => {
      const { dependencies } = JSON.parse(data);
      expect(dependencies.someDependency).toEqual('0.2.4');
      expect(dependencies.localFile).toEqual('file://../../some/folder');
    });
  });
});

// @ts-ignore
mocha.run((failures: number) => {
  if (failures > 0) Deno.exit(1);
  else Deno.exit(0);
});
