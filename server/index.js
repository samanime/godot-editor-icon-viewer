import { join } from 'node:path';
import express from 'express';
import packageJson from '../package.json' with { type: 'json' };

const { config: { port: PORT, godot: { repo_path: REPO_PATH } } } = packageJson;

const PROJECT_ROOT = join(import.meta.dirname, '..');
const ICON_PATH = join(REPO_PATH, 'icon.svg');

const INDEX_PATH = join(PROJECT_ROOT, 'index.html');
const STATIC_PATHS = {
  '/favicon.ico': ICON_PATH,
  '/icon.svg': ICON_PATH,
  '/manifest.json': 'manifest.json',
  '/client': 'client',
  '/${REPO_PATH}': REPO_PATH
};

STATIC_PATHS[`/${REPO_PATH}`] = REPO_PATH;

const app = express()

for (const [url, dir] of Object.entries(STATIC_PATHS)) {
  console.log(url, join(PROJECT_ROOT, dir))
  app.use(url, express.static(join(PROJECT_ROOT, dir)));
}

app.get('/', (_, res) => {
  res.sendFile(INDEX_PATH);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});