'use strict';

const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_TOKEN });

/**
 * 名前から苗字 + 「さん」を生成する
 * 「姓 名」形式（スペース区切り）必須
 * 例:「杉浦 伸太朗」→「杉浦さん」
 * スペースなしの場合は個人情報保護のため「?」を返す
 */
function toDisplayName(name) {
  if (!name) return '?';
  const parts = name.trim().split(/[\s　]+/);
  if (parts.length < 2) return '?'; // スペースなし＝姓名が区別できない
  return `${parts[0]}さん`;
}

/**
 * 日付文字列（YYYY-MM-DD）を日本語表記に変換する
 * 例: 「2026-04-07」→「2026年4月7日（火）」
 * UTC メソッドで処理することでタイムゾーンのズレを防ぐ
 */
function formatDateJa(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const w = days[d.getUTCDay()];
  return `${year}年${month}月${day}日（${w}）`;
}

/**
 * 1件分の Notion ページデータを整形する
 */
async function parsePage(page, today, index) {
  const props = page.properties;

  // 生徒名はリレーション → 紐付き先のページタイトルをAPIで取得
  let fullName = '';
  const relationId = props['生徒名']?.relation?.[0]?.id;
  if (relationId) {
    const studentPage = await notion.pages.retrieve({ page_id: relationId });
    const titleProp = Object.values(studentPage.properties).find(p => p.id === 'title');
    fullName = titleProp?.title?.[0]?.plain_text ?? '';
  }

  const nextDateRaw = props['次回レッスン日']?.date?.start ?? '';
  const lessonDateRaw = props['日付']?.date?.start ?? today;

  return {
    studentInitials: toDisplayName(fullName),
    date: formatDateJa(lessonDateRaw),
    songTitle: props['課題曲']?.rich_text?.[0]?.plain_text ?? '',
    lessonContent: props['本日のレッスン内容']?.rich_text?.[0]?.plain_text ?? '',
    goodPoints: props['今日のよかったところ']?.rich_text?.[0]?.plain_text ?? '',
    improvements: props['もっとよくできる点']?.rich_text?.[0]?.plain_text ?? '',
    nextDate: formatDateJa(nextDateRaw),
    nextLesson: props['次回のレッスン内容']?.title?.[0]?.plain_text ?? '',
    dateSlug: today,
    fileSlug: `${today}-${index + 1}`, // 例: 2026-04-13-1, 2026-04-13-2
  };
}

/**
 * Notion データベースから当日のレッスン記録を全件取得する
 * GitHub Actions は UTC で動作するため、JST (UTC+9) に変換して当日日付を算出する
 */
async function fetchTodayLessons() {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const today = jst.toISOString().split('T')[0];

  // データベースオブジェクトから data_source_id を取得（SDK v5 の仕様）
  const db = await notion.databases.retrieve({
    database_id: process.env.NOTION_DATABASE_ID,
  });
  const dataSourceId = db.data_sources[0].id;

  const response = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter: {
      property: '日付',
      date: { equals: today },
    },
  });

  if (response.results.length === 0) return [];

  // 全件を並列で整形（APIコールを含むため Promise.all を使用）
  const lessons = await Promise.all(
    response.results.map((page, index) => parsePage(page, today, index))
  );

  return lessons;
}

module.exports = { fetchTodayLessons };
