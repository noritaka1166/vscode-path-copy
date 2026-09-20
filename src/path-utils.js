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

function toMarkdownLink(relativeFilePath) {
  const label = relativeFilePath.replace(/([\\[\]])/g, '\\$1');
  const destination = relativeFilePath
    .split('/')
    .map(encodePathSegment)
    .join('/');
  return `[${label}](${destination})`;
}

function toPermanentGitUrl(remoteUrl, revision, repositoryPath, options = {}) {
  const url = new URL(toBrowserUrl(remoteUrl));
  const isGitLab = /(^|[.-])gitlab(?:[.-]|$)/i.test(url.hostname);
  const view = options.isDirectory ? 'tree' : 'blob';
  const filePath = repositoryPath === '.'
    ? ''
    : `/${repositoryPath.split('/').map(encodePathSegment).join('/')}`;
  const separator = isGitLab ? '/-/' : '/';
  url.pathname = `${url.pathname.replace(/\/+$/, '')}${separator}${view}/${encodePathSegment(revision)}${filePath}`;
  if (!options.isDirectory && options.startLine) {
    const lineRange = options.endLine && options.endLine !== options.startLine
      ? isGitLab
        ? `L${options.startLine}-${options.endLine}`
        : `L${options.startLine}-L${options.endLine}`
      : `L${options.startLine}`;
    url.hash = lineRange;
  }
  return url.toString();
}

function encodePathSegment(segment) {
  return encodeURIComponent(segment).replace(/[!'()*]/g, (character) => (
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  ));
}

function stripGitSuffix(value) {
  return value.replace(/\.git$/i, '');
}

module.exports = { relativePath, toBrowserUrl, toMarkdownLink, toPermanentGitUrl };
