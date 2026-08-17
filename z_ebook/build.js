const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const currentDir = __dirname;
const items = fs.readdirSync(currentDir);
let successCount = 0;

items.forEach(item => {
    const itemPath = path.join(currentDir, item);

    if (fs.statSync(itemPath).isDirectory()) {
        const draftPath = path.join(itemPath, 'draft.txt');

        if (fs.existsSync(draftPath)) {
            let rawText = fs.readFileSync(draftPath, 'utf-8');

            // 1. 各種フラグの抽出
            let bookTitle = "無題の書籍";
            let bookDate = "発行日未定";
            let bookCover = "";
            let bookThumb = "";

            // 正規表現で抽出＆削除をサクッと行う関数
            const extractTag = (tag) => {
                const regex = new RegExp(`\\[${tag}:\\s*(.*?)\\]`, 'i');
                const match = rawText.match(regex);
                if (match) {
                    rawText = rawText.replace(regex, ''); // 本文から削除
                    return match[1].trim();
                }
                return "";
            };

            bookTitle = extractTag("TITLE") || bookTitle;
            bookDate = extractTag("DATE") || bookDate;
            bookCover = extractTag("COVER");
            bookThumb = extractTag("THUMB") || bookCover; // THUMBが無ければCOVERを使い回す

            // 2. MarkdownをHTMLに変換
            const htmlText = marked.parse(rawText);

            // 3. ページ分割
            const pageContents = htmlText
                .split(/(?=<h[12]>)/i)
                .map(text => text.trim())
                .filter(text => text !== '');

            // 4. JSONデータの構築
            const pages = [];

            // ★ 表紙画像が指定されていれば、自動的に1ページ目として生成
            if (bookCover) {
                pages.push({
                    id: 1,
                    content: `<div class="cover-image-container"><img src="${bookCover}" alt="表紙画像"></div>`
                });
            }

            // 本文を後ろに追加していく
            pageContents.forEach((content) => {
                pages.push({
                    id: pages.length + 1,
                    content: content
                });
            });

            const bookData = {
                title: bookTitle,
                date: bookDate,
                cover: bookCover,
                thumb: bookThumb,
                pages: pages
            };

            // 5. data.json 出力
            const outputPath = path.join(itemPath, 'data.json');
            fs.writeFileSync(outputPath, JSON.stringify(bookData, null, 2), 'utf-8');

            console.log(`✅ [${item}] 変換完了！(全${pages.length}ページ)`);
            successCount++;
        }
    }
});

if (successCount === 0) console.log("⚠️ draft.txt が見つかりませんでした。");
else console.log(`🎉 合計 ${successCount} 冊の data.json を生成・更新しました！`);