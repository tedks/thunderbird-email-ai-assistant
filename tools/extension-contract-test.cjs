const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.dirname(__dirname);
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const webpack = require(path.join(root, 'webpack.config.js'));

assert.equal(webpack.output.filename, '[name]-bundle.js');
assert.deepEqual(Object.keys(webpack.entry).sort(), ['background', 'options']);

for (const [name, page] of [
  ['background', manifest.background.page],
  ['options', manifest.options_ui.page],
]) {
  assert.equal(page, `${name}.html`);
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)]
    .map(match => match[1]);
  assert.deepEqual(scripts, [`${name}-bundle.js`]);
  assert.ok(fs.existsSync(path.join(root, webpack.entry[name])));

  for (const match of html.matchAll(/<link\b[^>]*\bhref=["']([^"']+)["']/gi)) {
    const asset = match[1];
    assert.equal(path.basename(asset), asset, `nonlocal asset: ${asset}`);
    assert.ok(fs.existsSync(path.join(root, asset)), `missing asset: ${asset}`);
  }
}

console.log('Extension manifest, pages, bundle names, and local assets agree');
