import { exec } from 'node:child_process';
import { readdir, writeFile } from 'node:fs/promises';
import { join, relative, basename, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import packageJson from '../package.json' with { type: 'json' };

const { config: { godot: { repo_path: REPO_PATH, commit: COMMIT, icons_path: ICONS_PATH } } } = packageJson;

const PROJECT_ROOT = join(import.meta.dirname, '..');
const GIT_DIR = join(PROJECT_ROOT, REPO_PATH);
const ICONS_DIR = join(GIT_DIR, ICONS_PATH);
const MANIFEST_PATH = join(PROJECT_ROOT, 'manifest.json');

async function execSync(command, options = {}) {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error ?? stderr) {
        reject(new Error(error ?? stderr));
        return;
      }

      resolve(stdout);
    });
  });
}

async function gitPull(gitDir) {
  try {
    await execSync(`git pull`, { cwd: gitDir });
  } catch (ex) {
    throw new Error(`Could not pull ${gitDir}, \n${ex.stack}`);
  }
}

async function gitCheckout(gitDir, commit) {
  try {
    await execSync(`git checkout ${commit} --quiet`, { cwd: gitDir });
  } catch (ex) {
    throw new Error(`Could not checkout "${commit}" in "${gitDir}", \n${ex.stack}`);
  }
}

async function getIcons(iconsDir) {
  try {
    return await readdir(iconsDir, { recursive: true });
  } catch (ex) {
    throw new Error(`Could not read icons directory: ${iconsDir}, \n${ex.stack}`);
  }
}

await gitPull(GIT_DIR)
await gitCheckout(GIT_DIR, COMMIT)

const files = await getIcons(ICONS_DIR);

const manifest = {
  icons: files.reduce((acc, file) =>
    Object.assign(acc, {
      [basename(file, extname(file))]: {
        path: pathToFileURL(join(ICONS_DIR, file)).toString()
          .replace(pathToFileURL(PROJECT_ROOT).toString(), '')
      }
    }),
    {}
  )
};

await writeFile(MANIFEST_PATH, JSON.stringify(manifest), 'utf8');