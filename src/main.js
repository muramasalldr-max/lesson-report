'use strict';

const { fetchTodayLessons } = require('./fetch-notion');
const { generateHtml }      = require('./generate-html');
const { takeScreenshot }    = require('./take-screenshot');

// LINE 送信は git push 完了後にワークフローの別ステップで行うため
// main.js は Notion 取得 → HTML 生成 → PNG 生成 まで担当する

async function main() {
  console.log('レポート生成を開始します...');

  const lessons = await fetchTodayLessons();

  if (lessons.length === 0) {
    console.log('本日のレッスン記録が見つかりませんでした。処理をスキップします。');
    process.exit(0);
  }

  console.log(`本日の対象: ${lessons.length}件`);

  for (const data of lessons) {
    console.log(`処理中: ${data.studentInitials} / ${data.date}`);

    const htmlPath = generateHtml(data);
    console.log(`HTML 生成完了: ${htmlPath}`);

    const pngPath = await takeScreenshot(htmlPath, data.fileSlug);
    console.log(`PNG 生成完了: ${pngPath}`);
  }

  console.log('全レポートの生成が完了しました。');
}

main().catch(err => {
  console.error('エラーが発生しました:', err);
  process.exit(1);
});
