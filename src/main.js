'use strict';

const { fetchTodayLesson } = require('./fetch-notion');
const { generateHtml }     = require('./generate-html');
const { takeScreenshot }   = require('./take-screenshot');

// LINE 送信は git push 完了後にワークフローの別ステップで行うため
// main.js は Notion 取得 → HTML 生成 → PNG 生成 まで担当する

async function main() {
  console.log('レポート生成を開始します...');

  const data = await fetchTodayLesson();

  if (!data) {
    console.log('本日のレッスン記録が見つかりませんでした。処理をスキップします。');
    process.exit(0);
  }

  console.log(`対象レコード: ${data.studentInitials} / ${data.date}`);

  const htmlPath = await generateHtml(data);
  console.log(`HTML 生成完了: ${htmlPath}`);

  const pngPath = await takeScreenshot(htmlPath, data.dateSlug);
  console.log(`PNG 生成完了: ${pngPath}`);

  console.log('レポート生成が完了しました。');
}

main().catch(err => {
  console.error('エラーが発生しました:', err);
  process.exit(1);
});
