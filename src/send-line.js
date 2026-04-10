'use strict';

/**
 * LINE Messaging API の push メッセージで画像を送信する
 * 画像は公開 HTTPS URL である必要がある
 */
async function sendLine(imageUrl) {
  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      to: process.env.LINE_USER_ID,
      messages: [
        {
          type: 'image',
          originalContentUrl: imageUrl,
          previewImageUrl: imageUrl,
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LINE API エラー: ${res.status} ${body}`);
  }

  console.log('LINE 送信完了:', imageUrl);
}

module.exports = { sendLine };
