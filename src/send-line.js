'use strict';

/**
 * LINE Messaging API の push メッセージで画像を送信する
 * imageUrls: 送信する画像URLの配列（複数対応）
 * LINE は1リクエストで最大5メッセージまで送れるため、5件ずつバッチに分けて送信する
 */
async function sendLine(imageUrls) {
  const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];

  // 5件ずつのバッチに分割
  const batches = [];
  for (let i = 0; i < urls.length; i += 5) {
    batches.push(urls.slice(i, i + 5));
  }

  for (const batch of batches) {
    const messages = batch.map(url => ({
      type: 'image',
      originalContentUrl: url,
      previewImageUrl: url,
    }));

    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: process.env.LINE_USER_ID,
        messages,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`LINE API エラー: ${res.status} ${body}`);
    }

    console.log(`LINE 送信完了: ${batch.length}件`);
  }
}

module.exports = { sendLine };
