# Path Copy

Copy file paths and Git repository URLs directly from the VS Code Explorer or editor tabs.

The Japanese edition is included as `README.ja.md`.

Source code and issue tracker: [noritaka1166/vscode-path-copy](https://github.com/noritaka1166/vscode-path-copy)

## Features

Right-click a file or folder and choose **Copy Path or Repository URL…**. A native copy picker opens with the actual value shown on the right of each option.

- Absolute Path
- File Name
- Path Relative to Content Root (the workspace folder in VS Code)
- Path Relative to Repository Root
- Repository URL

Long values are shortened in the picker. Hover the information icon at the right end of an item to see the complete value; clicking that icon copies the value as well.

In a multi-root workspace, the selected item's own workspace folder is used. Git-related entries use the nearest Git repository containing the selected item.

## Localization

English is the default language. The extension also includes Japanese, Simplified Chinese, Korean, French, German, Spanish, and Brazilian Portuguese translations. It automatically follows VS Code's display language.

## Remote URL format

By default, SSH remotes such as `git@github.com:owner/repository.git` are converted into shareable browser URLs such as `https://github.com/owner/repository`.

To copy the Git remote exactly as configured, add this to your settings:

```json
{
  "pathCopy.remoteUrlFormat": "preserve"
}
```

To use a remote other than `origin`:

```json
{
  "pathCopy.remoteName": "upstream"
}
```

## Run locally

1. Open this folder, or its parent `intellj-vscode` folder, in VS Code.
2. Press `F5` (or `fn + F5` if your macOS function keys are configured as media keys) to start an Extension Development Host.
3. Right-click a file or folder in the new window.

## Build a VSIX

```bash
npm install
npx vsce package
```

Install the generated `.vsix` using **Extensions: Install from VSIX...**.
