import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { transform } from 'esbuild';

const directory = process.argv[2];
for (const name of await readdir(directory)) {
  if (!name.endsWith('.js')) continue;
  const file = join(directory, name);
  const source = await readFile(file, 'utf8');
  const { code } = await transform(source, {
    target: 'chrome74',
    sourcefile: name,
    legalComments: 'inline',
  });
  await writeFile(file, code);
}
