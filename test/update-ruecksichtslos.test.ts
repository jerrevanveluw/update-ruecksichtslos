// @deno-types="https://unpkg.com/@types/mocha@7.0.2/index.d.ts"
import 'https://unpkg.com/mocha@7.2.0/mocha.js';
import { expect } from 'https://deno.land/x/expect@v0.2.6/mod.ts';

import { Package, Update } from '../src/update-ruecksichtslos.ts';

// @ts-ignore
mocha.setup({ ui: 'bdd', reporter: 'spec' });
// @ts-ignore
mocha.checkLeaks();

const createReader = ({ dependencies, devDependencies, peerDependencies }: Package = {}) => async () => ({
  dependencies,
  devDependencies,
  peerDependencies,
});

const executor = async (name: string) => [name, ['0.0.1', '0.2.4', '1.0.0-rc']] as readonly [string, string[]];

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
      expect(peerDependencies.somePeerDependency).toBe('^0.2.4');
    });
  });

  // @ts-ignore
  it('undefined dependencies', async () => {
    await Update(createReader(), executor, data => {
      expect(JSON.parse(data).dependencies).toEqual(undefined);
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

  // @ts-ignore
  it('sorting', async () => {
    const dependencies = {
      someDependencyB: '0.0.1',
      someDependencyA: '0.0.1',
    };

    await Update(createReader({ dependencies }), executor, data => {
      const { dependencies } = JSON.parse(data);
      const [A, B] = Object.keys(dependencies);
      expect(A).toEqual('someDependencyA');
      expect(B).toEqual('someDependencyB');
    });
  });

  // @ts-ignore
  it('removing empty dependency objects', async () => {
    const dependencies = { someDependency: '0.0.1' };
    const devDependencies = {};
    const peerDependencies = {};

    await Update(createReader({ dependencies, devDependencies, peerDependencies }), executor, data => {
      const { dependencies, devDependencies, peerDependencies } = JSON.parse(data);
      expect(dependencies.someDependency).toEqual('0.2.4');
      expect(devDependencies).toEqual(undefined);
      expect(peerDependencies).toEqual(undefined);
    });
  });

  // @ts-ignore
  it('package.json key order', async () => {
    const reader = async () => ({ author: 'John Doe', dependencies: { someDependency: '0.0.1' } });

    await Update(reader, executor, data => {
      const packageJson = JSON.parse(data);
      const [author, dependencies] = Object.keys(packageJson);
      expect(author).toEqual('author');
      expect(dependencies).toEqual('dependencies');
    });
  });
});

// @ts-ignore
describe('But it could go wrong, for example when', async () => {
  // @ts-ignore
  it('there are no versions', async () => {
    Update(
      createReader({ dependencies: { someDependency: '0.0.1' } }),
      async name => [name, []],
      _ => {},
    ).catch(checkVersionError);
  });

  // @ts-ignore
  it('there are only versions with text', async () => {
    Update(
      createReader({ dependencies: { someDependency: '0.0.1' } }),
      async name => [name, ['1.0.0-rc']],
      _ => {},
    ).catch(checkVersionError);
  });
});

// @ts-ignore
mocha.run((failures: number) => {
  if (failures > 0) Deno.exit(1);
  else Deno.exit(0);
});
