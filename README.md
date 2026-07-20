# Path Copy

![Path Copy icon](assets/path-copy-icon.png)

**Copy the right file path or Git repository URL without leaving VS Code.**

Path Copy adds an IntelliJ-style copy picker to the Explorer and editor tabs. See the exact value before copying an absolute path, workspace path, repository path, file name, or repository URL.

[日本語版](README.ja.md) · [Report an issue](https://github.com/noritaka1166/vscode-path-copy/issues) · [Source code](https://github.com/noritaka1166/vscode-path-copy)

## Why Path Copy?

- **Choose the right reference every time** — see the value beside each copy option before you copy it.
- **Share code locations faster** — copy a path or repository URL directly from a file or folder's context menu.
- **Works with real project layouts** — resolves the selected item's workspace folder and nearest Git repository, including multi-root workspaces.
- **No account or network access required** — paths and Git remotes are read locally; the extension has no telemetry.

## Get started

1. Install **Path Copy** from the VS Code Marketplace.
2. Right-click a file or folder in the Explorer, or right-click an editor tab.
3. Select **Copy Path or Repository URL…**.
4. Choose the value you need. It is copied immediately.

Long values are shortened in the picker. Hover the information icon on the right of an option to see its complete value; clicking the icon copies it too.

## What can I copy?

| Copy option | Useful when you need… |
| --- | --- |
| Absolute Path | a local path for a terminal command, script, or operating-system dialog |
| File Name | just the selected file or folder name |
| Path Relative to Content Root | a path from the current VS Code workspace folder |
| Path Relative to Repository Root | a stable project-relative reference for documentation, issues, or reviews |
| Repository URL | a link to the selected item's Git repository |

Git-related options use the nearest repository containing the selected item. In multi-root workspaces, Path Copy uses the selected item's own workspace folder.

## Repository URL format

By default, SSH remotes such as `git@github.com:owner/repository.git` become shareable browser URLs such as `https://github.com/owner/repository`.

To copy the configured Git remote without changing it:

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

## Languages

Path Copy follows your VS Code display language. English is the default, with Japanese, Simplified Chinese, Korean, French, German, Spanish, and Brazilian Portuguese included.

## Requirements

- VS Code 1.85 or later
- Git is required only for repository-relative paths and repository URLs

## Contributing and support

Bug reports and feature requests are welcome in the [issue tracker](https://github.com/noritaka1166/vscode-path-copy/issues). See the [repository](https://github.com/noritaka1166/vscode-path-copy) for local development and packaging instructions.

## License

[MIT](LICENSE)
