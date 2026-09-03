from pathlib import Path

path = Path("zz_ebook/shared/viewer.js")
viewer = path.read_text(encoding="utf-8")

start = viewer.index("    function paginateOversizedListItem(")
end = viewer.index("    function createColophonSection()", start)

replacement = r'''    function paginateOversizedInlineItem({
        itemData,
        chapterIndex,
        createNode,
        protectTrailingHeading = false
    }) {
        let remaining = itemData.inline;
        let continuation = false;

        while (inlineLength(remaining) > 0) {
            const fullNode = createNode(remaining, continuation);
            els.measureBody.appendChild(fullNode);

            if (fitsMeasureBody()) return;
            fullNode.remove();

            const fittingLength = findLargestFittingInlinePrefix(
                remaining,
                (segments) => createNode(segments, continuation)
            );

            if (fittingLength === 0) {
                if (
                    protectTrailingHeading &&
                    moveTrailingHeadingToNewPage(chapterIndex)
                ) {
                    continue;
                }

                if (els.measureBody.innerHTML.trim()) {
                    commitMeasuredPage(chapterIndex);
                    continue;
                }

                const fallback = sliceInlineSegments(remaining, 0, 1);
                els.measureBody.appendChild(
                    createNode(fallback, continuation)
                );
                commitMeasuredPage(chapterIndex);
                remaining = dropInlineSegments(remaining, 1);
                continuation = true;
                continue;
            }

            els.measureBody.appendChild(
                createNode(
                    sliceInlineSegments(remaining, 0, fittingLength),
                    continuation
                )
            );
            commitMeasuredPage(chapterIndex);
            remaining = dropInlineSegments(remaining, fittingLength);
            continuation = true;
        }
    }

    function paginateItemCollection({
        items,
        chapterIndex,
        createContainer,
        appendItem,
        paginateOversized
    }) {
        let index = 0;

        while (index < items.length) {
            const container = createContainer(index);
            els.measureBody.appendChild(container);
            let addedItems = 0;

            while (index < items.length) {
                const item = appendItem(container, items[index], index);

                if (!fitsMeasureBody()) {
                    item.remove();
                    break;
                }

                index += 1;
                addedItems += 1;
            }

            if (index >= items.length) return;

            if (addedItems > 0) {
                commitMeasuredPage(chapterIndex);
                continue;
            }

            container.remove();

            if (els.measureBody.innerHTML.trim()) {
                commitMeasuredPage(chapterIndex);
                continue;
            }

            paginateOversized(items[index], index);
            index += 1;
        }
    }

    function paginateOversizedListItem(block, itemData, start, chapterIndex) {
        paginateOversizedInlineItem({
            itemData,
            chapterIndex,
            protectTrailingHeading: true,
            createNode: (segments, continuation) => createList(
                block,
                [{ ...itemData, inline: segments }],
                start,
                continuation
            )
        });
    }

    function paginateList(block, chapterIndex) {
        paginateItemCollection({
            items: block.items,
            chapterIndex,
            createContainer: (index) => createList(
                block,
                [],
                (block.start ?? 1) + index
            ),
            appendItem: (list, itemData) => {
                const item = document.createElement("li");
                appendInlineSegments(item, itemData.inline);
                list.appendChild(item);
                return item;
            },
            paginateOversized: (itemData, index) => {
                paginateOversizedListItem(
                    block,
                    itemData,
                    (block.start ?? 1) + index,
                    chapterIndex
                );
            }
        });
    }

    function paginateOversizedFootnote(itemData, chapterIndex) {
        paginateOversizedInlineItem({
            itemData,
            chapterIndex,
            createNode: (segments, continuation) => createFootnotes(
                [{ ...itemData, inline: segments }],
                continuation
            )
        });
    }

    function paginateFootnotes(block, chapterIndex) {
        paginateItemCollection({
            items: block.items,
            chapterIndex,
            createContainer: () => createFootnotes([]),
            appendItem: (list, itemData) => {
                const item = document.createElement("li");

                const label = document.createElement("span");
                label.className = "book-footnote-label";
                label.textContent = `${itemData.label}　`;
                item.appendChild(label);

                appendInlineSegments(item, itemData.inline);
                list.appendChild(item);
                return item;
            },
            paginateOversized: (itemData) => {
                paginateOversizedFootnote(itemData, chapterIndex);
            }
        });
    }

'''

viewer = viewer[:start] + replacement + viewer[end:]
path.write_text(viewer, encoding="utf-8")
