import { readFile, writeFile } from 'fs/promises';
import { promisify } from 'util';
import { exec } from 'child_process';
import { join } from 'path';
import { progressBar, Update } from './update-ruecksichtslos';

const execute = promisify(exec);

const { argv, cwd, stdout } = process;
const { error, warn } = console;

const caret = argv.includes('--caret') ? '^' : null;
const tilde = argv.includes('--tilde') ? '~' : null;
if (caret && tilde) warn('Warning "--caret" and "--tilde" found as arguments. Picking "--tilde"');
const prefix = tilde ? tilde : caret;

const packageJsonFile = join(cwd(), 'package.json');

const decode = (buffer: Buffer) => buffer.toString('utf-8');

const reader = () => readFile(packageJsonFile).then(decode).then(JSON.parse);

const executor = (name: string) =>
  execute(`npm view ${name} versions --json`)
    .then(({ stdout }: { stdout: string }): string => stdout)
    .then(JSON.parse)
    .then((it: string | string[]) => Array.isArray(it) ? it : [it])
    .then((it: string[]) => [name, it] as const);

const fileWriter = (data: string) => writeFile(packageJsonFile, data);
const stdoutWriter = (data: string) => stdout.write(data);

Update(reader, executor, fileWriter, progressBar(stdoutWriter), prefix).catch(error);
