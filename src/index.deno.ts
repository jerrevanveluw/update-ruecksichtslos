import { join } from 'https://deno.land/std@0.88.0/path/mod.ts';
import { Executor, Reader, Update, Writer } from './update-ruecksichtslos.ts';

const packageJsonFile = join(Deno.cwd(), './package.json');

const decode = (buffer: Uint8Array) => new TextDecoder('utf-8').decode(buffer);

const reader: Reader = () => Deno.readTextFile(packageJsonFile).then(JSON.parse);

const executor: Executor = name =>
  Deno.run({ cmd: ['npm', 'view', name, 'versions'], stdout: 'piped', stderr: 'piped' })
    .output()
    .then(decode)
    .then((it: string) => it.replace(/'/g, '"'))
    .then(JSON.parse)
    .then(it => [name, it] as const);

const writer: Writer = data => Deno.writeTextFile(packageJsonFile, data);

Update(reader, executor, writer);
