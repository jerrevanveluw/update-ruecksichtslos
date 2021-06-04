import { readFile, writeFile } from 'fs/promises';
import { promisify } from 'util';
import { exec } from 'child_process';
import { join } from 'path';
import { Executor, Reader, Update, Writer } from './update-ruecksichtslos';

const execute = promisify(exec);

const { argv, cwd } = process;

console.log(argv);

const caret = argv.includes('--caret') ? '^' : null;
const tilde = argv.includes('--tilde') ? '~' : null;
if (caret && tilde) console.warn('Warning "--caret" and "--tilde" found as arguments. Picking "--tilde"');
const prefix = tilde ? tilde : caret;

const packageJsonFile = join(cwd(), 'package.json');

const decode = (buffer: Buffer) => buffer.toString('utf-8');

const reader: Reader = () => readFile(packageJsonFile).then(decode).then(JSON.parse);

const executor: Executor = (name: string) =>
  execute(`npm view ${name} versions`)
    .then(({ stdout }: { stdout: string }): string => stdout)
    .then((it: string) => it.replace(/'/g, '"'))
    .then(JSON.parse)
    .then((it: string[]) => [name, it] as const);

const writer: Writer = (data: string) => writeFile(packageJsonFile, data);

Update(reader, executor, writer, prefix);
