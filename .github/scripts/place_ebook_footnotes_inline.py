from pathlib import Path

path = Path("zz_ebook/shared/viewer.js")
viewer = path.read_text(encoding="utf-8")

old_flush = '''        function flushFootnote() {
            if (!currentFootnote) return;

            footnoteDefinitions.set(
                currentFootnote.id,
                currentFootnote.lines.join("\\n").trim()
            );
            currentFootnote = null;
        }
'''
new_flush = '''        function flushFootnote() {
            if (!currentFootnote) return;

            const text = currentFootnote.lines.join("\\n").trim();
            footnoteDefinitions.set(currentFootnote.id, text);

            if (currentChapter) {
                currentChapter.blocks.push({
                    type: "list",
                    ordered: false,
                    footnotes: true,
                    items: [`${currentFootnote.id}　${text}`]
                });
            }

            currentFootnote = null;
        }
'''
if old_flush not in viewer:
    raise SystemExit("flushFootnote block not found")
viewer = viewer.replace(old_flush, new_flush, 1)

old_replace = '''        function replaceFootnoteReferences(text, order, references) {
            return text.replace(/\\[\\^([^\\]]+)\\]/g, (match, rawId) => {
                const id = rawId.trim();
                if (!footnoteDefinitions.has(id)) return match;

                if (!references.has(id)) {
                    references.set(id, encodeFootnoteReference(id));
                    order.push(id);
                }

                return references.get(id);
            });
        }
'''
new_replace = '''        function replaceFootnoteReferences(text, references) {
            return text.replace(/\\[\\^([^\\]]+)\\]/g, (match, rawId) => {
                const id = rawId.trim();
                if (!footnoteDefinitions.has(id)) return match;

                if (!references.has(id)) {
                    references.set(id, encodeFootnoteReference(id));
                }

                return references.get(id);
            });
        }
'''
if old_replace not in viewer:
    raise SystemExit("replaceFootnoteReferences block not found")
viewer = viewer.replace(old_replace, new_replace, 1)

old_finalize = '''        function finalizeChapterFootnotes(chapter) {
            if (!footnoteDefinitions.size) return;

            const order = [];
            const references = new Map();

            chapter.blocks.forEach((block) => {
                if (
                    block.type === "paragraph" ||
                    block.type === "h2" ||
                    block.type === "note"
                ) {
                    block.text = replaceFootnoteReferences(
                        block.text,
                        order,
                        references
                    );
                    return;
                }

                if (block.type === "list") {
                    block.items = block.items.map((item) =>
                        replaceFootnoteReferences(
                            item,
                            order,
                            references
                        )
                    );
                }
            });

            if (order.length) {
                chapter.blocks.push({
                    type: "list",
                    ordered: false,
                    footnotes: true,
                    items: order.map(
                        (id) => `${id}　${footnoteDefinitions.get(id)}`
                    )
                });
            }
        }
'''
new_finalize = '''        function finalizeChapterFootnotes(chapter) {
            if (!footnoteDefinitions.size) return;

            const references = new Map();

            chapter.blocks.forEach((block) => {
                if (
                    block.type === "paragraph" ||
                    block.type === "h2" ||
                    block.type === "note"
                ) {
                    block.text = replaceFootnoteReferences(
                        block.text,
                        references
                    );
                    return;
                }

                if (block.type === "list" && !block.footnotes) {
                    block.items = block.items.map((item) =>
                        replaceFootnoteReferences(item, references)
                    );
                }
            });
        }
'''
if old_finalize not in viewer:
    raise SystemExit("finalizeChapterFootnotes block not found")
viewer = viewer.replace(old_finalize, new_finalize, 1)

path.write_text(viewer, encoding="utf-8")
