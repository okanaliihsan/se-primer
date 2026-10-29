// app/ klasöründen tek dosyalık, tam HTML belgesi üretir: dist/index.html
// (GitHub Pages, AI Studio'ya yükleme ve Cypress için).
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, 'app', f), 'utf8');
let html = read('index.html');
for (const f of ['story.js', 'tutor.js', 'app.js']) {
  html = html.replace(`<script src="${f}"></script>`, () => `<script>\n${read(f)}\n</script>`);
}
const doc = `<!doctype html>\n<html lang="tr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${html.replace('<div id="app"', '</head>\n<body>\n<div id="app"')}\n</body>\n</html>\n`;
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'index.html'), doc);
console.log('dist/index.html', (doc.length / 1024).toFixed(1) + ' KB');
