'use strict';

const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_TOKEN });

/**
 * 日本語の名前からイニシャルを生成する
 * 例: 「田中 さくら」→「田.さ」
 */
function toInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.map(p => p.charAt(0)).join('.');
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
 * Notion データベースから当日のレッスン記録を取得する
 * GitHub Actions は UTC で動作するため、JST (UTC+9) に変換して当日日付を算出する
 */
async function fetchTodayLesson() {
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

  if (response.results.length === 0) return null;

  const page = response.results[0];
  const props = page.properties;

  // 生徒名はNotionのタイトル列（rich_textではなくtitle型）
  const fullName = props['生徒名']?.title?.[0]?.plain_text ?? '';
  const nextDateRaw = props['次回レッスン日']?.date?.start ?? '';
  const lessonDateRaw = props['日付']?.date?.start ?? today;

  // デバッグ: 生徒名の生データを確認（型を特定するため）
  console.log('[DEBUG] 生徒名:', JSON.stringify(props['生徒名'] ?? null, null, 2));

  return {
    studentInitials: toInitials(fullName),
    date: formatDateJa(lessonDateRaw),
    songTitle: props['課題曲']?.rich_text?.[0]?.plain_text ?? '',
    lessonContent: props['本日のレッスン内容']?.rich_text?.[0]?.plain_text ?? '',
    goodPoints: props['今日のよかったところ']?.rich_text?.[0]?.plain_text ?? '',
    improvements: props['もっとよくできる点']?.rich_text?.[0]?.plain_text ?? '',
    nextDate: formatDateJa(nextDateRaw),
    nextLesson: props['次回のレッスン内容']?.title?.[0]?.plain_text ?? '',
    dateSlug: today,
  };
}

module.exports = { fetchTodayLesson };
