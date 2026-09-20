const test = require('node:test');
const assert = require('node:assert/strict');
const { relativePath, toBrowserUrl, toMarkdownLink } = require('../src/path-utils');

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
