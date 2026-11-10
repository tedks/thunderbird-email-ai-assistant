const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.dirname(__dirname);
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const webpack = require(path.join(root, 'webpack.config.js'));

assert.equal(webpack.output.filename, '[name]-bundle.js');
assert.equal(webpack.output.path, root);
assert.deepEqual(Object.keys(webpack.entry).sort(), ['background', 'options']);

for (const [name, page] of [
  ['background', manifest.background.page],
  ['options', manifest.options_ui.page],
]) {
  assert.equal(page, `${name}.html`, `${name} manifest page`);
  const html = fs.readFileSync(path.join(root, page), 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '');
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)]
    .map(match => match[1]);
  assert.deepEqual(scripts, [`${name}-bundle.js`], `${name} bundle reference`);
  const entry = path.resolve(root, webpack.entry[name]);
  assert.equal(entry, path.join(root, `${name}.js`), `${name} source entry`);
  assert.ok(fs.existsSync(entry), `missing entry: ${webpack.entry[name]}`);

  for (const tag of html.matchAll(/<link\b[^>]*>/gi)) {
    if (!/\brel=["']stylesheet["']/i.test(tag[0])) continue;
    const href = tag[0].match(/\bhref=["']([^"']+)["']/i);
    assert.ok(href, `${name} stylesheet link has no href`);
    const asset = href[1];
    const assetPath = path.resolve(root, asset);
    assert.ok(assetPath.startsWith(root + path.sep), `nonlocal asset: ${asset}`);
    assert.ok(fs.existsSync(assetPath), `missing asset: ${asset}`);
  }
}

console.log('Extension manifest, pages, bundle names, and local assets agree');
