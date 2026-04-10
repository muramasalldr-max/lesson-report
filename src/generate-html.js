'use strict';

const fs = require('fs');
const path = require('path');

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * HTMLテンプレートにデータを注入して output/ に保存する
 * プレースホルダー形式: {{key}}
 */
function generateHtml(data) {
  const templatePath = path.join(process.cwd(), 'templates', 'report-template.html');
  let html = fs.readFileSync(templatePath, 'utf8');

  const fields = [
    'studentInitials',
    'date',
    'songTitle',
    'lessonContent',
    'goodPoints',
    'improvements',
    'nextDate',
    'nextLesson',
  ];

  for (const key of fields) {
    html = html.replaceAll(`{{${key}}}`, escapeHtml(data[key] ?? ''));
  }

  const outputDir = path.join(process.cwd(), 'output');
  fs.mkdirSync(outputDir, { recursive: true });

  const outPath = path.join(outputDir, `${data.dateSlug}.html`);
  fs.writeFileSync(outPath, html, 'utf8');

  return outPath;
}

module.exports = { generateHtml };
