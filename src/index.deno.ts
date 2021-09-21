import { join } from 'https://deno.land/std@0.88.0/path/mod.ts';
import { progressBar, Update } from './update-ruecksichtslos.ts';

const { args, cwd, readTextFile, run, stdout, writeTextFile } = Deno;
const { error, warn } = console;

const caret = args.includes('--caret') ? '^' : null;
const tilde = args.includes('--tilde') ? '~' : null;
if (caret && tilde) warn('Warning "--caret" and "--tilde" found as arguments. Picking "--tilde"');
const prefix = tilde ? tilde : caret;

const packageJsonFile = join(cwd(), './package.json');

const decode = (buffer: Uint8Array) => new TextDecoder('utf-8').decode(buffer);

const encode = (string: string) => new TextEncoder().encode(string);

const reader = () => readTextFile(packageJsonFile).then(JSON.parse);

const executor = (name: string) =>
  run({ cmd: ['npm', 'view', name, 'versions'], stdout: 'piped', stderr: 'piped' })
    .output()
    .then(decode)
    .then((it: string) => it.replace(/'/g, '"'))
    .then((it: string) => it[0] === '[' ? it : `["${it}"]`)
    .then(JSON.parse)
    .then((it: any) => [name, it] as const);

const fileWriter = (data: string) => writeTextFile(packageJsonFile, data);

const stdoutWriter = (data: string) => stdout.write(encode(data));

Update(reader, executor, fileWriter, progressBar(stdoutWriter), prefix).catch(error);
