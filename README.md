# Godot Editor Icon Browser

This tool is designed to present all the Godot editor icons in filterable and easy-to-browse manner.

## Requirements

- Git 1.7.0+ (when `git sparse-checkout` was added)
- Node.js 18+

## Usages

### Serving

You can statically serve the viewer by making the following files available:

* `index.html`
* `manifest.json`
* `client/`
* The directory referenced by `config.godot.repo_path`, containing `config.godot.icons_path` (default: `godot/`)

You can also use the mini-Express server by running:

```
npm install
npm start
```

### Updating the Icons

This will pull the latest version of Godot (to the branch specified in `package.json/config.godot-branch`)
and generate the `manifest.json` file that the client uses.

```
npm run icons:update
```

## Configuration

The configuration is in the `config` portion of `package.json`.

### godot.commit

The commit in the Godot repo.

* Default: `"master"`
* Value: Any value that can be given to `git checkout`

### godot.repo_path

The folder of the cloned Godot repo

* Default: `"godot"`
* Value: The path to the folder with the cloned Godot repo

### godot.icons_path

The path to the icons within the Godot repo (relative to `godot.repo_path`).

* Default: `"editor/icons"`
* Value: The path to the folder with the icons

### port

The port to run the server on.

* Default: `8000`
* Value: Any available port Number