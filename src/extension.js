const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const vscode = require('vscode');
const { relativePath, toBrowserUrl } = require('./path-utils');

const execFileAsync = promisify(execFile);
const t = vscode.l10n.t;

function activate(context) {
  const register = (command, handler) => {
    context.subscriptions.push(vscode.commands.registerCommand(command, async (...args) => {
      try {
        await handler(resolveResource(args));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Path Copy: ${message}`);
      }
    }));
  };

  register('pathCopy.copyAbsolutePath', async (resource) => {
    await copy(t('Absolute Path'), resource.fsPath);
  });

  register('pathCopy.showCopyPicker', async (resource) => {
    await showCopyPicker(resource);
  });

  register('pathCopy.copyFileName', async (resource) => {
    await copy(t('File Name'), path.basename(resource.fsPath));
  });

  register('pathCopy.copyWorkspaceRelativePath', async (resource) => {
    const folder = vscode.workspace.getWorkspaceFolder(resource);
    if (!folder) {
      throw new Error(t('The selected file does not belong to an open workspace folder.'));
    }
    await copy(t('Path Relative to Content Root'), relativePath(folder.uri.fsPath, resource.fsPath));
  });

  register('pathCopy.copyRepositoryRelativePath', async (resource) => {
    const root = await gitRoot(resource);
    await copy(t('Path Relative to Repository Root'), relativePath(root, resource.fsPath));
  });

  register('pathCopy.copyRepositoryUrl', async (resource) => {
    const root = await gitRoot(resource);
    const config = vscode.workspace.getConfiguration('pathCopy');
    const remoteName = config.get('remoteName', 'origin');
    const remote = await git(root, ['remote', 'get-url', remoteName]);
    const url = config.get('remoteUrlFormat', 'https') === 'preserve'
      ? remote
      : toBrowserUrl(remote);
    await copy(t('Repository URL'), url);
  });
}

async function showCopyPicker(resource) {
  const quickPick = vscode.window.createQuickPick();
  quickPick.title = t('Copy');
  quickPick.placeholder = t('Select a value to copy');
  quickPick.matchOnDescription = true;
  quickPick.items = await createCopyItems(resource);

  const disposables = [
    quickPick.onDidAccept(async () => {
      const item = quickPick.selectedItems[0] || quickPick.activeItems[0];
      if (!item?.value) {
        return;
      }
      await copy(item.label, item.value);
      quickPick.hide();
    }),
    quickPick.onDidTriggerItemButton(async ({ item }) => {
      // The button's tooltip exposes the complete value; clicking it also copies it.
      await copy(item.label, item.value);
      quickPick.hide();
    }),
    quickPick.onDidHide(() => {
      for (const disposable of disposables) {
        disposable.dispose();
      }
      quickPick.dispose();
    })
  ];

  quickPick.show();
}

async function createCopyItems(resource) {
  const items = [
    pickerItem(t('Absolute Path'), resource.fsPath),
    pickerItem(t('File Name'), path.basename(resource.fsPath)),
    { label: t('Path'), kind: vscode.QuickPickItemKind.Separator }
  ];
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(resource);
  if (workspaceFolder) {
    items.push(pickerItem(
      t('Path Relative to Content Root'),
      relativePath(workspaceFolder.uri.fsPath, resource.fsPath)
    ));
  }

  const repositoryRoot = await findGitRoot(resource);
  if (!repositoryRoot) {
    return items;
  }
  items.push(
    pickerItem(t('Path Relative to Repository Root'), relativePath(repositoryRoot, resource.fsPath)),
    { label: t('Repository'), kind: vscode.QuickPickItemKind.Separator }
  );

  const url = await findRepositoryUrl(repositoryRoot);
  if (url) {
    items.push(pickerItem(t('Repository URL'), url));
  }
  return items;
}

function pickerItem(label, value) {
  return {
    label,
    description: abbreviate(value),
    value,
    buttons: [{ iconPath: new vscode.ThemeIcon('info'), tooltip: value }]
  };
}

function abbreviate(value, limit = 96) {
  return value.length <= limit ? value : `${value.slice(0, limit - 1)}…`;
}

function resolveResource(args) {
  const uri = args.find((arg) => arg instanceof vscode.Uri);
  const resource = uri || vscode.window.activeTextEditor?.document.uri;
  if (!resource || resource.scheme !== 'file') {
    throw new Error(t('Select a local file or folder first.'));
  }
  return resource;
}

async function gitRoot(resource) {
  const workingDirectory = await workingDirectoryFor(resource);
  return git(workingDirectory, ['rev-parse', '--show-toplevel']);
}

async function findGitRoot(resource) {
  try {
    return await gitRoot(resource);
  } catch {
    return undefined;
  }
}

async function findRepositoryUrl(root) {
  try {
    const config = vscode.workspace.getConfiguration('pathCopy');
    const remote = await git(root, ['remote', 'get-url', config.get('remoteName', 'origin')]);
    return config.get('remoteUrlFormat', 'https') === 'preserve' ? remote : toBrowserUrl(remote);
  } catch {
    return undefined;
  }
}

async function workingDirectoryFor(resource) {
  const stat = await vscode.workspace.fs.stat(resource);
  return (stat.type & vscode.FileType.Directory) !== 0
    ? resource.fsPath
    : path.dirname(resource.fsPath);
}

async function git(cwd, args) {
  try {
    const { stdout } = await execFileAsync('git', ['-C', cwd, ...args], { encoding: 'utf8' });
    return stdout.trim();
  } catch {
    throw new Error(t('No Git repository was found for the selected item.'));
  }
}

async function copy(label, value) {
  await vscode.env.clipboard.writeText(value);
  vscode.window.setStatusBarMessage(t('Path Copy: {0} copied', label), 2500);
}

function deactivate() {}

module.exports = { activate, deactivate };
