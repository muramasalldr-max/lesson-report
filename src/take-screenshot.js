'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * 生成した HTML ファイルを Playwright で読み込み、
 * .card-root 要素のみを PNG としてキャプチャする
 */
async function takeScreenshot(htmlPath, dateSlug) {
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage();

    // 縦長スマホ幅に固定、高さは内容が長くても全体を収めるよう大きめに設定
    await page.setViewportSize({ width: 390, height: 1800 });

    const html = fs.readFileSync(htmlPath, 'utf8');

    // Tailwind CDN・Google Fonts を排除済みのため domcontentloaded で十分
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    const outputDir = path.join(process.cwd(), 'output');
    const pngPath = path.join(outputDir, `${dateSlug}.png`);

    // カードルート要素のみをキャプチャ（背景余白を含まない）
    const card = page.locator('.card-root');
    await card.screenshot({ path: pngPath });

    return pngPath;
  } finally {
    await browser.close();
  }
}

module.exports = { takeScreenshot };
