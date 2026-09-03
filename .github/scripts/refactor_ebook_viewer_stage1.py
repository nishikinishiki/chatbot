from pathlib import Path

path = Path("zz_ebook/shared/viewer.js")
viewer = path.read_text(encoding="utf-8")


def replace_once(old, new, label):
    global viewer
    if viewer.count(old) != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {viewer.count(old)}")
    viewer = viewer.replace(old, new, 1)


# 1) Centralize heading DOM creation so H3 can be added in stage 2 without
# repeating pagination logic.
old = '''    function createInlineTextElement(tag, text, className = "") {
        const element = document.createElement(tag);
        if (className) element.className = className;
        appendInlineText(element, text);
        return element;
    }

    function createParagraph(text, continuation = false) {
'''
new = '''    function createInlineTextElement(tag, text, className = "") {
        const element = document.createElement(tag);
        if (className) element.className = className;
        appendInlineText(element, text);
        return element;
    }

    function createHeading(level, text) {
        return createInlineTextElement(`h${level}`, text);
    }

    function createParagraph(text, continuation = false) {
'''
replace_once(old, new, "createHeading insertion")


# 2) Centralize trailing-heading protection. Keep stage-1 behavior identical:
# only H2 participates for now. Stage 2 can expand this helper to H3/H1.
old = '''    function moveBlockToNewPage(node, chapterIndex) {
        node.remove();
        commitMeasuredPage(chapterIndex);
        els.measureBody.appendChild(node);
    }

    function paginateImageBlock(block, chapterIndex) {
'''
new = '''    function moveBlockToNewPage(node, chapterIndex) {
        node.remove();
        commitMeasuredPage(chapterIndex);
        els.measureBody.appendChild(node);
    }

    function isTrailingHeading(element) {
        return element?.tagName === "H2";
    }

    function moveTrailingHeadingToNewPage(chapterIndex) {
        const heading = els.measureBody.lastElementChild;
        if (!isTrailingHeading(heading)) return false;

        moveBlockToNewPage(heading, chapterIndex);
        return true;
    }

    function paginateImageBlock(block, chapterIndex) {
'''
replace_once(old, new, "heading pagination helpers")

old = '''            if (fittingLength === 0) {
                const trailingHeading = els.measureBody.lastElementChild;

                if (trailingHeading?.tagName === "H2") {
                    moveBlockToNewPage(trailingHeading, chapterIndex);
                    continue;
                }

                commitMeasuredPage(chapterIndex);
                continue;
            }
'''
new = '''            if (fittingLength === 0) {
                if (moveTrailingHeadingToNewPage(chapterIndex)) {
                    continue;
                }

                commitMeasuredPage(chapterIndex);
                continue;
            }
'''
replace_once(old, new, "paragraph trailing heading")

old = '''            if (fittingLength === 0) {
                const trailingHeading = els.measureBody.lastElementChild;

                if (trailingHeading?.tagName === "H2") {
                    moveBlockToNewPage(trailingHeading, chapterIndex);
                    continue;
                }

                if (els.measureBody.innerHTML.trim()) {
                    commitMeasuredPage(chapterIndex);
                    continue;
                }
'''
new = '''            if (fittingLength === 0) {
                if (moveTrailingHeadingToNewPage(chapterIndex)) {
                    continue;
                }

                if (els.measureBody.innerHTML.trim()) {
                    commitMeasuredPage(chapterIndex);
                    continue;
                }
'''
replace_once(old, new, "list trailing heading")


# 3) Deduplicate colophon content. COLOPHON becomes the single source of truth.
old = '''    function getColophonBlocks() {
        return [
            { text: book.title, className: "colophon__title" },
            { text: "【発行日】", className: "colophon__label" },
            { text: book.published, className: "colophon__text" },
            { text: "【発行元】", className: "colophon__label" },
            { text: "J.P.RETURNS 編集部", className: "colophon__text" },
            { text: "https://jpreturns.com/", className: "colophon__text" },
            { text: "〒100-6923 東京都千代田区丸の内 2-6-1 丸の内パークビルディング23階", className: "colophon__text" },
            { text: "© J.P.Returns. All rights reserved", className: "colophon__text" },
            { text: "本書の全部または一部について、許可なく複製・転載・配信・改変すること、ならびに有償・無償を問わず第三者へ譲渡することを禁止します。", className: "colophon__text" },
            { text: "【注意】", className: "colophon__label" },
            { text: "本書は、情報提供および学習を目的として制作したものであり、特定の投資成果や将来の運用成績を保証するものではありません。", className: "colophon__text" },
            { text: "本書の内容に基づく投資・運用その他の判断は、ご自身の責任において行ってください。これにより生じた損失その他の結果について、J.P.RETURNS株式会社は責任を負いかねます。", className: "colophon__text" },
            { text: "なお、本書に記載されている情報・事例は執筆時点のものであり、今後変更される場合があります。", className: "colophon__text" }
        ];
    }
'''
new = '''    function getColophonBlocks() {
        const textBlocks = (lines) => lines.map((text) => ({
            text,
            className: "colophon__text"
        }));

        return [
            { text: book.title, className: "colophon__title" },
            { text: "【発行日】", className: "colophon__label" },
            { text: book.published, className: "colophon__text" },
            { text: "【発行元】", className: "colophon__label" },
            ...textBlocks(COLOPHON.publisher),
            ...textBlocks(COLOPHON.copyright),
            { text: "【注意】", className: "colophon__label" },
            ...textBlocks(COLOPHON.notice)
        ];
    }
'''
replace_once(old, new, "colophon deduplication")


# 4) Give heading pagination and book-block dispatch explicit responsibilities.
old = '''    function paginateBook() {
        state.pages = [];
        state.chapterStarts = [];
        els.measureBody.innerHTML = "";
'''
new = '''    function paginateHeading(level, text, chapterIndex) {
        const node = createHeading(level, text);
        els.measureBody.appendChild(node);

        if (!fitsMeasureBody()) {
            moveBlockToNewPage(node, chapterIndex);
        }
    }

    function paginateBookBlock(block, chapterIndex) {
        switch (block.type) {
            case "image":
                paginateImageBlock(block, chapterIndex);
                break;
            case "h2":
                paginateHeading(2, block.text, chapterIndex);
                break;
            case "paragraph":
                paginateParagraph(block.text, chapterIndex);
                break;
            case "note":
                paginateNote(block.text, chapterIndex);
                break;
            case "list":
                paginateList(block, chapterIndex);
                break;
            default:
                console.warn(`Unsupported book block type: ${block.type}`);
        }
    }

    function paginateBook() {
        state.pages = [];
        state.chapterStarts = [];
        els.measureBody.innerHTML = "";
'''
replace_once(old, new, "block paginator insertion")

old = '''                switch (block.type) {
                    case "image":
                        paginateImageBlock(block, chapterIndex);
                        break;
                    case "h2": {
                        const node = createInlineTextElement("h2", block.text);
                        els.measureBody.appendChild(node);

                        if (!fitsMeasureBody()) {
                            moveBlockToNewPage(node, chapterIndex);
                        }
                        break;
                    }
                    case "paragraph":
                        paginateParagraph(block.text, chapterIndex);
                        break;
                    case "note":
                        paginateNote(block.text, chapterIndex);
                        break;
                    case "list":
                        paginateList(block, chapterIndex);
                        break;
                    default:
                        console.warn(`Unsupported book block type: ${block.type}`);
                }
'''
new = '''                paginateBookBlock(block, chapterIndex);
'''
replace_once(old, new, "book block dispatch")

path.write_text(viewer, encoding="utf-8")
