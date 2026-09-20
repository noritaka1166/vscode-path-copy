const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const vscode = require('vscode');
const {
  relativePath,
  toBrowserUrl,
  toMarkdownLink,
  toPermanentGitUrl,
  toPathList,
  templatePlaceholders,
  renderTemplate
} = require('./path-utils');

const execFileAsync = promisify(execFile);
const t = vscode.l10n.t;
const TEMPLATE_VARIABLES = new Set([
  'absolutePath',
  'fileName',
  'path',
  'workspacePath',
  'repositoryPath',
  'repoUrl',
  'commit',
  'line',
  'endLine'
]);

function activate(context) {
  const register = (command, handler, resourceResolver = resolveResource) => {
    context.subscriptions.push(vscode.commands.registerCommand(command, async (...args) => {
      try {
        await handler(resourceResolver(args));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Path Copy: ${message}`);
      }
    }));
  };

  register('pathCopy.copyAbsolutePath', async (resource) => {
    await copy(t('Absolute Path'), resource.fsPath);
  });

  register('pathCopy.showCopyPicker', async (resources) => {
    if (resources.length > 1) {
      await showBatchCopyPicker(resources);
      return;
    }
    await showCopyPicker(resources[0]);
  }, resolveResources);

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

  register('pathCopy.copyMarkdownLink', async (resource) => {
    const root = await markdownLinkRoot(resource);
    await copy(t('Markdown Link'), toMarkdownLink(relativePath(root, resource.fsPath)));
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

  register('pathCopy.copyPermanentGitLink', async (resource) => {
    const root = await gitRoot(resource);
    await copy(t('Permanent Git Link'), await permanentGitLink(resource, root));
  });

  register('pathCopy.copyRelativePathsLines', async (resources) => {
    await copy(t('Relative Paths (Lines)'), toPathList(workspaceRelativePaths(resources), 'lines'));
  }, resolveResources);

  register('pathCopy.copyRelativePathsJson', async (resources) => {
    await copy(t('Relative Paths (JSON)'), toPathList(workspaceRelativePaths(resources), 'json'));
  }, resolveResources);

  register('pathCopy.copyRelativePathsMarkdown', async (resources) => {
    await copy(
      t('Relative Paths (Markdown List)'),
      toPathList(workspaceRelativePaths(resources), 'markdown')
    );
  }, resolveResources);
}

async function showCopyPicker(resource) {
  await showPicker(await createCopyItems(resource));
}

async function showBatchCopyPicker(resources) {
  const relativePaths = workspaceRelativePaths(resources);
  await showPicker([
    pickerItem(t('Relative Paths (Lines)'), toPathList(relativePaths, 'lines')),
    pickerItem(t('Relative Paths (JSON)'), toPathList(relativePaths, 'json')),
    pickerItem(t('Relative Paths (Markdown List)'), toPathList(relativePaths, 'markdown'))
  ]);
}

async function showPicker(items) {
  const quickPick = vscode.window.createQuickPick();
  quickPick.title = t('Copy');
  quickPick.placeholder = t('Select a value to copy');
  quickPick.matchOnDescription = true;
  quickPick.items = items;

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
  const markdownRoot = repositoryRoot || workspaceFolder?.uri.fsPath;
  if (markdownRoot) {
    items.push(pickerItem(
      t('Markdown Link'),
      toMarkdownLink(relativePath(markdownRoot, resource.fsPath))
    ));
  }
  const templateItems = await createTemplateItems(resource, workspaceFolder, repositoryRoot);
  if (templateItems.length) {
    items.push(
      { label: t('Custom Templates'), kind: vscode.QuickPickItemKind.Separator },
      ...templateItems
    );
  }
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
  const permanentLink = await findPermanentGitLink(resource, repositoryRoot);
  if (permanentLink) {
    items.push(pickerItem(t('Permanent Git Link'), permanentLink));
  }
  return items;
}

async function createTemplateItems(resource, workspaceFolder, repositoryRoot) {
  const templates = configuredTemplates();
  if (!templates.length) {
    return [];
  }
  const requiredVariables = new Set(templates.flatMap((template) => templatePlaceholders(template.template)));
  const variables = await templateVariables(resource, workspaceFolder, repositoryRoot, requiredVariables);
  return templates
    .filter((template) => canRenderTemplate(template.template, variables))
    .map((template) => pickerItem(template.name, renderTemplate(template.template, variables)));
}

function configuredTemplates() {
  const templates = vscode.workspace.getConfiguration('pathCopy').get('copyTemplates', []);
  if (!Array.isArray(templates)) {
    return [];
  }
  return templates.filter((template) => (
    template
    && typeof template.name === 'string'
    && template.name.trim()
    && typeof template.template === 'string'
  ));
}

async function templateVariables(resource, workspaceFolder, repositoryRoot, requiredVariables) {
  const workspacePath = workspaceFolder
    ? relativePath(workspaceFolder.uri.fsPath, resource.fsPath)
    : undefined;
  const repositoryPath = repositoryRoot
    ? relativePath(repositoryRoot, resource.fsPath)
    : undefined;
  const lineRange = selectedLineRange(resource);
  const variables = {
    absolutePath: resource.fsPath,
    fileName: path.basename(resource.fsPath),
    path: repositoryPath || workspacePath,
    workspacePath,
    repositoryPath,
    line: lineRange?.startLine,
    endLine: lineRange?.endLine
  };
  if (!repositoryRoot) {
    return variables;
  }
  const config = vscode.workspace.getConfiguration('pathCopy');
  if (requiredVariables.has('repoUrl')) {
    try {
      const remote = await git(repositoryRoot, ['remote', 'get-url', config.get('remoteName', 'origin')]);
      variables.repoUrl = toBrowserUrl(remote);
    } catch {
      // Templates that require the remote URL remain hidden when it cannot be resolved.
    }
  }
  if (requiredVariables.has('commit')) {
    try {
      variables.commit = await git(repositoryRoot, ['rev-parse', 'HEAD']);
    } catch {
      // Templates that require the commit remain hidden when it cannot be resolved.
    }
  }
  return variables;
}

function canRenderTemplate(template, variables) {
  return templatePlaceholders(template).every((placeholder) => (
    !TEMPLATE_VARIABLES.has(placeholder) || variables[placeholder] !== undefined
  ));
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
  return resolveResources(args)[0];
}

function resolveResources(args) {
  const resources = args.flatMap(findUris);
  if (!resources.length && vscode.window.activeTextEditor?.document.uri) {
    resources.push(vscode.window.activeTextEditor.document.uri);
  }
  const localResources = resources.filter((resource) => resource.scheme === 'file');
  if (!localResources.length) {
    throw new Error(t('Select a local file or folder first.'));
  }
  return [...new Map(localResources.map((resource) => [resource.toString(), resource])).values()];
}

function findUris(value) {
  if (value instanceof vscode.Uri) {
    return [value];
  }
  return Array.isArray(value) ? value.flatMap(findUris) : [];
}

function workspaceRelativePaths(resources) {
  return resources.map((resource) => {
    const folder = vscode.workspace.getWorkspaceFolder(resource);
    if (!folder) {
      throw new Error(t('The selected file does not belong to an open workspace folder.'));
    }
    return relativePath(folder.uri.fsPath, resource.fsPath);
  });
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

async function markdownLinkRoot(resource) {
  const repositoryRoot = await findGitRoot(resource);
  if (repositoryRoot) {
    return repositoryRoot;
  }
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(resource);
  if (workspaceFolder) {
    return workspaceFolder.uri.fsPath;
  }
  throw new Error(t('The selected file does not belong to an open workspace folder or Git repository.'));
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

async function findPermanentGitLink(resource, root) {
  try {
    return await permanentGitLink(resource, root);
  } catch {
    return undefined;
  }
}

async function permanentGitLink(resource, root) {
  const config = vscode.workspace.getConfiguration('pathCopy');
  const remote = await git(root, ['remote', 'get-url', config.get('remoteName', 'origin')]);
  const revision = await git(root, ['rev-parse', 'HEAD']);
  const stat = await vscode.workspace.fs.stat(resource);
  const lineRange = isDirectory(stat.type) ? undefined : selectedLineRange(resource);
  return toPermanentGitUrl(remote, revision, relativePath(root, resource.fsPath), {
    isDirectory: isDirectory(stat.type),
    ...lineRange
  });
}

async function workingDirectoryFor(resource) {
  const stat = await vscode.workspace.fs.stat(resource);
  return isDirectory(stat.type)
    ? resource.fsPath
    : path.dirname(resource.fsPath);
}

function isDirectory(fileType) {
  const directoryTypes = [
    vscode.FileType.Directory,
    vscode.FileType.Directory + vscode.FileType.SymbolicLink
  ];
  return directoryTypes.includes(fileType);
}

function selectedLineRange(resource) {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.uri.fsPath !== resource.fsPath) {
    return undefined;
  }
  const { selection } = editor;
  const startLine = selection.start.line + 1;
  if (selection.isEmpty) {
    return { startLine };
  }
  const endLine = selection.end.line + 1 - (selection.end.character === 0 ? 1 : 0);
  return { startLine, endLine };
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

module.exports = { activate };
