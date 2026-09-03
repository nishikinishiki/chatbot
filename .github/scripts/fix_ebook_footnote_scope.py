from pathlib import Path

path = Path("zz_ebook/shared/viewer.js")
viewer = path.read_text(encoding="utf-8")

old_state = '''        let currentList = null;
        let currentNote = null;
        let currentFootnote = null;
'''
new_state = '''        let currentList = null;
        let currentNote = null;
        let currentFootnote = null;
        const footnoteDefinitions = new Map();
'''
if old_state not in viewer:
    raise SystemExit("parser state marker not found")
viewer = viewer.replace(old_state, new_state, 1)

old_flush = '''        function flushFootnote() {
            if (!currentFootnote || !currentChapter) {
                currentFootnote = null;
                return;
            }

            currentChapter.footnotes.set(
                currentFootnote.id,
                currentFootnote.lines.join("\\n").trim()
            );
            currentFootnote = null;
        }
'''
new_flush = '''        function flushFootnote() {
            if (!currentFootnote) return;

            footnoteDefinitions.set(
                currentFootnote.id,
                currentFootnote.lines.join("\\n").trim()
            );
            currentFootnote = null;
        }
'''
if old_flush not in viewer:
    raise SystemExit("flushFootnote marker not found")
viewer = viewer.replace(old_flush, new_flush, 1)

old_replace = '''        function replaceFootnoteReferences(text, chapter, order, numbers) {
            return text.replace(/\\[\\^([^\\]]+)\\]/g, (match, rawId) => {
                const id = rawId.trim();
                if (!chapter.footnotes.has(id)) return match;

                if (!numbers.has(id)) {
                    const number = numbers.size + 1;
                    numbers.set(id, number);
                    order.push(id);
                }

                return encodeFootnoteReference(numbers.get(id));
            });
        }

        function finalizeChapterFootnotes(chapter) {
            if (!chapter.footnotes?.size) {
                delete chapter.footnotes;
                return;
            }

            const order = [];
            const numbers = new Map();

            chapter.blocks.forEach((block) => {
                if (
                    block.type === "paragraph" ||
                    block.type === "h2" ||
                    block.type === "note"
                ) {
                    block.text = replaceFootnoteReferences(
                        block.text,
                        chapter,
                        order,
                        numbers
                    );
                    return;
                }

                if (block.type === "list") {
                    block.items = block.items.map((item) =>
                        replaceFootnoteReferences(
                            item,
                            chapter,
                            order,
                            numbers
                        )
                    );
                }
            });

            if (order.length) {
                chapter.blocks.push({
                    type: "list",
                    ordered: true,
                    start: 1,
                    footnotes: true,
                    items: order.map((id) => chapter.footnotes.get(id))
                });
            }

            delete chapter.footnotes;
        }
'''
new_replace = '''        function replaceFootnoteReferences(text, order, numbers) {
            return text.replace(/\\[\\^([^\\]]+)\\]/g, (match, rawId) => {
                const id = rawId.trim();
                if (!footnoteDefinitions.has(id)) return match;

                if (!numbers.has(id)) {
                    const number = numbers.size + 1;
                    numbers.set(id, number);
                    order.push(id);
                }

                return encodeFootnoteReference(numbers.get(id));
            });
        }

        function finalizeChapterFootnotes(chapter) {
            if (!footnoteDefinitions.size) return;

            const order = [];
            const numbers = new Map();

            chapter.blocks.forEach((block) => {
                if (
                    block.type === "paragraph" ||
                    block.type === "h2" ||
                    block.type === "note"
                ) {
                    block.text = replaceFootnoteReferences(
                        block.text,
                        order,
                        numbers
                    );
                    return;
                }

                if (block.type === "list") {
                    block.items = block.items.map((item) =>
                        replaceFootnoteReferences(
                            item,
                            order,
                            numbers
                        )
                    );
                }
            });

            if (order.length) {
                chapter.blocks.push({
                    type: "list",
                    ordered: true,
                    start: 1,
                    footnotes: true,
                    items: order.map((id) => footnoteDefinitions.get(id))
                });
            }
        }
'''
if old_replace not in viewer:
    raise SystemExit("footnote finalization marker not found")
viewer = viewer.replace(old_replace, new_replace, 1)

old_chapter = '''                currentChapter = {
                    title: line.replace(/^#\\s+/, ""),
                    blocks: [],
                    footnotes: new Map()
                };
'''
new_chapter = '''                currentChapter = {
                    title: line.replace(/^#\\s+/, ""),
                    blocks: []
                };
'''
if old_chapter not in viewer:
    raise SystemExit("chapter initialization marker not found")
viewer = viewer.replace(old_chapter, new_chapter, 1)

footnote_block = '''            const footnoteDefinition = line.match(/^\\[\\^([^\\]]+)\\]:\\s*(.*)$/);
            if (footnoteDefinition) {
                flushTextBlocks();
                currentFootnote = {
                    id: footnoteDefinition[1].trim(),
                    lines: [footnoteDefinition[2]]
                };
                return;
            }

'''
if footnote_block not in viewer:
    raise SystemExit("footnote definition block not found")
viewer = viewer.replace(footnote_block, "", 1)

chapter_guard = "            if (!currentChapter) return;\n"
insert_pos = viewer.index(chapter_guard, viewer.index("    function parseBookMarkdown(md) {"))
viewer = viewer[:insert_pos] + footnote_block + viewer[insert_pos:]

path.write_text(viewer, encoding="utf-8")
