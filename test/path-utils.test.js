const test = require('node:test');
const assert = require('node:assert/strict');
const {
  relativePath,
  toBrowserUrl,
  toMarkdownLink,
  toPermanentGitUrl,
  toPathList
} = require('../src/path-utils');

test('relativePath returns a slash-separated relative path', () => {
  assert.equal(relativePath('/project', '/project/src/index.js'), 'src/index.js');
});

test('toBrowserUrl normalizes common SSH and HTTPS Git remotes', () => {
  assert.equal(toBrowserUrl('git@github.com:octo/example.git'), 'https://github.com/octo/example');
  assert.equal(toBrowserUrl('ssh://git@gitlab.example.com/team/project.git'), 'https://gitlab.example.com/team/project');
  assert.equal(toBrowserUrl('https://github.com/octo/example.git'), 'https://github.com/octo/example');
});

test('toMarkdownLink creates a relative Markdown link and safely encodes special characters', () => {
  assert.equal(toMarkdownLink('src/extension.js'), '[src/extension.js](src/extension.js)');
  assert.equal(
    toMarkdownLink('docs/Release [notes] #1 (draft).md'),
    '[docs/Release \\[notes\\] #1 (draft).md](docs/Release%20%5Bnotes%5D%20%231%20%28draft%29.md)'
  );
});

test('toPermanentGitUrl creates commit-pinned GitHub and GitLab links with line ranges', () => {
  assert.equal(
    toPermanentGitUrl('git@github.com:octo/example.git', 'a1b2c3d', 'src/extension.js', {
      startLine: 10,
      endLine: 12
    }),
    'https://github.com/octo/example/blob/a1b2c3d/src/extension.js#L10-L12'
  );
  assert.equal(
    toPermanentGitUrl('ssh://git@gitlab.example.com/team/project.git', 'a1b2c3d', 'src/path utils.js', {
      startLine: 4,
      endLine: 7
    }),
    'https://gitlab.example.com/team/project/-/blob/a1b2c3d/src/path%20utils.js#L4-7'
  );
});

test('toPermanentGitUrl creates a commit-pinned directory link without a line anchor', () => {
  assert.equal(
    toPermanentGitUrl('https://github.com/octo/example.git', 'a1b2c3d', 'docs', { isDirectory: true }),
    'https://github.com/octo/example/tree/a1b2c3d/docs'
  );
});

test('toPathList formats relative paths as lines, JSON, or a Markdown list', () => {
  const paths = ['src/extension.js', 'docs/path`notes.md'];
  assert.equal(toPathList(paths, 'lines'), 'src/extension.js\ndocs/path`notes.md');
  assert.equal(toPathList(paths, 'json'), '[\n  "src/extension.js",\n  "docs/path`notes.md"\n]');
  assert.equal(toPathList(paths, 'markdown'), '- `src/extension.js`\n- `docs/path\\`notes.md`');
});
