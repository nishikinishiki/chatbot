from pathlib import Path
import re

viewer_path = Path("zz_ebook/shared/viewer.js")
css_path = Path("zz_ebook/shared/style.css")
viewer = viewer_path.read_text(encoding="utf-8")
css = css_path.read_text(encoding="utf-8")


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 match, found {count}")
    return text.replace(old, new, 1)


# Replace the old footnote private-character encoding with a shared inline model.
old_inline_prelude = '''    const FOOTNOTE_REF_BASE = 0xE000;
    const FOOTNOTE_REF_LIMIT = 255;
    const footnoteReferenceLabels = [];

    function encodeFootnoteReference(label) {
        const index = footnoteReferenceLabels.length + 1;

        if (index > FOOTNOTE_REF_LIMIT) {
            return label;
        }

        footnoteReferenceLabels.push(label);
        return String.fromCharCode(FOOTNOTE_REF_BASE + index);
    }

    function getFootnoteReferenceLabel(char) {
        if (!char) return null;

        const code = char.charCodeAt(0);
        const index = code - FOOTNOTE_REF_BASE;

        if (index < 1 || index > FOOTNOTE_REF_LIMIT) return null;
        return footnoteReferenceLabels[index - 1] ?? null;
    }

'''
new_inline_prelude = '''    function sameInlineMarks(a, b) {
        return a.length === b.length && a.every((mark, index) => mark === b[index]);
    }

    function appendInlineSegment(segments, segment) {
        if (!segment) return;

        const last = segments[segments.length - 1];
        if (
            segment.type === "text" &&
            last?.type === "text" &&
            sameInlineMarks(last.marks, segment.marks)
        ) {
            last.text += segment.text;
            return;
        }

        segments.push(segment);
    }

    function parseInlineText(
        text,
        footnoteDefinitions,
        onFootnoteReference = null,
        marks = []
    ) {
        const segments = [];
        let index = 0;

        const pushText = (value) => {
            if (!value) return;
            appendInlineSegment(segments, {
                type: "text",
                text: value,
                marks: [...marks]
            });
        };

        while (index < text.length) {
            if (text[index] === "\\n") {
                segments.push({ type: "break" });
                index += 1;
                continue;
            }

            if (text.startsWith("**", index)) {
                const end = text.indexOf("**", index + 2);
                if (end !== -1) {
                    const inner = text.slice(index + 2, end);
                    parseInlineText(
                        inner,
                        footnoteDefinitions,
                        onFootnoteReference,
                        [...marks, "strong"]
                    ).forEach((segment) => appendInlineSegment(segments, segment));
                    index = end + 2;
                    continue;
                }
            }

            if (text.startsWith("<small>", index)) {
                const end = text.indexOf("</small>", index + 7);
                if (end !== -1) {
                    const inner = text.slice(index + 7, end);
                    parseInlineText(
                        inner,
                        footnoteDefinitions,
                        onFootnoteReference,
                        [...marks, "small"]
                    ).forEach((segment) => appendInlineSegment(segments, segment));
                    index = end + 8;
                    continue;
                }
            }

            const footnote = text.slice(index).match(/^\\[\\^([^\\]]+)\\]/);
            if (footnote) {
                const id = footnote[1].trim();
                if (footnoteDefinitions.has(id)) {
                    if (onFootnoteReference) onFootnoteReference(id);
                    segments.push({
                        type: "footnote-ref",
                        label: id
                    });
                    index += footnote[0].length;
                    continue;
                }
            }

            pushText(text[index]);
            index += 1;
        }

        return segments;
    }

    function inlineSegmentLength(segment) {
        if (segment.type === "text") return [...segment.text].length;
        return 1;
    }

    function inlineLength(segments) {
        return segments.reduce(
            (total, segment) => total + inlineSegmentLength(segment),
            0
        );
    }

    function sliceInlineSegments(segments, start, count = Infinity) {
        if (count <= 0) return [];

        const result = [];
        const end = start + count;
        let position = 0;

        segments.forEach((segment) => {
            const length = inlineSegmentLength(segment);
            const segmentStart = position;
            const segmentEnd = position + length;
            position = segmentEnd;

            if (segmentEnd <= start || segmentStart >= end) return;

            if (segment.type !== "text") {
                result.push({ ...segment });
                return;
            }

            const chars = [...segment.text];
            const from = Math.max(0, start - segmentStart);
            const to = Math.min(length, end - segmentStart);
            const text = chars.slice(from, to).join("");
            if (!text) return;

            appendInlineSegment(result, {
                ...segment,
                text,
                marks: [...segment.marks]
            });
        });

        return result;
    }

    function dropInlineSegments(segments, count) {
        return sliceInlineSegments(segments, count);
    }

    function inlinePlainText(segments) {
        return segments.map((segment) => {
            if (segment.type === "text") return segment.text;
            if (segment.type === "break") return " ";
            if (segment.type === "footnote-ref") return segment.label;
            return "";
        }).join("");
    }

'''
viewer = replace_once(viewer, old_inline_prelude, new_inline_prelude, "inline prelude")

# Replace the complete Markdown parser. Definitions stay document-wide, while
# their rendered blocks are assigned to the first H2 scope that references them
# (or the H1 scope before any H2 / when no H2 exists).
parser_start = viewer.index("    function parseBookMarkdown(md) {")
parser_end = viewer.index("    if (!window.bookMarkdown) {", parser_start)
new_parser = '''    function parseBookMarkdown(md) {
        const book = {
            title: "無題",
            published: "",
            cover: { src: "", alt: "表紙" },
            chapters: []
        };

        const parts = md.trim().split(/^---\\s*$/m);
        const frontmatter = parts.length >= 3 ? parts[1] : "";
        const body = parts.length >= 3
            ? parts.slice(2).join("---")
            : md;

        frontmatter.split("\\n").forEach((line) => {
            const separator = line.indexOf(":");
            if (separator < 0) return;

            const key = line.slice(0, separator).trim();
            const value = line.slice(separator + 1).trim();

            if (key === "title") book.title = value;
            if (key === "cover") book.cover.src = value;
            if (key === "published") book.published = value;
        });

        let currentChapter = null;
        let paragraphBuffer = [];
        let currentList = null;
        let currentFootnote = null;
        let pendingNoIndent = false;
        const footnoteDefinitions = new Map();

        function flushParagraph() {
            if (!paragraphBuffer.length || !currentChapter) {
                paragraphBuffer = [];
                return;
            }

            currentChapter.blocks.push({
                type: "paragraph",
                text: paragraphBuffer.join("\\n"),
                noIndent: pendingNoIndent
            });
            paragraphBuffer = [];
            pendingNoIndent = false;
        }

        function flushList() {
            if (!currentList || !currentChapter) {
                currentList = null;
                return;
            }

            currentChapter.blocks.push(currentList);
            currentList = null;
        }

        function flushFootnote() {
            if (!currentFootnote) return;

            footnoteDefinitions.set(
                currentFootnote.id,
                currentFootnote.lines.join("\\n").trim()
            );
            currentFootnote = null;
        }

        function flushTextBlocks() {
            flushParagraph();
            flushList();
        }

        function resetPendingParagraphStyle() {
            pendingNoIndent = false;
        }

        body.split("\\n").forEach((rawLine) => {
            const line = rawLine.trim();

            if (currentFootnote) {
                const continuation = rawLine.match(/^(?: {4}|\\t)(.*)$/);
                if (continuation) {
                    currentFootnote.lines.push(continuation[1]);
                    return;
                }
                flushFootnote();
            }

            if (!line) {
                flushTextBlocks();
                return;
            }

            if (line === "{.no-indent}") {
                flushTextBlocks();
                pendingNoIndent = true;
                return;
            }

            if (line.startsWith("# ")) {
                flushTextBlocks();
                resetPendingParagraphStyle();
                currentChapter = {
                    title: line.replace(/^#\\s+/, ""),
                    blocks: []
                };
                book.chapters.push(currentChapter);
                return;
            }

            const footnoteDefinition = line.match(/^\\[\\^([^\\]]+)\\]:\\s*(.*)$/);
            if (footnoteDefinition) {
                flushTextBlocks();
                currentFootnote = {
                    id: footnoteDefinition[1].trim(),
                    lines: [footnoteDefinition[2]]
                };
                return;
            }

            if (!currentChapter) return;

            if (line.startsWith("### ")) {
                flushTextBlocks();
                resetPendingParagraphStyle();
                currentChapter.blocks.push({
                    type: "h3",
                    text: line.replace(/^###\\s+/, "")
                });
                return;
            }

            if (line.startsWith("## ")) {
                flushTextBlocks();
                resetPendingParagraphStyle();
                currentChapter.blocks.push({
                    type: "h2",
                    text: line.replace(/^##\\s+/, "")
                });
                return;
            }

            const image = line.match(/^!\\[(.*?)\\]\\((.*?)\\)(\\{page\\})?$/);
            if (image) {
                flushTextBlocks();
                resetPendingParagraphStyle();
                currentChapter.blocks.push({
                    type: image[3] ? "full-image" : "image",
                    alt: image[1],
                    src: image[2]
                });
                return;
            }

            const unorderedListItem = line.match(/^[-*+]\\s+(.+)$/);
            if (unorderedListItem) {
                flushParagraph();
                resetPendingParagraphStyle();

                if (!currentList || currentList.ordered) {
                    flushList();
                    currentList = {
                        type: "list",
                        ordered: false,
                        items: []
                    };
                }

                currentList.items.push(unorderedListItem[1]);
                return;
            }

            const orderedListItem = line.match(/^(\\d+)\\.\\s+(.+)$/);
            if (orderedListItem) {
                flushParagraph();
                resetPendingParagraphStyle();

                if (!currentList || !currentList.ordered) {
                    flushList();
                    currentList = {
                        type: "list",
                        ordered: true,
                        start: Number(orderedListItem[1]),
                        items: []
                    };
                }

                currentList.items.push(orderedListItem[2]);
                return;
            }

            flushList();
            paragraphBuffer.push(line);
        });

        flushFootnote();
        flushTextBlocks();

        const placedFootnotes = new Set();

        function prepareBlockInline(block, onFootnoteReference) {
            if (["h2", "h3", "paragraph"].includes(block.type)) {
                block.inline = parseInlineText(
                    block.text,
                    footnoteDefinitions,
                    onFootnoteReference
                );
                return;
            }

            if (block.type === "list") {
                block.items = block.items.map((text) => ({
                    text,
                    inline: parseInlineText(
                        text,
                        footnoteDefinitions,
                        onFootnoteReference
                    )
                }));
            }
        }

        function createFootnotesBlock(ids) {
            return {
                type: "footnotes",
                items: ids.map((id) => {
                    const text = footnoteDefinitions.get(id) ?? "";
                    return {
                        label: id,
                        text,
                        inline: parseInlineText(text, footnoteDefinitions)
                    };
                })
            };
        }

        function finalizeChapter(chapter) {
            const output = [];
            let pendingFootnoteIds = [];

            const registerFootnote = (id) => {
                if (placedFootnotes.has(id)) return;
                placedFootnotes.add(id);
                pendingFootnoteIds.push(id);
            };

            const flushScopedFootnotes = () => {
                if (!pendingFootnoteIds.length) return;
                output.push(createFootnotesBlock(pendingFootnoteIds));
                pendingFootnoteIds = [];
            };

            chapter.titleInline = parseInlineText(
                chapter.title,
                footnoteDefinitions,
                registerFootnote
            );
            chapter.titleText = inlinePlainText(chapter.titleInline);

            chapter.blocks.forEach((block) => {
                if (block.type === "h2") {
                    flushScopedFootnotes();
                }

                prepareBlockInline(block, registerFootnote);
                output.push(block);
            });

            flushScopedFootnotes();
            chapter.blocks = output;
        }

        book.chapters.forEach(finalizeChapter);
        return book;
    }

'''
viewer = viewer[:parser_start] + new_parser + viewer[parser_end:]

# Replace inline DOM factories and remove NOTE rendering.
render_start = viewer.index("    function appendInlineText(parent, text) {")
render_end = viewer.index("    function createImageBlock(block) {", render_start)
new_render = '''    function wrapInlineNode(node, marks = []) {
        let wrapped = node;

        [...marks].reverse().forEach((mark) => {
            const wrapper = document.createElement(mark === "strong" ? "strong" : "small");
            wrapper.appendChild(wrapped);
            wrapped = wrapper;
        });

        return wrapped;
    }

    function appendInlineSegments(parent, segments) {
        segments.forEach((segment) => {
            if (segment.type === "break") {
                parent.appendChild(document.createElement("br"));
                return;
            }

            if (segment.type === "footnote-ref") {
                const reference = document.createElement("sup");
                reference.className = "footnote-ref";
                reference.textContent = segment.label;
                reference.setAttribute("aria-label", `注釈 ${segment.label}`);
                parent.appendChild(reference);
                return;
            }

            if (segment.type === "text") {
                const textNode = document.createTextNode(segment.text);
                parent.appendChild(wrapInlineNode(textNode, segment.marks));
            }
        });
    }

    function createInlineElement(tag, segments, className = "") {
        const element = document.createElement(tag);
        if (className) element.className = className;
        appendInlineSegments(element, segments);
        return element;
    }

    function createHeading(level, segments) {
        return createInlineElement(`h${level}`, segments);
    }

    function createParagraph(segments, continuation = false, noIndent = false) {
        const paragraph = document.createElement("p");
        const classNames = [];
        if (continuation) classNames.push("continuation");
        if (noIndent) classNames.push("no-indent");
        paragraph.className = classNames.join(" ");
        appendInlineSegments(paragraph, segments);
        return paragraph;
    }

    function createList(block, items = block.items, start = block.start ?? 1, continuation = false) {
        const list = document.createElement(block.ordered ? "ol" : "ul");
        list.className = continuation
            ? "book-list book-list--continuation"
            : "book-list";

        if (block.ordered && start !== 1) {
            list.start = start;
        }

        items.forEach((itemData) => {
            const item = document.createElement("li");
            appendInlineSegments(item, itemData.inline);
            list.appendChild(item);
        });

        return list;
    }

    function createFootnotes(items, continuation = false) {
        const list = document.createElement("ul");
        list.className = continuation
            ? "book-footnotes book-footnotes--continuation"
            : "book-footnotes";

        items.forEach((itemData) => {
            const item = document.createElement("li");

            if (!continuation) {
                const label = document.createElement("span");
                label.className = "book-footnote-label";
                label.textContent = `${itemData.label}　`;
                item.appendChild(label);
            }

            appendInlineSegments(item, itemData.inline);
            list.appendChild(item);
        });

        return list;
    }

'''
viewer = viewer[:render_start] + new_render + viewer[render_end:]

# Heading orphan protection now covers all supported heading levels.
viewer = replace_once(
    viewer,
    '''    function isTrailingHeading(element) {\n        return element?.tagName === "H2";\n    }\n''',
    '''    function isTrailingHeading(element) {\n        return element?.matches("h1, h2, h3") ?? false;\n    }\n''',
    "heading orphan helper"
)

# Replace paragraph/list/note pagination with inline-segment aware pagination and
# a dedicated footnote paginator.
pagination_start = viewer.index("    function findLargestFittingPrefix(")
pagination_end = viewer.index("    function createColophonSection() {", pagination_start)
new_pagination = '''    function findLargestFittingInlinePrefix(segments, createNode) {
        let low = 1;
        let high = inlineLength(segments);
        let best = 0;

        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const node = createNode(sliceInlineSegments(segments, 0, mid));
            els.measureBody.appendChild(node);

            const fits = fitsMeasureBody();
            node.remove();

            if (fits) {
                best = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        return best;
    }

    function paginateParagraph(block, chapterIndex) {
        let remaining = block.inline;
        let continuation = false;

        while (inlineLength(remaining) > 0) {
            const fullNode = createParagraph(
                remaining,
                continuation,
                block.noIndent
            );
            els.measureBody.appendChild(fullNode);

            if (fitsMeasureBody()) return;

            fullNode.remove();

            const fittingLength = findLargestFittingInlinePrefix(
                remaining,
                (segments) => createParagraph(
                    segments,
                    continuation,
                    block.noIndent
                )
            );

            if (fittingLength === 0) {
                if (moveTrailingHeadingToNewPage(chapterIndex)) continue;
                commitMeasuredPage(chapterIndex);
                continue;
            }

            els.measureBody.appendChild(
                createParagraph(
                    sliceInlineSegments(remaining, 0, fittingLength),
                    continuation,
                    block.noIndent
                )
            );
            commitMeasuredPage(chapterIndex);

            remaining = dropInlineSegments(remaining, fittingLength);
            continuation = true;
        }
    }

    function paginateOversizedListItem(block, itemData, start, chapterIndex) {
        let remaining = itemData.inline;
        let continuation = false;

        while (inlineLength(remaining) > 0) {
            const currentItem = { ...itemData, inline: remaining };
            const fullNode = createList(
                block,
                [currentItem],
                start,
                continuation
            );
            els.measureBody.appendChild(fullNode);

            if (fitsMeasureBody()) return;

            fullNode.remove();

            const fittingLength = findLargestFittingInlinePrefix(
                remaining,
                (segments) => createList(
                    block,
                    [{ ...itemData, inline: segments }],
                    start,
                    continuation
                )
            );

            if (fittingLength === 0) {
                if (moveTrailingHeadingToNewPage(chapterIndex)) continue;

                if (els.measureBody.innerHTML.trim()) {
                    commitMeasuredPage(chapterIndex);
                    continue;
                }

                const fallback = sliceInlineSegments(remaining, 0, 1);
                els.measureBody.appendChild(
                    createList(
                        block,
                        [{ ...itemData, inline: fallback }],
                        start,
                        continuation
                    )
                );
                commitMeasuredPage(chapterIndex);
                remaining = dropInlineSegments(remaining, 1);
                continuation = true;
                continue;
            }

            els.measureBody.appendChild(
                createList(
                    block,
                    [{
                        ...itemData,
                        inline: sliceInlineSegments(
                            remaining,
                            0,
                            fittingLength
                        )
                    }],
                    start,
                    continuation
                )
            );
            commitMeasuredPage(chapterIndex);
            remaining = dropInlineSegments(remaining, fittingLength);
            continuation = true;
        }
    }

    function paginateList(block, chapterIndex) {
        let index = 0;

        while (index < block.items.length) {
            const start = (block.start ?? 1) + index;
            const list = createList(block, [], start);
            els.measureBody.appendChild(list);
            let addedItems = 0;

            while (index < block.items.length) {
                const item = document.createElement("li");
                appendInlineSegments(item, block.items[index].inline);
                list.appendChild(item);

                if (!fitsMeasureBody()) {
                    item.remove();
                    break;
                }

                index += 1;
                addedItems += 1;
            }

            if (index >= block.items.length) return;

            if (addedItems > 0) {
                commitMeasuredPage(chapterIndex);
                continue;
            }

            list.remove();

            if (els.measureBody.innerHTML.trim()) {
                commitMeasuredPage(chapterIndex);
                continue;
            }

            paginateOversizedListItem(
                block,
                block.items[index],
                start,
                chapterIndex
            );
            index += 1;
        }
    }

    function paginateOversizedFootnote(itemData, chapterIndex) {
        let remaining = itemData.inline;
        let continuation = false;

        while (inlineLength(remaining) > 0) {
            const fullNode = createFootnotes(
                [{ ...itemData, inline: remaining }],
                continuation
            );
            els.measureBody.appendChild(fullNode);

            if (fitsMeasureBody()) return;
            fullNode.remove();

            const fittingLength = findLargestFittingInlinePrefix(
                remaining,
                (segments) => createFootnotes(
                    [{ ...itemData, inline: segments }],
                    continuation
                )
            );

            if (fittingLength === 0) {
                if (els.measureBody.innerHTML.trim()) {
                    commitMeasuredPage(chapterIndex);
                    continue;
                }

                const fallback = sliceInlineSegments(remaining, 0, 1);
                els.measureBody.appendChild(
                    createFootnotes(
                        [{ ...itemData, inline: fallback }],
                        continuation
                    )
                );
                commitMeasuredPage(chapterIndex);
                remaining = dropInlineSegments(remaining, 1);
                continuation = true;
                continue;
            }

            els.measureBody.appendChild(
                createFootnotes(
                    [{
                        ...itemData,
                        inline: sliceInlineSegments(
                            remaining,
                            0,
                            fittingLength
                        )
                    }],
                    continuation
                )
            );
            commitMeasuredPage(chapterIndex);
            remaining = dropInlineSegments(remaining, fittingLength);
            continuation = true;
        }
    }

    function paginateFootnotes(block, chapterIndex) {
        let index = 0;

        while (index < block.items.length) {
            const list = createFootnotes([]);
            els.measureBody.appendChild(list);
            let addedItems = 0;

            while (index < block.items.length) {
                const itemData = block.items[index];
                const item = document.createElement("li");

                const label = document.createElement("span");
                label.className = "book-footnote-label";
                label.textContent = `${itemData.label}　`;
                item.appendChild(label);
                appendInlineSegments(item, itemData.inline);
                list.appendChild(item);

                if (!fitsMeasureBody()) {
                    item.remove();
                    break;
                }

                index += 1;
                addedItems += 1;
            }

            if (index >= block.items.length) return;

            if (addedItems > 0) {
                commitMeasuredPage(chapterIndex);
                continue;
            }

            list.remove();

            if (els.measureBody.innerHTML.trim()) {
                commitMeasuredPage(chapterIndex);
                continue;
            }

            paginateOversizedFootnote(block.items[index], chapterIndex);
            index += 1;
        }
    }

'''
viewer = viewer[:pagination_start] + new_pagination + viewer[pagination_end:]

# Update heading and block dispatch to consume parsed inline segments, add H3 and
# dedicated footnotes, and remove NOTE.
old_heading = '''    function paginateHeading(level, text, chapterIndex) {
        const node = createHeading(level, text);
        els.measureBody.appendChild(node);

        if (!fitsMeasureBody()) {
            moveBlockToNewPage(node, chapterIndex);
        }
    }
'''
new_heading = '''    function paginateHeading(level, segments, chapterIndex) {
        const node = createHeading(level, segments);
        els.measureBody.appendChild(node);

        if (!fitsMeasureBody()) {
            moveBlockToNewPage(node, chapterIndex);
        }
    }
'''
viewer = replace_once(viewer, old_heading, new_heading, "paginateHeading")

old_dispatch = '''    function paginateBookBlock(block, chapterIndex) {
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
'''
new_dispatch = '''    function paginateBookBlock(block, chapterIndex) {
        switch (block.type) {
            case "image":
                paginateImageBlock(block, chapterIndex);
                break;
            case "h2":
                paginateHeading(2, block.inline, chapterIndex);
                break;
            case "h3":
                paginateHeading(3, block.inline, chapterIndex);
                break;
            case "paragraph":
                paginateParagraph(block, chapterIndex);
                break;
            case "list":
                paginateList(block, chapterIndex);
                break;
            case "footnotes":
                paginateFootnotes(block, chapterIndex);
                break;
            default:
                console.warn(`Unsupported book block type: ${block.type}`);
        }
    }
'''
viewer = replace_once(viewer, old_dispatch, new_dispatch, "book dispatch")

viewer = replace_once(
    viewer,
    '''                els.measureBody.appendChild(\n                    createTextElement("h1", chapter.title)\n                );\n''',
    '''                els.measureBody.appendChild(\n                    createHeading(1, chapter.titleInline)\n                );\n''',
    "chapter heading render"
)

# TOC/topbar should display plain heading text rather than Markdown syntax.
viewer = viewer.replace("book.chapters[index]?.title ?? book.title", "book.chapters[index]?.titleText ?? book.title")
viewer = viewer.replace("button.textContent = chapter.title;", "button.textContent = chapter.titleText ?? chapter.title;")

# CSS: add H3, no-indent, inline styles; remove NOTE; restore the previous
# footnote separator style while retaining the user's other current typography.
css = replace_once(
    css,
    ''':where(.page-body, .measure-body) h1+h2 {\n    margin-top: 0;\n}\n''',
    ''':where(.page-body, .measure-body) h3 {\n    margin: 1.25em 0 0.4em;\n    font-size: 1em;\n    font-weight: 600;\n    line-height: 1.5;\n    text-align: left;\n}\n\n:where(.page-body, .measure-body) h1+h2 {\n    margin-top: 0;\n}\n''',
    "h3 css"
)

css = replace_once(
    css,
    ''':where(.page-body, .measure-body) p:not(.continuation) {\n    text-indent: 1em;\n}\n''',
    ''':where(.page-body, .measure-body) p:not(.continuation) {\n    text-indent: 1em;\n}\n\n:where(.page-body, .measure-body) p.no-indent {\n    text-indent: 0;\n}\n\n:where(.page-body, .measure-body) strong {\n    font-weight: 700;\n}\n\n:where(.page-body, .measure-body) small {\n    font-size: 0.8em;\n}\n''',
    "inline css"
)

note_css = ''':where(.page-body, .measure-body) .book-note {\n    padding: 0;\n    font-size: 0.85em;\n    text-align: left;\n    color: var(--text-secondary);\n}\n\n:where(.page-body, .measure-body) .book-note__text {\n    overflow-wrap: anywhere;\n}\n\n:where(.page-body, .measure-body) .book-note--continuation {\n    margin-top: 0;\n}\n\n'''
css = replace_once(css, note_css, "", "remove NOTE css")

css = replace_once(
    css,
    '''    list-style: none;\n    color: var(--text-secondary);\n''',
    '''    list-style: none;\n    border-top: 1px solid var(--line);\n    color: var(--text-secondary);\n''',
    "restore footnote separator"
)

css = replace_once(
    css,
    ''':where(.page-body, .measure-body) .book-footnotes li:last-child {\n    margin-bottom: 0;\n}\n''',
    ''':where(.page-body, .measure-body) .book-footnotes li:last-child {\n    margin-bottom: 0;\n}\n\n:where(.page-body, .measure-body) .book-footnotes--continuation {\n    border-top: 0;\n    margin-top: 0;\n}\n''',
    "footnote continuation css"
)

viewer_path.write_text(viewer, encoding="utf-8")
css_path.write_text(css, encoding="utf-8")
