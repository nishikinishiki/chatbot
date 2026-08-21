(() => {
    "use strict";

    function cssVar(name, fallback = "") {
        return (
            getComputedStyle(document.documentElement)
                .getPropertyValue(name)
                .trim() ||
            fallback
        );
    }

    function cssTimeMs(name, fallback) {
        const raw = cssVar(name);
        if (!raw) return fallback;

        const value = parseFloat(raw);
        if (!Number.isFinite(value)) return fallback;

        return raw.endsWith("ms")
            ? value
            : raw.endsWith("s")
                ? value * 1000
                : fallback;
    }

    const CONFIG = {
        font: {
            sizes: [14, 17, 20],
            labels: ["小", "中", "大"],
            defaultSize: 17
        },
        image: {
            minInlineScale: 0.65,
            fitIterations: 8
        },
        pageTurn: {
            duration: cssTimeMs(
                "--page-turn-duration",
                220
            ),
            thresholdRatio: 0.18,
            flickVelocity: 0.42,
            flickDistance: 24,
            edgeResistance: 0.15
        },
        overview: {
            minScale: 0.56,
            maxScale: 0.72,
            horizontalReserve: 118,
            verticalReserve: 176,
            transitionDuration: cssTimeMs(
                "--overview-transition-duration",
                390
            ),
            transitionEasing: cssVar(
                "--ease-standard",
                "cubic-bezier(.22,.61,.36,1)"
            ),
            navigationBaseDuration: 360,
            navigationPerViewport: 85,
            navigationMinDuration: 420,
            navigationMaxDuration: 950
        },
        timing: {
            resizeDebounce: 160
        }
    };

    const COLOPHON = {
        publisher: [
            "J.P.RETURNS 編集部",
            "https://jpreturns.com/",
            "〒100-6923 東京都千代田区丸の内 2-6-1 丸の内パークビルディング23階",
            "© J.P.Returns. All rights reserved"
        ],
        copyright: [
            "本書の全部または一部について、許可なく複製・転載・配信・改変すること、ならびに有償・無償を問わず第三者へ譲渡することを禁止します。"
        ],
        notice: [
            "本書は、情報提供および学習を目的として制作したものであり、特定の投資成果や将来の運用成績を保証するものではありません。",
            "本書の内容に基づく投資・運用その他の判断は、ご自身の責任において行ってください。これにより生じた損失その他の結果について、J.P.RETURNS株式会社は責任を負いかねます。",
            "なお、本書に記載されている情報・事例は執筆時点のものであり、今後変更される場合があります。"
        ]
    };

    function parseBookMarkdown(md) {
        const book = {
            title: "無題",
            published: "",
            cover: { src: "", alt: "表紙" },
            chapters: []
        };

        const parts = md.trim().split(/^---\s*$/m);
        const frontmatter = parts.length >= 3 ? parts[1] : "";
        const body = parts.length >= 3
            ? parts.slice(2).join("---")
            : md;

        frontmatter.split("\n").forEach((line) => {
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

        function flushParagraph() {
            if (!paragraphBuffer.length || !currentChapter) return;

            currentChapter.blocks.push({
                type: "paragraph",
                text: paragraphBuffer.join("\n")
            });
            paragraphBuffer = [];
        }

        body.split("\n").forEach((rawLine) => {
            const line = rawLine.trim();

            if (!line) {
                flushParagraph();
                return;
            }

            if (line.startsWith("# ")) {
                flushParagraph();
                currentChapter = {
                    title: line.replace(/^#\s+/, ""),
                    blocks: []
                };
                book.chapters.push(currentChapter);
                return;
            }

            if (!currentChapter) return;

            if (line.startsWith("## ")) {
                flushParagraph();
                currentChapter.blocks.push({
                    type: "h2",
                    text: line.replace(/^##\s+/, "")
                });
                return;
            }

            const image = line.match(/^!\[(.*?)\]\((.*?)\)$/);
            if (image) {
                flushParagraph();
                currentChapter.blocks.push({
                    type: "image",
                    alt: image[1],
                    src: image[2]
                });
                return;
            }

            paragraphBuffer.push(line);
        });

        flushParagraph();
        return book;
    }

    if (!window.bookMarkdown) {
        console.error("書籍データが見つかりません。data.jsが正しく読み込まれているか確認してください。");
        return;
    }

    const book = parseBookMarkdown(window.bookMarkdown);
    document.title = `${book.title} | JPリターンズ`;

    const fontButtonsHTML = CONFIG.font.sizes
        .map((size, index) =>
            `<button class="font-button" data-font-size="${size}" aria-pressed="false">${CONFIG.font.labels[index]}</button>`
        )
        .join("");

    document.body.innerHTML = `
    <div class="app" id="app">
      <header class="topbar">
        <button class="icon-button" id="tocOpenButton" aria-label="目次" title="目次">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 8h14v-2H7v2zm0-4h14v-2H7v2zm0-6v2h14V7H7z"/>
          </svg>
        </button>
        <div class="topbar__title" id="topbarTitle"></div>
        <div class="topbar__actions">
          <button class="text-button" id="displayButton" aria-label="文字サイズ" title="文字サイズ" popovertarget="displayPopover">Aa</button>

          <button class="icon-button" id="overviewButton" aria-label="俯瞰表示" title="俯瞰表示">
            <svg class="overview-enter-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z"/>
            </svg>
            <svg class="overview-exit-icon" viewBox="0 0 24 24" aria-hidden="true" hidden>
              <path d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 2v14h12V5H6Zm2 3h8v2H8V8Zm0 4h8v2H8v-2Z"/>
            </svg>
          </button>
        </div>
      </header>

      <main class="reader-shell">
        <div class="stage">
          <article class="page-card page-card--prev" id="prevPage"></article>
          <article class="page-card page-card--current" id="currentPage"></article>
          <article class="page-card page-card--next" id="nextPage"></article>
        </div>

        <div class="overview-scroller" id="overviewScroller" aria-label="ページ一覧">
          <div class="overview-strip" id="overviewStrip"></div>
        </div>
      </main>

      <footer class="bottom-bar">
        <input class="page-slider" id="pageSlider" type="range" min="1" max="1" step="0.01" value="1" />
        <div class="page-counter" id="pageCounter">1/1</div>
      </footer>

      <section class="popover" id="displayPopover" popover="auto">
        <h2 class="popover__title">文字サイズ</h2>
        <div class="font-control">${fontButtonsHTML}</div>
      </section>

      <dialog class="toc-dialog" id="tocDialog" aria-label="目次">
        <aside class="drawer" id="tocDrawer">
          <h2>目次</h2>
          <nav id="tocList"></nav>
        </aside>
      </dialog>

      <div class="loading" id="loading">ページを再計算しています…</div>
    </div>

    <dialog class="image-viewer" id="imageViewer" aria-label="画像拡大表示">
      <button class="image-viewer__close" id="imageViewerClose" type="button" aria-label="画像を閉じる">×</button>
      <div class="image-viewer__viewport" id="imageViewerViewport">
        <img class="image-viewer__image" id="imageViewerImage" alt="" draggable="false" />
      </div>
      <div class="image-viewer__hint">ピンチ / ホイールで拡大</div>
    </dialog>

    <div class="measure-host" aria-hidden="true">
      <article class="measure-page" id="measurePage">
        <div class="measure-body" id="measureBody"></div>
      </article>
    </div>
  `;

    const STORAGE = {
        currentPage: `reader-current-page:${new URL(".", location.href).pathname}`,
        fontSize: "reader-font-size"
    };
    const legacyCurrentPageKey = `reader-current-page-${book.title}`;

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    const storage = {
        getNumber(key, fallback) {
            try {
                const raw = localStorage.getItem(key);
                if (raw == null) return fallback;

                const value = Number(raw);
                return Number.isFinite(value) ? value : fallback;
            } catch {
                return fallback;
            }
        },
        set(key, value) {
            try {
                localStorage.setItem(key, String(value));
            } catch {
                // Some local/content URI environments can block localStorage.
            }
        }
    };

    const savedFontSize = storage.getNumber(
        STORAGE.fontSize,
        CONFIG.font.defaultSize
    );
    const savedCurrentPage = storage.getNumber(
        STORAGE.currentPage,
        storage.getNumber(legacyCurrentPageKey, 0)
    );

    const state = {
        pages: [],
        chapterStarts: [],
        currentPage: savedCurrentPage,
        fontSize: CONFIG.font.sizes.includes(savedFontSize)
            ? savedFontSize
            : CONFIG.font.defaultSize,
        mode: "normal"
    };

    const readerInteraction = {
        pointer: null,
        dragging: false,
        isTurning: false
    };

    const overviewInteraction = {
        dirty: true,
        step: null,
        scrollRaf: 0,
        sliderRaf: 0,
        sliderDragging: false,
        navigationRaf: 0
    };

    let modeTransitioning = false;
    let resizeTimer = null;

    const els = {
        app: document.getElementById("app"),
        topbarTitle: document.getElementById("topbarTitle"),
        currentPage: document.getElementById("currentPage"),
        prevPage: document.getElementById("prevPage"),
        nextPage: document.getElementById("nextPage"),
        overviewScroller: document.getElementById("overviewScroller"),
        overviewStrip: document.getElementById("overviewStrip"),
        pageSlider: document.getElementById("pageSlider"),
        pageCounter: document.getElementById("pageCounter"),
        displayButton: document.getElementById("displayButton"),
        displayPopover: document.getElementById("displayPopover"),
        overviewButton: document.getElementById("overviewButton"),
        overviewEnterIcon: document.querySelector("#overviewButton .overview-enter-icon"),
        overviewExitIcon: document.querySelector("#overviewButton .overview-exit-icon"),
        fontButtons: [...document.querySelectorAll(".font-button")],
        tocOpenButton: document.getElementById("tocOpenButton"),
        tocDialog: document.getElementById("tocDialog"),
        tocDrawer: document.getElementById("tocDrawer"),
        tocList: document.getElementById("tocList"),
        loading: document.getElementById("loading"),
        measurePage: document.getElementById("measurePage"),
        measureBody: document.getElementById("measureBody"),
        imageViewer: document.getElementById("imageViewer"),
        imageViewerViewport: document.getElementById("imageViewerViewport"),
        imageViewerImage: document.getElementById("imageViewerImage"),
        imageViewerClose: document.getElementById("imageViewerClose")
    };

    const stage = document.querySelector(".stage");
    let readerResizeObserver = null;

    const imageViewerGesture = {
        scale: 1,
        x: 0,
        y: 0,
        pointers: new Map(),
        panStart: null,
        pinchStart: null
    };

    function isImageViewerOpen() {
        return els.imageViewer.open;
    }

    function constrainImageViewerPan() {
        const width = els.imageViewerImage.offsetWidth * imageViewerGesture.scale;
        const height = els.imageViewerImage.offsetHeight * imageViewerGesture.scale;
        const maxX = Math.max(0, (width - els.imageViewerViewport.clientWidth) / 2);
        const maxY = Math.max(0, (height - els.imageViewerViewport.clientHeight) / 2);

        imageViewerGesture.x = clamp(imageViewerGesture.x, -maxX, maxX);
        imageViewerGesture.y = clamp(imageViewerGesture.y, -maxY, maxY);
    }

    function applyImageViewerTransform() {
        constrainImageViewerPan();
        els.imageViewerImage.style.transform =
            `translate3d(${imageViewerGesture.x}px, ${imageViewerGesture.y}px, 0) ` +
            `scale(${imageViewerGesture.scale})`;
    }

    function resetImageViewerTransform() {
        imageViewerGesture.scale = 1;
        imageViewerGesture.x = 0;
        imageViewerGesture.y = 0;
        imageViewerGesture.pointers.clear();
        imageViewerGesture.panStart = null;
        imageViewerGesture.pinchStart = null;
        applyImageViewerTransform();
    }

    function openImageViewer(sourceImage) {
        closeDisplayPopover();
        closeToc();

        els.imageViewerImage.src = sourceImage.currentSrc || sourceImage.src;
        els.imageViewerImage.alt = sourceImage.alt || "";
        resetImageViewerTransform();

        if (!els.imageViewer.open) {
            els.imageViewer.showModal();
        }
        els.imageViewerClose.focus({ preventScroll: true });
    }

    function closeImageViewer() {
        if (els.imageViewer.open) {
            els.imageViewer.close();
        }
    }

    function getReaderImage(target) {
        if (!(target instanceof Element)) return null;

        const image = target.closest(".book-image-block img");
        return image?.closest(".stage") ? image : null;
    }

    function imageViewerDistance(a, b) {
        return Math.hypot(a.x - b.x, a.y - b.y);
    }

    function startImageViewerPinch() {
        const points = [...imageViewerGesture.pointers.values()];
        if (points.length < 2) return;

        imageViewerGesture.pinchStart = {
            distance: Math.max(1, imageViewerDistance(points[0], points[1])),
            scale: imageViewerGesture.scale
        };
    }

    function endImageViewerPointer(event) {
        if (!imageViewerGesture.pointers.has(event.pointerId)) return;

        imageViewerGesture.pointers.delete(event.pointerId);
        imageViewerGesture.pinchStart = null;

        if (imageViewerGesture.pointers.size === 1) {
            const point = [...imageViewerGesture.pointers.values()][0];
            imageViewerGesture.panStart = {
                pointerX: point.x,
                pointerY: point.y,
                x: imageViewerGesture.x,
                y: imageViewerGesture.y
            };
        } else {
            imageViewerGesture.panStart = null;
        }

        try {
            els.imageViewerViewport.releasePointerCapture(event.pointerId);
        } catch (_) { }
    }

    document.addEventListener("click", (event) => {
        if (!isSpreadView()) return;

        const image = getReaderImage(event.target);
        if (!image) return;

        event.preventDefault();
        event.stopPropagation();
        openImageViewer(image);
    }, true);

    els.imageViewer.addEventListener("close", resetImageViewerTransform);
    els.imageViewerClose.addEventListener("click", closeImageViewer);

    els.imageViewerViewport.addEventListener("click", (event) => {
        if (event.target === els.imageViewerViewport) {
            closeImageViewer();
        }
    });

    els.imageViewerViewport.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;

        imageViewerGesture.pointers.set(event.pointerId, {
            x: event.clientX,
            y: event.clientY
        });

        try {
            els.imageViewerViewport.setPointerCapture(event.pointerId);
        } catch (_) { }

        if (imageViewerGesture.pointers.size === 1) {
            imageViewerGesture.panStart = {
                pointerX: event.clientX,
                pointerY: event.clientY,
                x: imageViewerGesture.x,
                y: imageViewerGesture.y
            };
        } else if (imageViewerGesture.pointers.size === 2) {
            startImageViewerPinch();
        }

        event.preventDefault();
    });

    els.imageViewerViewport.addEventListener("pointermove", (event) => {
        if (!imageViewerGesture.pointers.has(event.pointerId)) return;

        imageViewerGesture.pointers.set(event.pointerId, {
            x: event.clientX,
            y: event.clientY
        });

        if (imageViewerGesture.pointers.size >= 2) {
            if (!imageViewerGesture.pinchStart) {
                startImageViewerPinch();
            }

            const points = [...imageViewerGesture.pointers.values()];
            const distance = Math.max(1, imageViewerDistance(points[0], points[1]));
            const start = imageViewerGesture.pinchStart;

            imageViewerGesture.scale = clamp(
                start.scale * distance / start.distance,
                1,
                4
            );

            if (imageViewerGesture.scale === 1) {
                imageViewerGesture.x = 0;
                imageViewerGesture.y = 0;
            }

            applyImageViewerTransform();
            event.preventDefault();
            return;
        }

        if (
            imageViewerGesture.scale > 1 &&
            imageViewerGesture.panStart
        ) {
            imageViewerGesture.x =
                imageViewerGesture.panStart.x +
                event.clientX -
                imageViewerGesture.panStart.pointerX;
            imageViewerGesture.y =
                imageViewerGesture.panStart.y +
                event.clientY -
                imageViewerGesture.panStart.pointerY;
            applyImageViewerTransform();
        }

        event.preventDefault();
    });

    els.imageViewerViewport.addEventListener("pointerup", endImageViewerPointer);
    els.imageViewerViewport.addEventListener("pointercancel", endImageViewerPointer);

    els.imageViewerViewport.addEventListener("wheel", (event) => {
        if (!isImageViewerOpen()) return;

        event.preventDefault();

        imageViewerGesture.scale = clamp(
            imageViewerGesture.scale * (event.deltaY < 0 ? 1.18 : 0.85),
            1,
            4
        );

        if (imageViewerGesture.scale === 1) {
            imageViewerGesture.x = 0;
            imageViewerGesture.y = 0;
        }

        applyImageViewerTransform();
    }, { passive: false });

    els.imageViewerImage.addEventListener("dblclick", (event) => {
        event.preventDefault();
        event.stopPropagation();

        imageViewerGesture.scale = imageViewerGesture.scale > 1 ? 1 : 2;
        imageViewerGesture.x = 0;
        imageViewerGesture.y = 0;
        applyImageViewerTransform();
    });

    function createTextElement(tag, text, className = "") {
        const element = document.createElement(tag);
        element.textContent = text;
        if (className) element.className = className;
        return element;
    }

    function createParagraph(text, continuation = false) {
        const paragraph = createTextElement(
            "p",
            "",
            continuation ? "continuation" : ""
        );

        text.split("\n").forEach((line, index) => {
            if (index > 0) {
                paragraph.appendChild(document.createElement("br"));
            }
            paragraph.appendChild(document.createTextNode(line));
        });

        return paragraph;
    }

    function createImageBlock(block) {
        const figure = document.createElement("figure");
        figure.className = "book-image-block";

        const frame = document.createElement("div");
        frame.className = "book-image-frame";

        const img = document.createElement("img");
        img.src = block.src;
        img.alt = block.alt || "";
        img.draggable = false;
        frame.appendChild(img);

        const zoomIcon = document.createElement("span");
        zoomIcon.className = "book-image-zoom-icon";
        zoomIcon.setAttribute("aria-hidden", "true");
        zoomIcon.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path d="M7 14H5v5h5v-2H7v-3Zm-2-4h2V7h3V5H5v5Zm12 7h-3v2h5v-5h-2v3Zm-3-12v2h3v3h2V5h-5Z"/>
            </svg>
        `;
        frame.appendChild(zoomIcon);

        figure.appendChild(frame);

        if (block.alt) {
            figure.appendChild(
                createTextElement(
                    "figcaption",
                    block.alt,
                    "book-image-caption"
                )
            );
        }

        return figure;
    }

    function applyImageBlockScale(figure, scale, baseFrameWidth, baseImageHeight) {
        const frame = figure.querySelector(".book-image-frame");
        const image = frame?.querySelector("img");
        if (!frame || !image) return;

        frame.style.width = `${(baseFrameWidth * scale).toFixed(1)}px`;
        frame.style.marginInline = "auto";
        image.style.maxHeight = `${(baseImageHeight * scale).toFixed(1)}px`;
    }

    function resetImageBlockScale(figure) {
        const frame = figure.querySelector(".book-image-frame");
        const image = frame?.querySelector("img");
        if (!frame || !image) return;

        frame.style.removeProperty("width");
        frame.style.removeProperty("margin-inline");
        image.style.removeProperty("max-height");
    }

    function fitImageBlockToCurrentPage(figure) {
        const frame = figure.querySelector(".book-image-frame");
        const image = frame?.querySelector("img");
        if (!frame || !image) return false;

        const baseFrameWidth = frame.getBoundingClientRect().width;
        const baseImageHeight = image.getBoundingClientRect().height;

        if (baseFrameWidth <= 0 || baseImageHeight <= 0) return false;

        let low = CONFIG.image.minInlineScale;
        let high = 1;
        let best = low;

        applyImageBlockScale(figure, low, baseFrameWidth, baseImageHeight);

        if (!fitsMeasureBody()) {
            resetImageBlockScale(figure);
            return false;
        }

        for (let i = 0; i < CONFIG.image.fitIterations; i += 1) {
            const mid = (low + high) / 2;
            applyImageBlockScale(figure, mid, baseFrameWidth, baseImageHeight);

            if (fitsMeasureBody()) {
                best = mid;
                low = mid;
            } else {
                high = mid;
            }
        }

        applyImageBlockScale(figure, best, baseFrameWidth, baseImageHeight);
        return true;
    }

    function moveBlockToNewPage(node, chapterIndex) {
        node.remove();

        if (els.measureBody.childNodes.length) {
            commitMeasuredPage(chapterIndex);
        }

        els.measureBody.appendChild(node);
    }

    function paginateImageBlock(block, chapterIndex) {
        const node = createImageBlock(block);
        els.measureBody.appendChild(node);

        if (fitsMeasureBody()) return;

        if (fitImageBlockToCurrentPage(node)) return;

        resetImageBlockScale(node);
        moveBlockToNewPage(node, chapterIndex);

        if (!fitsMeasureBody()) {
            fitImageBlockToCurrentPage(node);
        }
    }

    function fitsMeasureBody() {
        return els.measureBody.scrollHeight <= els.measureBody.clientHeight + 0.5;
    }

    function commitMeasuredPage(chapterIndex = 0, type = "text") {
        const html = els.measureBody.innerHTML.trim();
        if (!html) return;

        state.pages.push({
            bodyHTML: html,
            chapterIndex,
            type
        });

        els.measureBody.innerHTML = "";
    }

    function findLargestFittingPrefix(paragraphText, continuation) {
        let low = 1;
        let high = paragraphText.length;
        let best = 0;

        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const node = createParagraph(paragraphText.slice(0, mid), continuation);
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

    function paginateParagraph(text, chapterIndex) {
        let remaining = text;
        let continuation = false;

        while (remaining.length > 0) {
            const fullNode = createParagraph(remaining, continuation);
            els.measureBody.appendChild(fullNode);

            if (fitsMeasureBody()) {
                return;
            }

            fullNode.remove();

            const fittingLength = findLargestFittingPrefix(remaining, continuation);

            if (fittingLength === 0) {
                const trailingHeading = els.measureBody.lastElementChild;

                if (trailingHeading?.tagName === "H2") {
                    moveBlockToNewPage(trailingHeading, chapterIndex);
                    continue;
                }

                commitMeasuredPage(chapterIndex);
                continue;
            }

            const fittingText = remaining.slice(0, fittingLength);
            els.measureBody.appendChild(createParagraph(fittingText, continuation));
            commitMeasuredPage(chapterIndex);

            remaining = remaining.slice(fittingLength);
            continuation = true;
        }
    }

    function createColophonSection() {
        const section = document.createElement("section");
        section.className = "colophon";
        return section;
    }

    function getColophonBlocks() {
        return [
            { text: "【発行日】", className: "colophon__label" },
            { text: book.published, className: "colophon__text" },
            { text: "【発行元】", className: "colophon__label" },
            ...COLOPHON.publisher.map((text) => ({
                text,
                className: "colophon__text"
            })),
            ...COLOPHON.copyright.map((text) => ({
                text,
                className: "colophon__text"
            })),
            { text: "【注意】", className: "colophon__label" },
            ...COLOPHON.notice.map((text) => ({
                text,
                className: "colophon__text"
            }))
        ];
    }

    function paginateColophon() {
        const chapterIndex = book.chapters.length - 1;

        if (els.measureBody.childNodes.length) {
            commitMeasuredPage(chapterIndex);
        }

        let section = createColophonSection();
        els.measureBody.appendChild(section);

        const startNewPage = () => {
            commitMeasuredPage(chapterIndex, "colophon");
            section = createColophonSection();
            els.measureBody.appendChild(section);
        };

        getColophonBlocks().forEach(({ text, className }) => {
            const element = createTextElement("p", text, className);
            section.appendChild(element);

            if (fitsMeasureBody()) return;

            element.remove();
            startNewPage();
            section.appendChild(element);
        });

        if (els.measureBody.childNodes.length) {
            commitMeasuredPage(chapterIndex, "colophon");
        }
    }

    function paginateBook() {
        state.pages = [];
        state.chapterStarts = [];
        els.measureBody.innerHTML = "";

        state.pages.push({
            bodyHTML: `<img class="cover-image" src="${book.cover.src}" alt="${book.cover.alt}">`,
            chapterIndex: -1,
            type: "cover"
        });

        book.chapters.forEach((chapter, chapterIndex) => {
            if (els.measureBody.childNodes.length > 0) {
                commitMeasuredPage(Math.max(0, chapterIndex - 1));
            }

            state.chapterStarts[chapterIndex] = state.pages.length;
            els.measureBody.appendChild(
                createTextElement("h1", chapter.title)
            );

            chapter.blocks.forEach((block) => {
                switch (block.type) {
                    case "image":
                        paginateImageBlock(block, chapterIndex);
                        break;
                    case "h2": {
                        const node = createTextElement("h2", block.text);
                        els.measureBody.appendChild(node);

                        if (!fitsMeasureBody()) {
                            moveBlockToNewPage(node, chapterIndex);
                        }
                        break;
                    }
                    case "paragraph":
                        paginateParagraph(block.text, chapterIndex);
                        break;
                    default:
                        console.warn(`Unsupported book block type: ${block.type}`);
                }
            });

            if (els.measureBody.childNodes.length > 0) {
                commitMeasuredPage(chapterIndex);
            }
        });

        paginateColophon();
    }

    function renderPageCard(target, pageIndex) {
        if (pageIndex < 0 || pageIndex >= state.pages.length) {
            target.classList.add("is-empty");
            target.classList.remove("cover-card", "colophon-card");
            target.innerHTML = "";
            return;
        }

        const page = state.pages[pageIndex];
        target.classList.remove("is-empty");
        target.classList.toggle("cover-card", page.type === "cover");
        target.classList.toggle("colophon-card", page.type === "colophon");
        target.innerHTML = `<div class="page-body">${page.bodyHTML}</div>`;
    }

    function currentChapterTitle() {
        const page = state.pages[state.currentPage];

        if (!page) return book.title;
        if (page.type === "cover") return book.title;
        if (page.type === "colophon") return "";

        const index = page.chapterIndex ?? 0;
        return book.chapters[index]?.title ?? book.title;
    }

    function updateTocHighlight() {
        const page = state.pages[state.currentPage];
        const chapterIndex = page?.type === "cover" ? -1 : (page?.chapterIndex ?? 0);

        els.tocList.querySelectorAll(".toc-button").forEach((btn, idx) => {
            btn.classList.toggle("active", idx === chapterIndex);
        });
    }

    function clampPageIndex(index) {
        return clamp(index, 0, Math.max(0, state.pages.length - 1));
    }

    function configurePageSlider() {
        els.pageSlider.max = String(Math.max(1, state.pages.length));
    }

    function updateFontButtons() {
        els.fontButtons.forEach((button) => {
            button.setAttribute(
                "aria-pressed",
                String(Number(button.dataset.fontSize) === state.fontSize)
            );
        });
    }

    function updateReadingPositionUI(sliderValue = state.currentPage + 1) {
        els.pageSlider.value = String(sliderValue);
        els.pageCounter.textContent = `${state.currentPage + 1}/${state.pages.length}`;
        els.topbarTitle.textContent = currentChapterTitle();
        updateTocHighlight();
        storage.set(STORAGE.currentPage, state.currentPage);
    }

    function setCurrentPage(index, {
        render = false,
        syncUI = true,
        sliderValue = null
    } = {}) {
        state.currentPage = clampPageIndex(index);

        if (render) {
            renderPageStack();
        }

        if (syncUI) {
            updateReadingPositionUI(
                sliderValue ?? state.currentPage + 1
            );
        }
    }

    function isSpreadView() {
        const viewportWidth = document.documentElement.clientWidth;
        return viewportWidth > 0 && els.measurePage.offsetWidth < viewportWidth;
    }

    function getSpreadStart(index) {
        const page = clampPageIndex(index);
        if (page === 0) return 0;
        return page % 2 === 0 ? page - 1 : page;
    }

    function renderPageStack() {
        if (isSpreadView()) {
            const start = getSpreadStart(state.currentPage);

            resetStackTurn();
            renderPageCard(els.currentPage, start);
            renderPageCard(els.prevPage, -1);
            renderPageCard(
                els.nextPage,
                start === 0 ? -1 : start + 1
            );
            return;
        }

        renderPageCard(els.currentPage, state.currentPage);
        renderPageCard(els.prevPage, state.currentPage - 1);
        renderPageCard(els.nextPage, state.currentPage + 1);
    }

    function updateOverviewGeometry() {
        const width = els.measurePage.offsetWidth;
        const height = els.measurePage.offsetHeight;

        const widthScale =
            (width - CONFIG.overview.horizontalReserve) / width;
        const heightScale =
            (height - CONFIG.overview.verticalReserve) / height;

        const scale = clamp(
            Math.min(widthScale, heightScale),
            CONFIG.overview.minScale,
            CONFIG.overview.maxScale
        );

        const itemWidth = width * scale;
        const itemHeight = height * scale;
        const overviewViewportWidth = els.overviewScroller.clientWidth;

        const sidePad = Math.max(
            0,
            (overviewViewportWidth - itemWidth) / 2
        );

        document.documentElement.style.setProperty(
            "--overview-scale",
            scale.toFixed(4)
        );
        document.documentElement.style.setProperty(
            "--overview-item-width",
            `${itemWidth.toFixed(1)}px`
        );
        document.documentElement.style.setProperty(
            "--overview-item-height",
            `${itemHeight.toFixed(1)}px`
        );
        document.documentElement.style.setProperty(
            "--overview-side-pad",
            `${sidePad.toFixed(1)}px`
        );

        overviewInteraction.step = null;
    }

    function renderOverviewStrip() {
        const fragment = document.createDocumentFragment();

        state.pages.forEach((_, index) => {
            const item = document.createElement("div");
            item.className = "overview-item";
            item.dataset.index = String(index);

            const card = document.createElement("article");
            card.className = "page-card";
            renderPageCard(card, index);

            item.appendChild(card);
            fragment.appendChild(item);
        });

        els.overviewStrip.replaceChildren(fragment);
    }

    function getOverviewStep() {
        if (overviewInteraction.step != null) {
            return overviewInteraction.step;
        }

        const first = els.overviewStrip.children[0];
        if (!first) return null;

        const second = els.overviewStrip.children[1];
        overviewInteraction.step = second
            ? second.offsetLeft - first.offsetLeft
            : first.offsetWidth;

        return overviewInteraction.step;
    }

    function setOverviewSnapSuppressed(suppressed) {
        els.overviewScroller.classList.toggle(
            "slider-dragging",
            suppressed
        );
    }

    function cancelOverviewNavigation() {
        if (!overviewInteraction.navigationRaf) return;

        cancelAnimationFrame(overviewInteraction.navigationRaf);
        overviewInteraction.navigationRaf = 0;
        setOverviewSnapSuppressed(false);
    }

    function getOverviewScrollLeftForPage(index) {
        const step = getOverviewStep();
        if (step == null) return null;

        return clampPageIndex(index) * step;
    }

    function scrollOverviewToPage(index, behavior = "auto") {
        const left = getOverviewScrollLeftForPage(index);
        if (left == null) return;

        els.overviewScroller.scrollTo({
            left,
            behavior
        });
    }

    function scrollOverviewToPageAnimated(index) {
        const targetIndex = clampPageIndex(index);
        const targetLeft = getOverviewScrollLeftForPage(targetIndex);

        if (targetLeft == null) return;

        cancelOverviewNavigation();

        const scroller = els.overviewScroller;
        const startLeft = scroller.scrollLeft;
        const distance = Math.abs(targetLeft - startLeft);

        if (distance < 1) {
            setCurrentPage(targetIndex);
            scrollOverviewToPage(targetIndex);
            return;
        }

        const duration = clamp(
            CONFIG.overview.navigationBaseDuration +
            distance / Math.max(1, scroller.clientWidth) *
            CONFIG.overview.navigationPerViewport,
            CONFIG.overview.navigationMinDuration,
            CONFIG.overview.navigationMaxDuration
        );

        const startTime = performance.now();
        setOverviewSnapSuppressed(true);

        const tick = (now) => {
            const progress = clamp(
                (now - startTime) / duration,
                0,
                1
            );
            const eased = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            scroller.scrollLeft =
                startLeft +
                (targetLeft - startLeft) * eased;

            if (progress < 1) {
                overviewInteraction.navigationRaf = requestAnimationFrame(tick);
                return;
            }

            overviewInteraction.navigationRaf = 0;
            setOverviewSnapSuppressed(false);
            setCurrentPage(targetIndex);
            scrollOverviewToPage(targetIndex);
        };

        overviewInteraction.navigationRaf = requestAnimationFrame(tick);
    }

    function syncOverviewPosition(fractionalIndex) {
        const sliderValue = fractionalIndex + 1;
        const nearestIndex = clampPageIndex(Math.round(fractionalIndex));

        if (nearestIndex === state.currentPage) {
            els.pageSlider.value = String(sliderValue);
            return;
        }

        setCurrentPage(nearestIndex, { sliderValue });
    }

    function queueOverviewSliderPosition() {
        if (overviewInteraction.sliderRaf) return;

        overviewInteraction.sliderRaf = requestAnimationFrame(() => {
            overviewInteraction.sliderRaf = 0;

            const step = getOverviewStep();
            if (step == null) return;

            const sliderValue = clamp(
                Number(els.pageSlider.value),
                1,
                Math.max(1, state.pages.length)
            );
            const fractionalIndex = sliderValue - 1;

            els.overviewScroller.scrollLeft = fractionalIndex * step;
            syncOverviewPosition(fractionalIndex);
        });
    }

    function syncPageFromOverviewScroll() {
        if (overviewInteraction.sliderDragging) return;

        cancelAnimationFrame(overviewInteraction.scrollRaf);

        overviewInteraction.scrollRaf = requestAnimationFrame(() => {
            const step = getOverviewStep();
            if (!step || step <= 0) return;

            const fractionalIndex = clamp(
                els.overviewScroller.scrollLeft / step,
                0,
                Math.max(0, state.pages.length - 1)
            );

            syncOverviewPosition(fractionalIndex);
        });
    }

    function markOverviewDirty() {
        overviewInteraction.dirty = true;
        overviewInteraction.step = null;
    }

    function ensureOverviewStrip() {
        if (!overviewInteraction.dirty) return;

        renderOverviewStrip();
        overviewInteraction.dirty = false;
    }

    function nextPaint() {
        return new Promise((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(resolve));
        });
    }

    const MORPH_ANIMATION_OPTIONS = {
        duration: CONFIG.overview.transitionDuration,
        easing: CONFIG.overview.transitionEasing,
        fill: "forwards"
    };

    function getOverviewMorphTransforms() {
        const scale = parseFloat(cssVar("--overview-scale"));
        const step = getOverviewStep();

        return {
            current: `translate3d(0,0,0) scale(${scale})`,
            prev: `translate3d(${-step}px,0,0) scale(${scale})`,
            next: `translate3d(${step}px,0,0) scale(${scale})`
        };
    }

    function setMorphStart(toOverview, transforms) {
        const full = "translate3d(0,0,0) scale(1)";
        stage.classList.toggle("morph-elevated", !toOverview);

        els.currentPage.style.transform =
            toOverview ? full : transforms.current;
        els.currentPage.style.opacity = "1";

        [
            [els.prevPage, transforms.prev, state.currentPage > 0],
            [
                els.nextPage,
                transforms.next,
                state.currentPage < state.pages.length - 1
            ]
        ].forEach(([card, transform, visible]) => {
            card.style.transform = transform;
            card.style.opacity = String(toOverview ? 0 : visible ? 1 : 0);
        });
    }

    function createMorphAnimations(toOverview, transforms) {
        const full = "translate3d(0,0,0) scale(1)";
        stage.classList.toggle("morph-elevated", toOverview);

        const animations = [
            els.currentPage.animate(
                toOverview
                    ? [
                        { transform: full },
                        { transform: transforms.current }
                    ]
                    : [
                        { transform: transforms.current },
                        { transform: full }
                    ],
                MORPH_ANIMATION_OPTIONS
            )
        ];

        const sideFrames = toOverview
            ? [
                { opacity: 0 },
                { opacity: 0, offset: 0.35 },
                { opacity: 1 }
            ]
            : [
                { opacity: 1 },
                { opacity: 0, offset: 0.60 },
                { opacity: 0 }
            ];

        [
            [els.prevPage, state.currentPage > 0],
            [els.nextPage, state.currentPage < state.pages.length - 1]
        ].forEach(([card, visible]) => {
            if (visible) {
                animations.push(
                    card.animate(sideFrames, MORPH_ANIMATION_OPTIONS)
                );
            }
        });

        return animations;
    }

    function prepareStageMorph() {
        resetStackTurn();
        stage.classList.add("mode-morph");

        [
            [els.prevPage, 2],
            [els.nextPage, 2],
            [els.currentPage, 4]
        ].forEach(([card, zIndex]) => {
            card.style.zIndex = String(zIndex);
        });
    }

    function clearMorphCard(card) {
        [
            "z-index",
            "transform",
            "opacity"
        ].forEach((property) => card.style.removeProperty(property));
    }

    function waitForAnimations(animations) {
        return Promise.allSettled(
            animations.map((animation) => animation.finished)
        );
    }

    function cleanupModeMorph(animations) {
        animations.forEach((animation) => animation.cancel());
        stage.classList.remove("mode-morph", "morph-elevated");

        [
            els.prevPage,
            els.currentPage,
            els.nextPage
        ].forEach(clearMorphCard);
    }

    async function transitionMode(mode) {
        const toOverview = mode === "overview";

        closeOverlays();
        modeTransitioning = true;

        ensureOverviewStrip();
        if (toOverview) {
            updateOverviewGeometry();
        }
        scrollOverviewToPage(state.currentPage, "auto");
        await nextPaint();

        if (!toOverview) {
            setCurrentPage(state.currentPage, { render: true });
        }

        const transforms = getOverviewMorphTransforms();
        prepareStageMorph();

        setMorphStart(toOverview, transforms);
        await nextPaint();

        if (!toOverview) {
            applyAppMode(mode);
        }

        const animations = createMorphAnimations(toOverview, transforms);
        await waitForAnimations(animations);

        if (toOverview) {
            applyAppMode(mode);
            await nextPaint();
        }

        cleanupModeMorph(animations);
        modeTransitioning = false;
    }

    function updateOverviewButton() {
        const active = state.mode === "overview";

        els.overviewButton.classList.toggle("is-active", active);
        els.overviewButton.setAttribute(
            "aria-label",
            active ? "通常表示に戻る" : "俯瞰表示"
        );
        els.overviewButton.setAttribute(
            "title",
            active ? "通常表示に戻る" : "俯瞰表示"
        );

        els.overviewEnterIcon.hidden = active;
        els.overviewExitIcon.hidden = !active;
    }

    function applyAppMode(mode) {
        state.mode = mode;
        els.app.classList.toggle("overview", mode === "overview");
        updateOverviewButton();
    }

    function closeOverlays() {
        closeDisplayPopover();
        closeToc();
    }

    function setMode(mode) {
        if (mode === state.mode || modeTransitioning) return;

        if (isSpreadView()) {
            closeOverlays();

            if (mode === "overview") {
                ensureOverviewStrip();
                updateOverviewGeometry();
                scrollOverviewToPage(state.currentPage, "auto");
                applyAppMode("overview");
            } else {
                setCurrentPage(state.currentPage, { render: true });
                applyAppMode("normal");
            }
            return;
        }

        transitionMode(mode);
    }

    function buildToc() {
        const fragment = document.createDocumentFragment();

        book.chapters.forEach((chapter, index) => {
            const button = document.createElement("button");
            button.className = "toc-button";
            button.dataset.chapterIndex = String(index);
            button.textContent = chapter.title;
            fragment.appendChild(button);
        });

        els.tocList.replaceChildren(fragment);
    }

    function setFontCss(size, {
        visible = true,
        measure = true
    } = {}) {
        if (visible) {
            document.documentElement.style.setProperty(
                "--reader-font-size",
                `${size}px`
            );
        }

        if (measure) {
            document.documentElement.style.setProperty(
                "--measure-font-size",
                `${size}px`
            );
        }
    }

    function refreshOverviewAfterPagination() {
        markOverviewDirty();

        if (state.mode !== "overview") return;

        ensureOverviewStrip();
        requestAnimationFrame(() => {
            scrollOverviewToPage(state.currentPage, "auto");
        });
    }

    function repaginate({
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

    function setFontSize(size, { repaginate: shouldRepaginate = true } = {}) {
        if (!CONFIG.font.sizes.includes(size)) return;

        state.fontSize = size;
        updateFontButtons();
        storage.set(STORAGE.fontSize, size);

        if (!shouldRepaginate) {
            setFontCss(size);
            return;
        }

        repaginate({
            anchorChapterStart: true,
            deferVisibleFont: true
        });
    }

    function closeDisplayPopover() {
        els.displayPopover.togglePopover(false);
    }

    function isTocOpen() {
        return els.tocDialog.open;
    }

    function openToc() {
        if (isTocOpen()) return;

        closeDisplayPopover();
        updateTocHighlight();
        els.tocDialog.showModal();
    }

    function closeToc() {
        if (isTocOpen()) {
            els.tocDialog.close();
        }
    }

    function toggleToc() {
        isTocOpen() ? closeToc() : openToc();
    }

    function setTurnShadow(progress) {
        stage.style.setProperty(
            "--turn-shadow-opacity",
            String(
                Math.min(
                    1,
                    Math.max(0, progress) * 1.25
                )
            )
        );
    }

    function setDragX(px) {
        stage.style.setProperty("--drag-x", `${px}px`);

        setTurnShadow(
            Math.abs(px) /
            Math.max(1, window.innerWidth)
        );
    }

    function setReturnX(px) {
        stage.style.setProperty("--return-x", `${px}px`);

        setTurnShadow(
            1 -
            Math.abs(px) /
            Math.max(1, window.innerWidth)
        );
    }

    function resetStackTurn() {
        stage.classList.remove("is-animating", "turn-prev");
        stage.style.setProperty("--drag-x", "0px");
        stage.style.setProperty("--return-x", "-100vw");
        stage.style.setProperty("--turn-shadow-opacity", "0");
    }

    function beginTurnAnimation() {
        readerInteraction.isTurning = true;
        stage.classList.add("is-animating");
    }

    function endTurnAnimation() {
        resetStackTurn();
        readerInteraction.isTurning = false;
        readerInteraction.dragging = false;
    }

    function finishTurn(delta) {
        if (readerInteraction.isTurning) return;

        const nextPage = state.currentPage + delta;

        if (nextPage < 0 || nextPage >= state.pages.length) {
            snapReaderBack();
            return;
        }

        beginTurnAnimation();

        if (delta > 0) {
            requestAnimationFrame(() => {
                setDragX(-window.innerWidth);
            });
        } else {
            stage.classList.add("turn-prev");
            requestAnimationFrame(() => {
                setReturnX(0);
            });
        }

        window.setTimeout(() => {
            setCurrentPage(nextPage, { render: true });
            endTurnAnimation();
        }, CONFIG.pageTurn.duration);
    }

    function snapReaderBack() {
        if (readerInteraction.isTurning) return;

        beginTurnAnimation();

        if (stage.classList.contains("turn-prev")) {
            requestAnimationFrame(() => {
                setReturnX(-window.innerWidth);
            });
        } else {
            requestAnimationFrame(() => {
                setDragX(0);
            });
        }

        window.setTimeout(() => {
            endTurnAnimation();
        }, CONFIG.pageTurn.duration);
    }

    function navigateSpread(delta) {
        const start = getSpreadStart(state.currentPage);
        const target = delta > 0
            ? start === 0 ? 1 : start + 2
            : start <= 1 ? 0 : start - 2;

        if (target < 0 || target >= state.pages.length) return;

        setCurrentPage(target, { render: true });
    }

    function navigateBy(delta) {
        if (state.mode === "normal") {
            if (isSpreadView()) {
                navigateSpread(delta);
            } else {
                finishTurn(delta);
            }
            return;
        }

        scrollOverviewToPage(
            clampPageIndex(state.currentPage + delta),
            "smooth"
        );
    }

    els.overviewStrip.addEventListener("click", (event) => {
        const item = event.target.closest(".overview-item");
        if (!item) return;

        const index = Number(item.dataset.index);
        if (!Number.isInteger(index)) return;

        setCurrentPage(index, { syncUI: false });
        setMode("normal");
    });

    els.tocList.addEventListener("click", (event) => {
        const button = event.target.closest(".toc-button");
        if (!button) return;

        const chapterIndex = Number(button.dataset.chapterIndex);
        if (!Number.isInteger(chapterIndex)) return;

        const targetPage = state.chapterStarts[chapterIndex] ?? 0;
        closeToc();

        if (state.mode === "normal") {
            setCurrentPage(targetPage, { render: true });
            return;
        }

        if (isSpreadView()) {
            setCurrentPage(targetPage, { render: true });
            applyAppMode("normal");
            return;
        }

        requestAnimationFrame(() => {
            scrollOverviewToPageAnimated(targetPage);
        });
    });

    function handleReaderTap(x) {
        const width = window.innerWidth;

        if (x < width * 0.32) {
            navigateBy(-1);
        } else if (x > width * 0.68) {
            navigateBy(1);
        }
    }

    stage.addEventListener("click", (event) => {
        if (
            !isSpreadView() ||
            state.mode !== "normal" ||
            modeTransitioning
        ) return;

        handleReaderTap(event.clientX);
    });

    stage.addEventListener("pointerdown", (event) => {
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
    });

    stage.addEventListener("pointermove", (event) => {
        const pointer = readerInteraction.pointer;

        if (
            state.mode !== "normal" ||
            readerInteraction.isTurning ||
            !pointer ||
            pointer.id !== event.pointerId
        ) {
            return;
        }

        let dx = event.clientX - pointer.x;
        const dy = event.clientY - pointer.y;

        if (!readerInteraction.dragging) {
            if (Math.abs(dx) < 7) return;

            if (Math.abs(dx) <= Math.abs(dy)) {
                return;
            }

            readerInteraction.dragging = true;
        }

        if (dx < 0) {
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
        }

        event.preventDefault();
    });

    function endReaderPointer(event) {
        const pointer = readerInteraction.pointer;
        if (!pointer || pointer.id !== event.pointerId) return;

        const rawDx = event.clientX - pointer.x;
        const totalTime = Math.max(
            1,
            performance.now() - pointer.time
        );
        const distance = Math.abs(rawDx);
        const speed = distance / totalTime;
        const threshold =
            window.innerWidth * CONFIG.pageTurn.thresholdRatio;

        readerInteraction.pointer = null;

        try {
            stage.releasePointerCapture(event.pointerId);
        } catch (_) { }

        if (!readerInteraction.dragging) {
            if (pointer.image) {
                openImageViewer(pointer.image);
                return;
            }

            handleReaderTap(event.clientX);
            return;
        }

        const shouldTurn =
            distance > threshold ||
            (
                distance > CONFIG.pageTurn.flickDistance &&
                speed >= CONFIG.pageTurn.flickVelocity
            );

        if (shouldTurn) {
            finishTurn(rawDx < 0 ? 1 : -1);
        } else {
            snapReaderBack();
        }
    }

    function cancelReaderPointer(event) {
        const pointer = readerInteraction.pointer;
        if (!pointer || pointer.id !== event.pointerId) return;

        readerInteraction.pointer = null;

        try {
            stage.releasePointerCapture(event.pointerId);
        } catch (_) { }

        if (readerInteraction.dragging) {
            snapReaderBack();
        } else {
            readerInteraction.dragging = false;
        }
    }

    stage.addEventListener("pointerup", endReaderPointer);
    stage.addEventListener("pointercancel", cancelReaderPointer);

    els.overviewScroller.addEventListener(
        "scroll",
        syncPageFromOverviewScroll,
        { passive: true }
    );

    els.overviewScroller.addEventListener(
        "pointerdown",
        cancelOverviewNavigation,
        { passive: true }
    );

    els.pageSlider.addEventListener("pointerdown", () => {
        if (state.mode !== "overview") return;

        cancelOverviewNavigation();
        overviewInteraction.sliderDragging = true;
        setOverviewSnapSuppressed(true);
    });

    els.pageSlider.addEventListener("input", (event) => {
        const position = Number(event.target.value);

        if (state.mode === "overview") {
            queueOverviewSliderPosition();
            return;
        }

        setCurrentPage(Math.round(position) - 1, { render: true });
    });

    function finishSliderDrag() {
        if (!overviewInteraction.sliderDragging) return;

        overviewInteraction.sliderDragging = false;
        setOverviewSnapSuppressed(false);

        cancelAnimationFrame(overviewInteraction.sliderRaf);
        overviewInteraction.sliderRaf = 0;

        const fractionalIndex = clamp(
            Number(els.pageSlider.value) - 1,
            0,
            Math.max(0, state.pages.length - 1)
        );

        const target = Math.round(fractionalIndex);

        setCurrentPage(target);
        scrollOverviewToPage(target, "smooth");
    }

    [
        "pointerup",
        "pointercancel",
        "change"
    ].forEach((type) => {
        els.pageSlider.addEventListener(type, finishSliderDrag);
    });

    els.displayPopover.addEventListener("beforetoggle", (event) => {
        if (event.newState === "open") closeToc();
    });

    els.overviewButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        setMode(state.mode === "overview" ? "normal" : "overview");
    });

    function scheduleRepagination(delay = CONFIG.timing.resizeDebounce) {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            repaginate({ showLoading: true });
        }, delay);
    }

    els.fontButtons.forEach((button) => {
        button.addEventListener("click", () => {
            setFontSize(Number(button.dataset.fontSize));
        });
    });

    els.tocOpenButton.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;

        event.preventDefault();
        event.stopPropagation();
        toggleToc();
    });

    els.tocOpenButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
    });

    els.tocDialog.addEventListener("click", (event) => {
        if (event.target === els.tocDialog) {
            closeToc();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "ArrowRight" || event.key === "PageDown") {
            event.preventDefault();
            navigateBy(1);
        }

        if (event.key === "ArrowLeft" || event.key === "PageUp") {
            event.preventDefault();
            navigateBy(-1);
        }

        if (event.key === " ") {
            event.preventDefault();
            if (state.mode === "normal") {
                navigateBy(1);
            } else {
                setMode("normal");
            }
        }

        if (event.key === "Escape") {
            if (state.mode === "overview") {
                setMode("normal");
            }
            closeToc();
        }
    });

    function handleReaderResize() {
        updateOverviewGeometry();
        scheduleRepagination();
    }

    function startReaderResizeTracking() {
        let width = els.measureBody.clientWidth;
        let height = els.measureBody.clientHeight;

        const handleSizeChange = () => {
            const nextWidth = els.measureBody.clientWidth;
            const nextHeight = els.measureBody.clientHeight;

            if (nextWidth === width && nextHeight === height) return;

            width = nextWidth;
            height = nextHeight;
            handleReaderResize();
        };

        if (typeof ResizeObserver === "function") {
            readerResizeObserver = new ResizeObserver(handleSizeChange);
            readerResizeObserver.observe(els.measureBody);
            return;
        }

        window.addEventListener("resize", handleSizeChange);
    }

    function preloadBookImages() {
        const sources = new Set([
            book.cover.src,
            ...book.chapters.flatMap((chapter) =>
                chapter.blocks
                    .filter((block) => block.type === "image")
                    .map((block) => block.src)
            )
        ].filter(Boolean));

        return Promise.all([...sources].map((src) => {
            const image = new Image();
            image.src = src;
            return image.decode().catch(() => { });
        }));
    }

    async function init() {
        updateOverviewButton();
        updateOverviewGeometry();
        setFontSize(state.fontSize, { repaginate: false });

        await Promise.all([
            document.fonts.ready,
            preloadBookImages()
        ]);
        await nextPaint();

        paginateBook();
        buildToc();
        configurePageSlider();
        markOverviewDirty();

        setCurrentPage(state.currentPage, { render: true });
        els.loading.hidden = true;
        startReaderResizeTracking();
    }

    init();
})();