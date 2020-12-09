import { readFile, writeFile } from 'fs/promises';
import { promisify } from 'util';
import { exec } from 'child_process';
import { join } from 'path';
import { Executor, Reader, Update, Writer } from './update-ruecksichtslos';

const execute = promisify(exec);

const packageJsonFile = join(process.cwd(), 'package.json');

const decode = (buffer: Buffer) => buffer.toString('utf-8');

const reader: Reader = () => readFile(packageJsonFile).then(decode).then(JSON.parse);

const executor: Executor = (name: string) =>
  execute(`npm view ${name} versions`)
    .then(({ stdout }: { stdout: string }): string => stdout)
    .then((it: string) => it.replace(/'/g, '"'))
    .then(JSON.parse)
    .then((it: string[]) => [name, it] as const);

const writer: Writer = (data: string) => writeFile(packageJsonFile, data);

Update(reader, executor, writer);
