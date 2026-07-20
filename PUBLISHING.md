# Publishing to the VS Code Marketplace

This extension is prepared to publish as `noritaka1166.path-copy`.

## Before the first publish

1. Open the [Visual Studio Marketplace publisher management page](https://marketplace.visualstudio.com/manage/publishers/).
2. Create or confirm the publisher with ID `noritaka1166`.
3. Create a publishing credential in Azure DevOps. Keep the credential private and never commit it to this repository.
4. Authenticate locally:

   ```bash
   npx vsce login noritaka1166
   ```

## Validate and package

```bash
npm install
npx vsce package
```

`vsce package` runs the `vscode:prepublish` script, which checks JavaScript syntax and runs the unit tests before creating the VSIX.

## Publish

Publish the current version only after manually testing the generated VSIX.

```bash
npx vsce publish
```

For later releases, update `version` in `package.json`, add release notes to `CHANGELOG.md`, then publish the new version.

## Marketplace metadata

The public source repository, issue tracker, and homepage are configured for [noritaka1166/vscode-path-copy](https://github.com/noritaka1166/vscode-path-copy).

A PNG icon of at least 128 × 128 pixels is still recommended for Marketplace presentation. Do not use SVG for the Marketplace icon.
