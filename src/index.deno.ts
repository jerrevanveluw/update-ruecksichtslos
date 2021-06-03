import { join } from 'https://deno.land/std@0.88.0/path/mod.ts';
import { Executor, Reader, Update, Writer } from './update-ruecksichtslos.ts';

const { args, cwd, readTextFile, run, writeTextFile } = Deno;

const caret = args.includes('--caret') ? '^' : null;
const tilde = args.includes('--tilde') ? '~' : null;
if (caret && tilde) console.warn('Warning "--caret" and "--tilde" found as arguments. Picking "--tilde"');
const prefix = tilde ? tilde : caret;

const packageJsonFile = join(cwd(), './package.json');

const decode = (buffer: Uint8Array) => new TextDecoder('utf-8').decode(buffer);

const reader: Reader = () => readTextFile(packageJsonFile).then(JSON.parse);

const executor: Executor = (name: string) =>
  run({ cmd: ['npm', 'view', name, 'versions'], stdout: 'piped', stderr: 'piped' })
    .output()
    .then(decode)
    .then((it: string) => it.replace(/'/g, '"'))
    .then(JSON.parse)
    .then((it: any) => [name, it] as const);

const writer: Writer = (data: string) => writeTextFile(packageJsonFile, data);

Update(reader, executor, writer, prefix);
