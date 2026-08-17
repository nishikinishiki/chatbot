const fs = require('fs');
const path = require('path');
const { marked } = require('marked'); // ★追加：Markdown変換ツールを読み込む

const currentDir = __dirname;
const items = fs.readdirSync(currentDir);
let successCount = 0;

items.forEach(item => {
    const itemPath = path.join(currentDir, item);

    if (fs.statSync(itemPath).isDirectory()) {
        const draftPath = path.join(itemPath, 'draft.txt');

        if (fs.existsSync(draftPath)) {
            let rawText = fs.readFileSync(draftPath, 'utf-8');

            // 1. [TITLE: 〇〇] のフラグを探してタイトルを抽出する
            let bookTitle = "無題の書籍";
            const titleRegex = /\[TITLE:\s*(.*?)\]/i;
            const titleMatch = rawText.match(titleRegex);

            if (titleMatch) {
                bookTitle = titleMatch[1].trim();
                rawText = rawText.replace(titleRegex, '');
            }

            // 2. ★追加：Markdown（プレーンテキスト）を HTML に一発変換する！
            // この1行で # が <h1> に、改行が <p> に翻訳されます。
            const htmlText = marked.parse(rawText);

            // 3. <h1> か <h2> の直前でページを分割
            // 変換後のHTMLテキスト(htmlText)をターゲットにして分割します
            const pageContents = htmlText
                .split(/(?=<h[12]>)/i)
                .map(text => text.trim())
                .filter(text => text !== '');

            // 4. JSON用のデータを作成
            const bookData = {
                title: bookTitle,
                pages: pageContents.map((content, index) => {
                    return {
                        id: index + 1,
                        content: content
                    };
                })
            };

            // 5. その本のフォルダの中に data.json を出力
            const outputPath = path.join(itemPath, 'data.json');
            fs.writeFileSync(outputPath, JSON.stringify(bookData, null, 2), 'utf-8');

            console.log(`✅ [${item}] の変換完了！ (タイトル: ${bookTitle} / 全${bookData.pages.length}ページ)`);
            successCount++;
        }
    }
});

if (successCount === 0) {
    console.log("⚠️ draft.txt が見つかりませんでした。");
} else {
    console.log(`🎉 合計 ${successCount} 冊の data.json を生成・更新しました！`);
}