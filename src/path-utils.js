const path = require('node:path');

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/');
}

function relativePath(rootPath, targetPath) {
  const relative = path.relative(rootPath, targetPath);
  return toPosixPath(relative || '.');
}

function toBrowserUrl(remoteUrl) {
  const value = remoteUrl.trim();

  // git@github.com:owner/repository.git
  const scpStyle = !value.includes('://')
    ? value.match(/^(?:[^@]+@)?([^:/]+):(.+)$/)
    : undefined;
  if (scpStyle) {
    return `https://${scpStyle[1]}/${stripGitSuffix(scpStyle[2])}`;
  }

  try {
    const parsed = new URL(value);
    const repositoryPath = stripGitSuffix(parsed.pathname.replace(/^\/+/, ''));
    if (parsed.protocol === 'ssh:') {
      return `https://${parsed.host}/${repositoryPath}`;
    }
    return `${parsed.protocol}//${parsed.host}/${repositoryPath}`;
  } catch {
    return stripGitSuffix(value);
  }
}

function stripGitSuffix(value) {
  return value.replace(/\.git$/i, '');
}

module.exports = { relativePath, toBrowserUrl };
