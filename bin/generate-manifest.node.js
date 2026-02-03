import { exec } from 'node:child_process';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
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

// This is a py file with simple declarations we'll just parse as text.
// This will work unless they make it more complicated in the future and we need Python to parse.
async function getGodotVersion(gitDir) {
  const versionText = String(await readFile(join(gitDir, 'version.py')));
  const lines = versionText.split('\n').filter(Boolean);
  const mapped = lines.reduce((acc, line) => {
    const [key, value] = line.split('=');
    acc[key.trim()] = value.replace(/"/i, '').trim();
    return acc;
  }, {})

  const { major, minor, patch } = mapped;

  return `${major}.${minor}.${patch}`;
}

async function getGodotCommit(gitDir) {
  try {
    return (await execSync(`git rev-parse HEAD`, { cwd: gitDir }))
      .trim();
  } catch (ex) {
    throw new Error(`Could not parse commit in "${gitDir}", \n${ex.stack}`);
  }
}

async function getGodotRepo(gitDir) {
  try {
    return (await execSync(`git remote get-url origin`, { cwd: gitDir }))
      .trim();
  } catch (ex) {
    throw new Error(`Could not parse commit in "${gitDir}", \n${ex.stack}`);
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
  date: new Date().toISOString(),
  version: await getGodotVersion(GIT_DIR),
  commit: await getGodotCommit(GIT_DIR),
  repo: await getGodotRepo(GIT_DIR),
  icons: files.reduce((acc, file) =>
    Object.assign(acc, {
      [basename(file, extname(file))]: {
        path: pathToFileURL(join(ICONS_DIR, file)).toString()
          .replace(pathToFileURL(PROJECT_ROOT).toString(), '')
          .slice(1) // remove the starting slash so it'll be relative
      }
    }),
    {}
  )
};

await writeFile(MANIFEST_PATH, JSON.stringify(manifest), 'utf8');