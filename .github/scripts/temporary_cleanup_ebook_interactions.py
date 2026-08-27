from pathlib import Path

viewer_path = Path("zz_ebook/shared/viewer.js")
style_path = Path("zz_ebook/shared/style.css")
viewer = viewer_path.read_text(encoding="utf-8")
style = style_path.read_text(encoding="utf-8")


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 match, found {count}")
    return text.replace(old, new, 1)


viewer = replace_once(
    viewer,
    '''            flickVelocity: 0.42,
            flickDistance: 24,
            edgeResistance: 0.15''',
    '''            flickVelocity: 0.42,
            flickDistance: 24''',
    "remove edge resistance config",
)

viewer = replace_once(
    viewer,
    '''    document.addEventListener("click", (event) => {
        if (!isSpreadView()) return;

        const image = getReaderImage(event.target);
        if (!image) return;

        event.preventDefault();
        event.stopPropagation();
        openImageViewer(image);
    }, true);

''',
    '',
    "remove desktop-only image click route",
)

viewer = replace_once(
    viewer,
    '''

    els.imageViewerImage.addEventListener("dblclick", (event) => {
        event.preventDefault();
        event.stopPropagation();

        imageViewerGesture.scale = imageViewerGesture.scale > 1 ? 1 : 2;
        imageViewerGesture.x = 0;
        imageViewerGesture.y = 0;
        applyImageViewerTransform();
    });
''',
    '',
    "remove double click zoom",
)

old_repaginate = '''    function repaginate({
        anchorChapterStart = false,
        deferVisibleFont = false,
        showLoading = false
    } = {}) {
        const pageCount = Math.max(state.pages.length, 1);
        const currentPage = state.pages[state.currentPage];
        const chapterIndex =
            anchorChapterStart &&
            Number.isInteger(currentPage?.chapterIndex) &&
            state.chapterStarts[currentPage.chapterIndex] === state.currentPage
                ? currentPage.chapterIndex
                : null;
        const progress = pageCount <= 1
            ? 0
            : state.currentPage / (pageCount - 1);

        if (deferVisibleFont) {
            setFontCss(state.fontSize, { visible: false, measure: true });
        } else {
            setFontCss(state.fontSize);
        }

        if (showLoading) {
            els.loading.hidden = false;
        }

        requestAnimationFrame(() => {
            paginateBook();
            configurePageSlider();

            const chapterPage = Number.isInteger(chapterIndex)
                ? state.chapterStarts[chapterIndex]
                : null;
            const nextPage = Number.isInteger(chapterPage)
                ? chapterPage
                : Math.round(
                    progress * Math.max(0, state.pages.length - 1)
                );

            setCurrentPage(nextPage, { syncUI: false });

            if (deferVisibleFont) {
                setFontCss(state.fontSize, { visible: true, measure: false });
            }

            renderPageStack();
            updateReadingPositionUI();
            refreshOverviewAfterPagination();

            if (showLoading) {
                els.loading.hidden = true;
            }
        });
    }
'''

new_repaginate = '''    function repaginate(reason) {
        const fontChange = reason === "font";
        const resize = reason === "resize";
        const pageCount = Math.max(state.pages.length, 1);
        const currentPage = state.pages[state.currentPage];
        const chapterIndex =
            fontChange &&
            Number.isInteger(currentPage?.chapterIndex) &&
            state.chapterStarts[currentPage.chapterIndex] === state.currentPage
                ? currentPage.chapterIndex
                : null;
        const progress = pageCount <= 1
            ? 0
            : state.currentPage / (pageCount - 1);

        if (fontChange) {
            setFontCss(state.fontSize, { visible: false, measure: true });
        } else {
            setFontCss(state.fontSize);
        }

        if (resize) {
            els.loading.hidden = false;
        }

        requestAnimationFrame(() => {
            paginateBook();
            configurePageSlider();

            const chapterPage = Number.isInteger(chapterIndex)
                ? state.chapterStarts[chapterIndex]
                : null;
            const nextPage = Number.isInteger(chapterPage)
                ? chapterPage
                : Math.round(
                    progress * Math.max(0, state.pages.length - 1)
                );

            setCurrentPage(nextPage, { syncUI: false });

            if (fontChange) {
                setFontCss(state.fontSize, { visible: true, measure: false });
            }

            renderPageStack();
            updateReadingPositionUI();
            refreshOverviewAfterPagination();

            if (resize) {
                els.loading.hidden = true;
            }
        });
    }
'''
viewer = replace_once(
    viewer,
    old_repaginate,
    new_repaginate,
    "simplify repaginate API",
)

viewer = replace_once(
    viewer,
    '''        repaginate({
            anchorChapterStart: true,
            deferVisibleFont: true
        });''',
    '''        repaginate("font");''',
    "font repagination call",
)

viewer = replace_once(
    viewer,
    '''    stage.addEventListener("click", (event) => {
        if (
            !isSpreadView() ||
            state.mode !== "normal" ||
            modeTransitioning
        ) return;

        handleReaderTap(event.clientX);
    });

''',
    '',
    "remove spread-only stage click route",
)

viewer = replace_once(
    viewer,
    '''    stage.addEventListener("pointerdown", (event) => {
        if (
            isSpreadView() ||
            state.mode !== "normal" ||
            readerInteraction.isTurning ||
            modeTransitioning
        ) return;
        if (event.pointerType === "mouse" && event.button !== 0) return;

        readerInteraction.pointer = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            time: performance.now(),
            image: getReaderImage(event.target)
        };
        readerInteraction.dragging = false;

        resetStackTurn();

        try {
            stage.setPointerCapture(event.pointerId);
        } catch (_) { }
    });''',
    '''    stage.addEventListener("pointerdown", (event) => {
        if (
            state.mode !== "normal" ||
            readerInteraction.isTurning ||
            modeTransitioning
        ) return;
        if (event.pointerType === "mouse" && event.button !== 0) return;

        const spread = isSpreadView();
        readerInteraction.pointer = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            time: performance.now(),
            image: getReaderImage(event.target),
            spread
        };
        readerInteraction.dragging = false;

        if (!spread) {
            resetStackTurn();
        }

        try {
            stage.setPointerCapture(event.pointerId);
        } catch (_) { }
    });''',
    "unify reader pointerdown",
)

viewer = replace_once(
    viewer,
    '''            readerInteraction.isTurning ||
            !pointer ||
            pointer.id !== event.pointerId''',
    '''            readerInteraction.isTurning ||
            !pointer ||
            pointer.spread ||
            pointer.id !== event.pointerId''',
    "skip drag handling in spread view",
)

viewer = replace_once(
    viewer,
    '''        if (dx < 0) {
            stage.classList.remove("turn-prev");

            if (state.currentPage === state.pages.length - 1) {
                setDragX(dx * CONFIG.pageTurn.edgeResistance);
            } else {
                setDragX(dx);
            }
        } else {
            if (state.currentPage === 0) {
                stage.classList.remove("turn-prev");
                setDragX(dx * CONFIG.pageTurn.edgeResistance);
            } else {
                stage.classList.add("turn-prev");
                const returnX = -window.innerWidth + dx;
                setReturnX(Math.min(0, returnX));
            }
        }''',
    '''        if (dx < 0) {
            stage.classList.remove("turn-prev");
            setDragX(
                state.currentPage === state.pages.length - 1 ? 0 : dx
            );
        } else {
            if (state.currentPage === 0) {
                stage.classList.remove("turn-prev");
                setDragX(0);
            } else {
                stage.classList.add("turn-prev");
                const returnX = -window.innerWidth + dx;
                setReturnX(Math.min(0, returnX));
            }
        }''',
    "remove edge drag resistance",
)

viewer = replace_once(
    viewer,
    '''    function handleReaderTap(x) {
        const width = window.innerWidth;

        if (x < width * 0.32) {
            navigateBy(-1);
        } else if (x > width * 0.68) {
            navigateBy(1);
        }
    }
''',
    '''    function handleReaderTap(x) {
        const width = window.innerWidth;

        if (x < width * 0.32) {
            navigateBy(-1);
        } else if (x > width * 0.68) {
            navigateBy(1);
        }
    }

    function handleReaderPointerTap(pointer, x) {
        if (pointer.image) {
            openImageViewer(pointer.image);
            return;
        }

        handleReaderTap(x);
    }
''',
    "add unified pointer tap handler",
)

viewer = replace_once(
    viewer,
    '''        if (!readerInteraction.dragging) {
            if (pointer.image) {
                openImageViewer(pointer.image);
                return;
            }

            handleReaderTap(event.clientX);
            return;
        }
''',
    '''        if (pointer.spread || !readerInteraction.dragging) {
            handleReaderPointerTap(pointer, event.clientX);
            return;
        }
''',
    "unify image and page tap handling",
)

viewer = replace_once(
    viewer,
    '''            repaginate({ showLoading: true });''',
    '''            repaginate("resize");''',
    "resize repagination call",
)

style = replace_once(
    style,
    '''/* Overview uses native horizontal scrolling + scroll snap. */''',
    '''/* Overview uses native horizontal scrolling. */''',
    "update overview comment",
)

viewer_path.write_text(viewer, encoding="utf-8")
style_path.write_text(style, encoding="utf-8")
