import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { transform } from 'esbuild';

const replaceChildrenFallback = `
if (!Element.prototype.replaceChildren) {
  Object.defineProperty(Element.prototype, 'replaceChildren', {
    configurable: true,
    writable: true,
    value: function (...children) {
      const fragment = this.ownerDocument.createDocumentFragment();
      fragment.append(...children);
      this.textContent = '';
      this.appendChild(fragment);
    },
  });
}
`;

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
  const entryPoint = name === 'app.js' || name === 'manage-react.js';
  await writeFile(file, entryPoint ? replaceChildrenFallback + code : code);
}
