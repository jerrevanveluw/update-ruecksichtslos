// @deno-types="https://unpkg.com/@types/mocha@7.0.2/index.d.ts"
import 'https://unpkg.com/mocha@7.2.0/mocha.js';
import { expect } from 'https://deno.land/x/expect@v0.2.6/mod.ts';

import { Package, Update } from '../src/update-ruecksichtslos.ts';

// @ts-ignore
mocha.setup({ ui: 'bdd', reporter: 'spec' });
// @ts-ignore
mocha.checkLeaks();

const createReader = ({ dependencies, devDependencies, peerDependencies }: Package = {}) => () =>
  Promise.resolve({
    dependencies,
    devDependencies,
    peerDependencies,
  });

const executor = (name: string) => Promise.resolve([name, ['0.0.1', '0.2.4', '1.0.0-rc']] as readonly [string, string[]]);

const checkVersionError = (e: Error) => expect(e.message).toBe('No more versions to check...');

// @ts-ignore
describe('Update your package.json rücksichtslos taking into account', async () => {
  // @ts-ignore
  it('dependencies, devDependencies, and peerDependecies', async () => {
    const dependencies = { someDependency: '0.0.1' };
    const devDependencies = { someDevDependency: '0.0.1' };
    const peerDependencies = { somePeerDependency: '0.0.1' };

    await Update(createReader({ dependencies, devDependencies, peerDependencies }), executor, data => {
      const { dependencies, devDependencies, peerDependencies } = JSON.parse(data);
      expect(dependencies.someDependency).toBe('0.2.4');
      expect(devDependencies.someDevDependency).toBe('^0.2.4');
      expect(peerDependencies.somePeerDependency).toBe('~0.2.4');
    });
  });

  // @ts-ignore
  it('undefined dependencies', async () => {
    await Update(createReader(), executor, data => {
      expect(JSON.parse(data).dependencies).toEqual({});
    });
  });

  // @ts-ignore
  it('a "file:" reference', async () => {
    const dependencies = {
      someDependency: '0.0.1',
      localFile: 'file:../../some/folder',
    };

    await Update(createReader({ dependencies }), executor, data => {
      const { dependencies } = JSON.parse(data);
      expect(dependencies.someDependency).toEqual('0.2.4');
      expect(dependencies.localFile).toEqual('file:../../some/folder');
    });
  });
});

// @ts-ignore
describe('But it could go wrong, for example when', async () => {
  // @ts-ignore
  it('there are no versions', async () => {
    Update(
      createReader({ dependencies: { someDependency: '0.0.1' } }),
      name => Promise.resolve([name, []]),
      _ => {},
    ).catch(checkVersionError);
  });

  // @ts-ignore
  it('there are only versions with text', async () => {
    Update(
      createReader({ dependencies: { someDependency: '0.0.1' } }),
      name => Promise.resolve([name, ['1.0.0-rc']]),
      _ => {},
    ).catch(checkVersionError);
  });
});

// @ts-ignore
mocha.run((failures: number) => {
  if (failures > 0) Deno.exit(1);
  else Deno.exit(0);
});
