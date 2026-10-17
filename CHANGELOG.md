# Changelog

All notable changes to Path Copy are documented in this file.

## 0.2.0 - 2026-10-17

Feature release.

- Add code position copying with one-based line and column numbers.
- Add relative Markdown links and commit-pinned GitHub and GitLab links, including selected line ranges.
- Add batch copying for multiple selected files and folders as lines, JSON, or Markdown.
- Add configurable copy templates with path, repository, commit, and editor selection variables.
- Improve Git error messages to distinguish unavailable Git, permission errors, missing repositories, and unconfigured remotes.
- Add Biome linting and formatting tools, a security policy, and update `@vscode/vsce` to 4.0.0.

## 0.1.1 - 2026-08-30

Dependency maintenance release.

- Update `@vscode/vsce` from 3.7.1 to 3.9.2.
- Update transitive dependencies: `undici` to 7.29.0, `fast-uri` to 3.1.5, `js-yaml` to 4.3.1, and `brace-expansion` to 5.0.9.
- Refresh the dependency lockfile, including the updated Node.js engine compatibility for `brace-expansion`.

## 0.1.0 - 2026-07-20

Initial Marketplace release.

- Copy absolute paths, file names, workspace-relative paths, repository-relative paths, and repository URLs.
- Add Explorer and editor-tab context menu support.
- Show a native copy picker with abbreviated values and full-value tooltips.
- Support English, Japanese, Simplified Chinese, Korean, French, German, Spanish, and Brazilian Portuguese.
