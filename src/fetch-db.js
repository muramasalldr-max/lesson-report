'use strict';

const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

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
 * music-school の lesson_notes テーブルから当日のレッスン記録を全件取得する
 * GitHub Actions は UTC で動作するため、JST (UTC+9) に変換して当日日付を算出する
 * lesson_notes を students と JOIN して生徒名を取得する
 */
async function fetchTodayLessons() {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const today = jst.toISOString().split('T')[0];

  // lesson_time → created_at の順で安定ソートし、連番（fileSlug）が毎回同じになるようにする
  const rows = await sql`
    SELECT
      s.name             AS student_name,
      ln.date::text      AS lesson_date,
      ln.subject         AS subject,
      ln.lesson_content  AS lesson_content,
      ln.positives       AS positives,
      ln.improvements    AS improvements,
      ln.next_content    AS next_content,
      ln.next_date::text AS next_date
    FROM lesson_notes ln
    JOIN students s ON s.id = ln.student_id
    WHERE ln.date = ${today}
    ORDER BY s.lesson_time NULLS LAST, ln.created_at
  `;

  if (rows.length === 0) return [];

  return rows.map((row, index) => ({
    studentInitials: toDisplayName(row.student_name),
    date: formatDateJa(row.lesson_date),
    songTitle: row.subject ?? '',
    lessonContent: row.lesson_content ?? '',
    goodPoints: row.positives ?? '',
    improvements: row.improvements ?? '',
    nextDate: formatDateJa(row.next_date),
    nextLesson: row.next_content ?? '',
    dateSlug: today,
    fileSlug: `${today}-${index + 1}`, // 例: 2026-04-13-1, 2026-04-13-2
  }));
}

module.exports = { fetchTodayLessons };
