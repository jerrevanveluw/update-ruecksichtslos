// @deno-types="https://unpkg.com/@types/mocha@7.0.2/index.d.ts"
import 'https://unpkg.com/mocha@7.2.0/mocha.js';
import { expect } from 'https://deno.land/x/expect@v0.2.6/mod.ts';
import { Package, progressBar, Update } from '../src/update-ruecksichtslos.ts';

const { exit } = Deno;

mocha.setup({ ui: 'bdd', reporter: 'spec' });
mocha.checkLeaks();

const createReader = ({ dependencies, devDependencies, peerDependencies }: Package = {}) => async () => ({
  dependencies,
  devDependencies,
  peerDependencies,
});

const executor = async (name: string, version: string) => [name, version, ['0.0.1', '0.2.4', '1.0.0-rc']] as readonly [string, string, string[]];

const progressBarProvider = progressBar((_: string) => {
});

const checkVersionError = (e: Error) => expect(e.message).toBe('No more versions to check...');

describe('Update your package.json rücksichtslos taking into account', async () => {
  it('dependencies, devDependencies, and peerDependencies', async () => {
    const dependencies = { someDependency: '0.0.1' };
    const devDependencies = { someDevDependency: '0.0.1' };
    const peerDependencies = { somePeerDependency: '0.0.1' };

    await Update(createReader({ dependencies, devDependencies, peerDependencies }), executor, (data: string) => {
      const { dependencies, devDependencies, peerDependencies } = JSON.parse(data);
      expect(dependencies.someDependency).toBe('0.2.4');
      expect(devDependencies.someDevDependency).toBe('^0.2.4');
      expect(peerDependencies.somePeerDependency).toBe('^0.2.4');
    }, progressBarProvider);
  });

  it('undefined dependencies', async () => {
    await Update(createReader(), executor, (data: string) => {
      expect(JSON.parse(data).dependencies).toEqual(undefined);
    }, progressBarProvider);
  });

  it('a "file:" reference', async () => {
    const dependencies = {
      someDependency: '0.0.1',
      localFile: 'file:../../some/folder',
    };

    await Update(createReader({ dependencies }), executor, (data: string) => {
      const { dependencies } = JSON.parse(data);
      expect(dependencies.someDependency).toEqual('0.2.4');
      expect(dependencies.localFile).toEqual('file:../../some/folder');
    }, progressBarProvider);
  });

  it('sorting', async () => {
    const dependencies = {
      someDependencyB: '0.0.1',
      someDependencyA: '0.0.1',
    };

    await Update(createReader({ dependencies }), executor, (data: string) => {
      const { dependencies } = JSON.parse(data);
      const [A, B] = Object.keys(dependencies);
      expect(A).toEqual('someDependencyA');
      expect(B).toEqual('someDependencyB');
    }, progressBarProvider);
  });

  it('removing empty dependency objects', async () => {
    const dependencies = { someDependency: '0.0.1' };
    const devDependencies = {};
    const peerDependencies = {};

    await Update(createReader({ dependencies, devDependencies, peerDependencies }), executor, (data: string) => {
      const { dependencies, devDependencies, peerDependencies } = JSON.parse(data);
      expect(dependencies.someDependency).toEqual('0.2.4');
      expect(devDependencies).toEqual(undefined);
      expect(peerDependencies).toEqual(undefined);
    }, progressBarProvider);
  });

  it('package.json key order', async () => {
    const reader = async () => ({ author: 'John Doe', dependencies: { someDependency: '0.0.1' } });

    await Update(reader, executor, (data: string) => {
      const packageJson = JSON.parse(data);
      const [author, dependencies] = Object.keys(packageJson);
      expect(author).toEqual('author');
      expect(dependencies).toEqual('dependencies');
    }, progressBarProvider);
  });
});

describe('But it could go wrong, for example when', async () => {
  it('there are no versions', async () => {
    Update(
      createReader({ dependencies: { someDependency: '0.0.1' } }),
      async (name: string, version: string) => [name, version, []],
      (_: string) => {
      }, progressBarProvider,
    ).catch(checkVersionError);
  });

  it('there are only versions with text', async () => {
    Update(
      createReader({ dependencies: { someDependency: '0.0.1' } }),
      async (name: string, version: string) => [name, version, ['1.0.0-rc']],
      (_: string) => {
      }, progressBarProvider,
    ).catch(checkVersionError);
  });
});

mocha.run((failures: number) => {
  if (failures > 0) exit(1);
  else exit(0);
});
