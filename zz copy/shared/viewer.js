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

    const CONFIG = Object.freeze({
        font: {
            min: 14,
            max: 32,
            step: 2,
            defaultSize: 20
        },
        pageTurn: {
            duration: cssTimeMs(
                "--page-turn-duration",
                220
            ),
            thresholdRatio: 0.18,
            flickVelocity: 0.42,
            flickDistance: 24
        },
        overview: {
            minScale: 0.56,
            maxScale: 0.72,
            horizontalReserve: 118,
            verticalReserve: 176,
            mobileBreakpoint: 720,
            mobileGap: 18,
            desktopGap: 28,
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
            resizeDebounce: 160,
            fullscreenRepaginate: 180,
            fontRepaginateDebounce: 70
        }
    });

    function parseBookMarkdown(md) {
        const book = {
            title: "無題",
            author: "不明",
            cover: { src: "", alt: "表紙" },
            chapters: [],
            colophon: { title: "奥付", rows: [], notes: [] }
        };

        const lines = md.split('\n');
        let state = 'start'; // 状態管理
        let currentChapter = null;
        let paragraphBuffer = [];

        // 溜まったテキストを1つの段落ブロックとして確定する
        function flushParagraph() {
            if (paragraphBuffer.length > 0 && currentChapter) {
                currentChapter.blocks.push({
                    type: 'paragraph',
                    text: paragraphBuffer.join('') // 日本語なので改行を詰めて結合
                });
                paragraphBuffer = [];
            }
        }

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (state === 'start' && line === '---') {
                state = 'frontmatter';
                continue;
            }

            if (state === 'frontmatter') {
                if (line === '---') {
                    state = 'body';
                    continue;
                }
                const match = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
                if (match) {
                    const key = match[1];
                    const val = match[2];
                    if (key === 'title') book.title = val;
                    if (key === 'author') book.author = val;
                    if (key === 'cover') book.cover.src = val;
                }
                continue;
            }

            // 空行が来たら段落を区切る
            if (line === '') {
                flushParagraph();
                continue;
            }

            // 章の始まり（H1）
            if (line.startsWith('# ')) {
                flushParagraph();
                const title = line.replace(/^#\s+/, '');
                if (title === '奥付') {
                    state = 'colophon';
                } else {
                    state = 'body';
                    currentChapter = { title: title, blocks: [] };
                    book.chapters.push(currentChapter);
                }
                continue;
            }

            // 本文の処理
            if (state === 'body') {
                // 小見出し（H2）
                if (line.startsWith('## ')) {
                    flushParagraph();
                    if (currentChapter) {
                        currentChapter.blocks.push({ type: 'h2', text: line.replace(/^##\s+/, '') });
                    }
                    continue;
                }

                // 画像
                const imgMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/);
                if (imgMatch) {
                    flushParagraph();
                    if (currentChapter) {
                        currentChapter.blocks.push({
                            type: 'image',
                            alt: imgMatch[1],
                            caption: imgMatch[1],
                            src: imgMatch[2]
                        });
                    }
                    continue;
                }

                // 普通のテキスト（段落バッファに追加）
                paragraphBuffer.push(line);
            }

            // 奥付の処理
            if (state === 'colophon') {
                if (line.startsWith('- ')) {
                    const text = line.replace(/^-\s+/, '');
                    const match = text.match(/^(.*?)(?:[:：])\s*(.*)$/);
                    if (match) {
                        book.colophon.rows.push([match[1].trim(), match[2].trim()]);
                    } else {
                        book.colophon.rows.push(["", text]);
                    }
                } else if (line.startsWith('> ')) {
                    book.colophon.notes.push(line.replace(/^>\s+/, ''));
                }
            }
        }
        flushParagraph(); // 最後の段落を確定

        return book;
    }

    // マークダウンデータが存在すれば変換し、bookDataとして扱う
    let book = window.bookData;
    if (window.bookMarkdown) {
        book = parseBookMarkdown(window.bookMarkdown);
        window.bookData = book; // グローバルにセット（エラー回避用）
    }
    
    if (!book) {
        console.error("書籍データが見つかりません。data.jsが正しく読み込まれているか確認してください。");
        return;
    }

    document.body.innerHTML = `
    <div class="app normal" id="app">
      <header class="topbar" id="topbar">
        <button class="icon-button" id="tocOpenButton" aria-label="目次" title="目次">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 8h14v-2H7v2zm0-4h14v-2H7v2zm0-6v2h14V7H7z"/>
          </svg>
        </button>
        <div class="topbar__title" id="topbarTitle"></div>
        <div class="topbar__actions">
          <button class="text-button" id="displayButton" aria-label="文字サイズ" title="文字サイズ">Aa</button>

          <button class="icon-button" id="fullscreenButton" aria-label="全画面表示" title="全画面表示">
            <svg class="fullscreen-enter-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 14H5v5h5v-2H7v-3Zm-2-4h2V7h3V5H5v5Zm12 7h-3v2h5v-5h-2v3Zm-3-12v2h3v3h2V5h-5Z"/>
            </svg>
            <svg class="fullscreen-exit-icon" viewBox="0 0 24 24" aria-hidden="true" hidden>
              <path d="M5 16h3v3h2v-5H5v2Zm3-8H5v2h5V5H8v3Zm6 11h2v-3h3v-2h-5v5Zm2-11V5h-2v5h5V8h-3Z"/>
            </svg>
          </button>
        </div>
      </header>

      <main class="reader-shell">
        <div class="stage">
          <article class="page-card page-card--prev" id="prevPage"></article>
          <article class="page-card page-card--current" id="currentPage"></article>
          <article class="page-card page-card--next" id="nextPage"></article>

          <div class="tap-zone tap-zone--left" id="tapLeft" aria-hidden="true"></div>
          <div class="tap-zone tap-zone--center" id="tapCenter" aria-hidden="true"></div>
          <div class="tap-zone tap-zone--right" id="tapRight" aria-hidden="true"></div>
        </div>

        <div class="overview-scroller" id="overviewScroller" aria-label="ページ一覧">
          <div class="overview-strip" id="overviewStrip"></div>
        </div>
      </main>

      <footer class="bottom-bar" id="bottomBar">
        <input class="page-slider" id="pageSlider" type="range" min="1" max="1" step="0.01" value="1" />
        <div class="page-counter" id="pageCounter">1/1</div>
      </footer>

      <section class="popover" id="displayPopover" aria-hidden="true">
        <h2 class="popover__title">文字サイズ</h2>
        <div class="font-control">
          <button class="font-button" id="fontDown" aria-label="文字を小さく">A−</button>
          <div class="font-value" id="fontValue">20 px</div>
          <button class="font-button" id="fontUp" aria-label="文字を大きく">A＋</button>
        </div>
      </section>

      <div class="scrim" id="scrim" aria-hidden="true"></div>

      <aside class="drawer" id="tocDrawer" aria-hidden="true">
        <h2>目次</h2>
        <nav id="tocList"></nav>
      </aside>

      <div class="loading" id="loading">ページを再計算しています…</div>

    </div>

    <div class="measure-host" aria-hidden="true">
      <article class="measure-page" id="measurePage">
        <div class="measure-body" id="measureBody"></div>
        <div class="measure-page__footer-placeholder"></div>
      </article>
    </div>
  `;

    const STORAGE = Object.freeze({
        currentPage: `reader-current-page-${book.title}`,
        fontSize: "reader-font-size"
    });

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    const storage = {
        getNumber(key, fallback) {
            try {
                const value = Number(localStorage.getItem(key));
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

    /* Minimal placeholder image for this reader demo. */
    function svgDataUri(svg) {
        return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
    }

    const sampleImage = svgDataUri(`
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1200"
      height="800"
      viewBox="0 0 1200 800"
    >
      <rect
        width="1200"
        height="800"
        fill="#f2f2f2"
      />
      <rect
        x="24"
        y="24"
        width="1152"
        height="752"
        rx="20"
        fill="none"
        stroke="#c8c8c8"
        stroke-width="4"
      />
      <text
        x="600"
        y="400"
        dominant-baseline="middle"
        text-anchor="middle"
        font-family="sans-serif"
        font-size="72"
        font-weight="600"
        fill="#777"
      >サンプル画像</text>
    </svg>
  `);

    const state = {
        pages: [],
        chapterStarts: [],
        currentPage: storage.getNumber(STORAGE.currentPage, 0),
        fontSize: storage.getNumber(STORAGE.fontSize, CONFIG.font.defaultSize),
        mode: "normal",

        resizeTimer: null,
        pointerId: null,
        pointerStartX: 0,
        pointerStartY: 0,
        pointerStartTime: 0,
        dragging: false,
        suppressTap: false,
        isTurning: false,
        modeTransitioning: false,

        overviewDirty: true,
        overviewMetrics: null,
        overviewScrollRaf: 0,
        overviewProgrammaticScrollRaf: 0,
        sliderRaf: 0,
        sliderDragging: false,
        pendingSliderPosition: 1,

        fontRepaginateTimer: null
    };

    const els = {
        app: document.getElementById("app"),
        topbar: document.getElementById("topbar"),
        bottomBar: document.getElementById("bottomBar"),
        topbarTitle: document.getElementById("topbarTitle"),
        currentPage: document.getElementById("currentPage"),
        prevPage: document.getElementById("prevPage"),
        nextPage: document.getElementById("nextPage"),
        overviewScroller: document.getElementById("overviewScroller"),
        overviewStrip: document.getElementById("overviewStrip"),
        tapLeft: document.getElementById("tapLeft"),
        tapCenter: document.getElementById("tapCenter"),
        tapRight: document.getElementById("tapRight"),
        pageSlider: document.getElementById("pageSlider"),
        pageCounter: document.getElementById("pageCounter"),
        displayButton: document.getElementById("displayButton"),
        displayPopover: document.getElementById("displayPopover"),
        fullscreenButton: document.getElementById("fullscreenButton"),
        fullscreenEnterIcon: document.querySelector("#fullscreenButton .fullscreen-enter-icon"),
        fullscreenExitIcon: document.querySelector("#fullscreenButton .fullscreen-exit-icon"),
        fontDown: document.getElementById("fontDown"),
        fontUp: document.getElementById("fontUp"),
        fontValue: document.getElementById("fontValue"),
        tocOpenButton: document.getElementById("tocOpenButton"),
        tocDrawer: document.getElementById("tocDrawer"),
        tocList: document.getElementById("tocList"),
        scrim: document.getElementById("scrim"),
        loading: document.getElementById("loading"),
        measureBody: document.getElementById("measureBody")
    };

    // ============================================================
    // Pagination
    // ============================================================

    function createTextElement(tag, text, className = "") {
        const element = document.createElement(tag);
        element.textContent = text;
        if (className) element.className = className;
        return element;
    }

    function createParagraph(text, continuation = false) {
        return createTextElement(
            "p",
            text,
            continuation ? "continuation" : ""
        );
    }

    function createImageBlock(block) {
        const figure = document.createElement("figure");
        figure.className = "book-image-block";

        const img = document.createElement("img");
        img.src = block.src;
        img.alt = block.alt || "";
        figure.appendChild(img);

        if (block.caption) {
            figure.appendChild(
                createTextElement(
                    "figcaption",
                    block.caption,
                    "book-image-caption"
                )
            );
        }

        return figure;
    }

    function paginateAtomicBlock(createNode, chapterIndex) {
        const node = createNode();
        els.measureBody.appendChild(node);

        if (fitsMeasureBody()) return;

        node.remove();

        if (els.measureBody.childNodes.length) {
            commitMeasuredPage({ chapterIndex });
        }

        /* Atomic blocks move whole; they are never split between pages. */
        els.measureBody.appendChild(node);
    }

    function paginateImageBlock(block, chapterIndex) {
        paginateAtomicBlock(
            () => createImageBlock(block),
            chapterIndex
        );
    }

    function fitsMeasureBody() {
        return els.measureBody.scrollHeight <= els.measureBody.clientHeight + 0.5;
    }

    function commitMeasuredPage(meta = {}) {
        const html = els.measureBody.innerHTML.trim();
        if (!html) return;

        state.pages.push({
            bodyHTML: html,
            chapterIndex: meta.chapterIndex ?? 0,
            type: meta.type ?? "text"
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

    function paginateSubheading(text, chapterIndex) {
        paginateAtomicBlock(
            () => createTextElement("h2", text),
            chapterIndex
        );
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
                const trailingHeading =
                    els.measureBody.lastElementChild;

                /*
                  If the page ends with H2 and not even the first character of
                  the following paragraph fits, move that H2 to the next page.
                */
                if (
                    trailingHeading?.tagName === "H2"
                ) {
                    trailingHeading.remove();

                    if (els.measureBody.childNodes.length) {
                        commitMeasuredPage({
                            chapterIndex
                        });
                    }

                    els.measureBody.appendChild(
                        trailingHeading
                    );

                    continue;
                }

                commitMeasuredPage({
                    chapterIndex
                });
                continue;
            }

            const fittingText = remaining.slice(0, fittingLength);
            els.measureBody.appendChild(createParagraph(fittingText, continuation));
            commitMeasuredPage({ chapterIndex });

            remaining = remaining.slice(fittingLength);
            continuation = true;
        }
    }

    function createColophonSection() {
        const section = document.createElement("section");
        section.className = "colophon";

        const title =
            createTextElement(
                "h1",
                book.colophon.title
            );

        const dl = document.createElement("dl");

        section.append(title, dl);

        return {
            section,
            dl
        };
    }

    function appendColophonRow(dl, label, value) {
        const dt = createTextElement("dt", label);
        const dd = createTextElement("dd", value);
        dl.append(dt, dd);
        return { dt, dd };
    }

    /*
      奥付のルール:
      - 必ず新しいページから開始
      - 文字サイズ変更後も実際のDOM高さで再計測
      - 入らない行／注記は次ページへ送る
      - したがって「奥付=必ず1ページ」という例外を作らない
    */
    function paginateColophon() {
        const chapterIndex = book.chapters.length - 1;

        if (els.measureBody.childNodes.length > 0) {
            commitMeasuredPage({
                chapterIndex,
                type: "text"
            });
        }

        let current = createColophonSection();
        els.measureBody.appendChild(current.section);

        const startNewColophonPage = () => {
            commitMeasuredPage({
                chapterIndex,
                type: "colophon"
            });

            current = createColophonSection();
            els.measureBody.appendChild(current.section);
        };

        const rows = [
            ["書名", book.title],
            ["著者", book.author],
            ...book.colophon.rows
        ];

        rows.forEach(([label, value]) => {
            const row = appendColophonRow(
                current.dl,
                label,
                value
            );

            if (fitsMeasureBody()) return;

            row.dt.remove();
            row.dd.remove();

            startNewColophonPage();

            appendColophonRow(
                current.dl,
                label,
                value
            );
        });

        book.colophon.notes.forEach((text) => {
            const note =
                createTextElement(
                    "p",
                    text,
                    "colophon__note"
                );

            current.section.appendChild(note);

            if (fitsMeasureBody()) return;

            note.remove();
            startNewColophonPage();
            current.section.appendChild(note);
        });

        if (els.measureBody.childNodes.length > 0) {
            commitMeasuredPage({
                chapterIndex,
                type: "colophon"
            });
        }
    }

    function paginateBook() {
        state.pages = [];
        state.chapterStarts = [];
        els.measureBody.innerHTML = "";

        // Page 1: cover
        state.pages.push({
            bodyHTML: `<img class="cover-image" src="${book.cover.src}" alt="${book.cover.alt}">`,
            chapterIndex: -1,
            type: "cover"
        });

        book.chapters.forEach((chapter, chapterIndex) => {
            // Every chapter starts from the top of a new page.
            if (els.measureBody.childNodes.length > 0) {
                commitMeasuredPage({
                    chapterIndex: Math.max(0, chapterIndex - 1)
                });
            }

            state.chapterStarts[chapterIndex] = state.pages.length;
            els.measureBody.appendChild(
                createTextElement(
                    "h1",
                    chapter.title
                )
            );

            chapter.blocks.forEach((block) => {
                if (block.type === "image") {
                    paginateImageBlock(
                        block,
                        chapterIndex
                    );
                    return;
                }

                if (block.type === "h2") {
                    paginateSubheading(
                        block.text,
                        chapterIndex
                    );
                    return;
                }

                if (block.type === "paragraph") {
                    paginateParagraph(
                        block.text,
                        chapterIndex
                    );
                    return;
                }

                console.warn(
                    `Unsupported book block type: ${block.type}`
                );
            });

            if (els.measureBody.childNodes.length > 0) {
                commitMeasuredPage({ chapterIndex });
            }
        });

        // Final section: dynamically paginated colophon
        paginateColophon();

    }

    function getPageProgress(index) {
        if (!state.pages[index]) return "";
        const percent = Math.max(
            1,
            Math.round(((index + 1) / state.pages.length) * 100)
        );
        return `${percent}%`;
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

        if (page.type === "cover") {
            target.innerHTML = `<div class="page-body">${page.bodyHTML}</div>`;
            return;
        }

        const progress = getPageProgress(pageIndex);

        target.innerHTML = `
      <div class="page-body">${page.bodyHTML}</div>
      <div class="page-footer">
        <span></span>
        <span>${progress}</span>
      </div>
    `;
    }

    function currentChapterTitle() {
        const page = state.pages[state.currentPage];

        if (!page) return book.title;
        if (page.type === "cover") return book.title;
        if (page.type === "colophon") return "奥付";

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
        return clamp(
            index,
            0,
            Math.max(0, state.pages.length - 1)
        );
    }

    function configurePageSlider() {
        els.pageSlider.min = "1";
        els.pageSlider.max = String(
            Math.max(1, state.pages.length)
        );
        els.pageSlider.step = "0.01";
    }

    function updateFontControls() {
        els.fontValue.textContent = `${state.fontSize} px`;
        els.fontDown.disabled =
            state.fontSize <= CONFIG.font.min;
        els.fontUp.disabled =
            state.fontSize >= CONFIG.font.max;
    }

    function updateReadingPositionUI({
        sliderValue = state.currentPage + 1,
        persist = true,
        updateSlider = true
    } = {}) {
        if (updateSlider) {
            els.pageSlider.value =
                String(sliderValue);
        }

        els.pageCounter.textContent =
            `${state.currentPage + 1}/${state.pages.length}`;

        els.topbarTitle.textContent =
            currentChapterTitle();

        updateTocHighlight();

        if (persist) {
            storage.set(
                STORAGE.currentPage,
                state.currentPage
            );
        }
    }

    function setCurrentPageIndex(index, {
        sliderValue = null,
        persist = true
    } = {}) {
        state.currentPage =
            clampPageIndex(index);

        updateReadingPositionUI({
            sliderValue:
                sliderValue ?? state.currentPage + 1,
            persist
        });
    }

    function renderPageStack() {
        renderPageCard(
            els.currentPage,
            state.currentPage
        );
        renderPageCard(
            els.prevPage,
            state.currentPage - 1
        );
        renderPageCard(
            els.nextPage,
            state.currentPage + 1
        );
    }

    function renderCurrentPage() {
        renderPageStack();
        updateReadingPositionUI();
    }

    function goToPage(index) {
        state.currentPage =
            clampPageIndex(index);
        renderCurrentPage();
    }

    // ============================================================
    // Overview mode
    // ============================================================

    function invalidateOverviewMetrics() {
        state.overviewMetrics = null;
    }

    function getReaderPageSize() {
        /*
          offsetWidth/offsetHeight represent the untransformed CSS box.
          That is exactly what we need because both normal and overview pages
          are the same page box with only a scale transform applied later.
        */
        const width =
            els.currentPage.offsetWidth ||
            document.documentElement.clientWidth ||
            window.innerWidth;

        const height =
            els.currentPage.offsetHeight ||
            window.visualViewport?.height ||
            window.innerHeight;

        return {
            width,
            height
        };
    }

    function updateOverviewGeometry() {
        const {
            width,
            height
        } = getReaderPageSize();

        // Preserve the exact normal-page line breaks; only scale the page visually.
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
        const gap =
            width <= CONFIG.overview.mobileBreakpoint
                ? CONFIG.overview.mobileGap
                : CONFIG.overview.desktopGap;
        const overviewViewportWidth =
            els.overviewScroller.clientWidth ||
            width;

        const sidePad = Math.max(
            0,
            (
                overviewViewportWidth -
                itemWidth
            ) / 2
        );

        document.documentElement.style.setProperty(
            "--overview-scale",
            scale.toFixed(4)
        );
        document.documentElement.style.setProperty(
            "--overview-gap",
            `${gap}px`
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

        /*
          Spacer widths depend on --overview-side-pad, so any previously
          cached offset metrics are invalid after this geometry update.
        */
        invalidateOverviewMetrics();
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
        invalidateOverviewMetrics();
    }

    function getOverviewScrollMetrics({
        refresh = false
    } = {}) {
        if (
            !refresh &&
            state.overviewMetrics
        ) {
            return state.overviewMetrics;
        }

        const first =
            els.overviewStrip.children[0];

        if (!first) {
            state.overviewMetrics = null;
            return null;
        }

        const second =
            els.overviewStrip.children[1];

        const firstLeft =
            first.offsetLeft -
            (
                els.overviewScroller.clientWidth -
                first.offsetWidth
            ) / 2;

        const step = second
            ? second.offsetLeft - first.offsetLeft
            : first.offsetWidth;

        state.overviewMetrics = {
            firstLeft,
            step
        };

        return state.overviewMetrics;
    }



    function clampOverviewScrollLeft(left) {
        const max =
            els.overviewScroller.scrollWidth -
            els.overviewScroller.clientWidth;

        return clamp(
            left,
            0,
            Math.max(0, max)
        );
    }

    function setOverviewSnapSuppressed(suppressed) {
        els.overviewScroller.classList.toggle(
            "slider-dragging",
            suppressed
        );
    }

    function cancelOverviewProgrammaticScroll() {
        if (!state.overviewProgrammaticScrollRaf) return;

        cancelAnimationFrame(
            state.overviewProgrammaticScrollRaf
        );
        state.overviewProgrammaticScrollRaf = 0;
        setOverviewSnapSuppressed(false);
    }

    function getOverviewScrollLeftForPage(index) {
        const metrics =
            getOverviewScrollMetrics();

        if (!metrics) return null;

        return (
            metrics.firstLeft +
            clampPageIndex(index) *
            metrics.step
        );
    }

    function scrollOverviewToPage(
        index,
        behavior = "auto"
    ) {
        const left =
            getOverviewScrollLeftForPage(index);

        if (left == null) return;

        els.overviewScroller.scrollTo({
            left: clampOverviewScrollLeft(left),
            behavior
        });
    }

    /*
      Slider value is a fractional page position:
        1.00 = page 1 centered
        1.50 = exactly halfway between page 1 and 2
        8.27 = 27% of the way from page 8 to 9
  
      This makes the card strip move continuously, exactly like horizontal
      touch scrolling, instead of jumping from one page center to another.
    */
    function scrollOverviewToPageAnimated(index) {
        const targetIndex =
            clampPageIndex(index);

        const targetLeft =
            getOverviewScrollLeftForPage(
                targetIndex
            );

        if (targetLeft == null) {
            return;
        }

        cancelOverviewProgrammaticScroll();

        const scroller =
            els.overviewScroller;

        const startLeft =
            scroller.scrollLeft;

        const endLeft =
            clampOverviewScrollLeft(
                targetLeft
            );

        const distance =
            Math.abs(
                endLeft - startLeft
            );

        if (distance < 1) {
            setCurrentPageIndex(
                targetIndex
            );

            scrollOverviewToPage(
                targetIndex,
                "auto"
            );

            return;
        }

        /*
          Longer jumps remain visibly animated, but cap the duration
          so navigating across a long book does not feel sluggish.
        */
        const duration = clamp(
            CONFIG.overview.navigationBaseDuration +
            distance / Math.max(
                1,
                scroller.clientWidth
            ) * CONFIG.overview.navigationPerViewport,
            CONFIG.overview.navigationMinDuration,
            CONFIG.overview.navigationMaxDuration
        );

        const startTime =
            performance.now();

        /*
          Disable scroll snap while the strip is moving.
          Otherwise the browser may try to capture intermediate pages.
        */
        setOverviewSnapSuppressed(true);

        const easeInOutCubic = (t) =>
            t < 0.5
                ? 4 * t * t * t
                : 1 -
                Math.pow(
                    -2 * t + 2,
                    3
                ) / 2;

        const tick = (now) => {
            const progress = clamp(
                (now - startTime) /
                duration,
                0,
                1
            );

            const eased =
                easeInOutCubic(progress);

            scroller.scrollLeft =
                startLeft +
                (
                    endLeft -
                    startLeft
                ) *
                eased;

            if (progress < 1) {
                state.overviewProgrammaticScrollRaf =
                    requestAnimationFrame(
                        tick
                    );
                return;
            }

            state.overviewProgrammaticScrollRaf = 0;

            setOverviewSnapSuppressed(false);

            /*
              Finalize exactly on the chapter's first page.
              The scroll handler has already updated the counter/title while
              all intermediate cards passed through the viewport.
            */
            setCurrentPageIndex(
                targetIndex
            );

            scrollOverviewToPage(
                targetIndex,
                "auto"
            );
        };

        state.overviewProgrammaticScrollRaf =
            requestAnimationFrame(
                tick
            );
    }

    function syncOverviewPosition(
        fractionalIndex,
        sliderValue = fractionalIndex + 1
    ) {
        const nearestIndex =
            clampPageIndex(Math.round(fractionalIndex));

        if (nearestIndex === state.currentPage) {
            els.pageSlider.value = String(sliderValue);
            return;
        }

        setCurrentPageIndex(nearestIndex, { sliderValue });
    }

    function queueOverviewSliderPosition(position) {
        state.pendingSliderPosition = clamp(
            position,
            1,
            Math.max(1, state.pages.length)
        );

        if (state.sliderRaf) return;

        state.sliderRaf =
            requestAnimationFrame(() => {
                state.sliderRaf = 0;

                const metrics =
                    getOverviewScrollMetrics();

                if (!metrics) return;

                const fractionalIndex =
                    state.pendingSliderPosition - 1;

                els.overviewScroller.scrollLeft =
                    metrics.firstLeft +
                    fractionalIndex *
                    metrics.step;

                syncOverviewPosition(
                    fractionalIndex,
                    state.pendingSliderPosition
                );
            });
    }
    function syncPageFromOverviewScroll() {
        if (state.sliderDragging) return;

        cancelAnimationFrame(
            state.overviewScrollRaf
        );

        state.overviewScrollRaf =
            requestAnimationFrame(() => {
                const metrics =
                    getOverviewScrollMetrics();

                if (
                    !metrics ||
                    metrics.step <= 0
                ) {
                    return;
                }

                const fractionalIndex = clamp(
                    (
                        els.overviewScroller.scrollLeft -
                        metrics.firstLeft
                    ) / metrics.step,
                    0,
                    Math.max(
                        0,
                        state.pages.length - 1
                    )
                );

                syncOverviewPosition(
                    fractionalIndex
                );
            });
    }

    function markOverviewDirty() {
        state.overviewDirty = true;
        invalidateOverviewMetrics();
    }

    function ensureOverviewStrip() {
        if (
            !state.overviewDirty &&
            els.overviewStrip.children.length
        ) {
            return;
        }

        renderOverviewStrip();
        configurePageSlider();
        state.overviewDirty = false;
    }

    function nextPaint() {
        return new Promise((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(resolve));
        });
    }

    function animationOptions(duration = CONFIG.overview.transitionDuration) {
        return {
            duration,
            easing: CONFIG.overview.transitionEasing,
            fill: "forwards"
        };
    }

    function getOverviewMorphTransforms() {
        const styles = getComputedStyle(document.documentElement);
        const scale =
            parseFloat(styles.getPropertyValue("--overview-scale")) || 0.67;
        const itemWidth =
            parseFloat(styles.getPropertyValue("--overview-item-width")) ||
            window.innerWidth * scale;
        const gap =
            parseFloat(styles.getPropertyValue("--overview-gap")) || 18;
        const step = itemWidth + gap;

        return {
            current: `translate3d(0,0,0) scale(${scale})`,
            prev: `translate3d(${-step}px,0,0) scale(${scale})`,
            next: `translate3d(${step}px,0,0) scale(${scale})`
        };
    }

    function getMorphSides() {
        return {
            prev: state.currentPage > 0,
            next: state.currentPage < state.pages.length - 1
        };
    }

    function getMorphTheme() {
        return {
            paper: cssVar("--paper", "#ffffff"),
            overview: cssVar("--overview-bg", "#efefef"),
            radius: cssVar("--overview-card-radius", "10px"),
            shadow: cssVar("--shadow", "0 3px 14px rgba(0,0,0,.12)"),
            shadowNone: cssVar("--shadow-none", "0 0 0 rgba(0,0,0,0)")
        };
    }

    function setMorphCard(card, { transform, opacity = 1, elevated = false }) {
        card.style.transform = transform;
        card.style.opacity = String(opacity);
        card.style.borderRadius =
            elevated ? "var(--overview-card-radius)" : "0";
        card.style.boxShadow =
            elevated ? "var(--shadow)" : "none";
    }

    function setMorphStart(toOverview, transforms, sides) {
        const full = "translate3d(0,0,0) scale(1)";

        setMorphCard(els.currentPage, {
            transform: toOverview ? full : transforms.current,
            elevated: !toOverview
        });

        [
            [els.prevPage, transforms.prev, sides.prev],
            [els.nextPage, transforms.next, sides.next]
        ].forEach(([card, transform, visible]) => {
            setMorphCard(card, {
                transform,
                opacity: toOverview ? 0 : visible ? 1 : 0,
                elevated: visible
            });
        });
    }

    function animateChrome(show, duration) {
        const options = animationOptions(duration);

        return [
            [els.topbar, -5],
            [els.bottomBar, 5]
        ].map(([element, offset]) => {
            const hidden = {
                opacity: 0,
                transform: `translateY(${offset}px)`
            };
            const visible = {
                opacity: 1,
                transform: "translateY(0)"
            };

            return element.animate(
                show ? [hidden, visible] : [visible, hidden],
                options
            );
        });
    }

    function createMorphAnimations(toOverview, transforms, sides) {
        const duration = CONFIG.overview.transitionDuration;
        const options = animationOptions(duration);
        const theme = getMorphTheme();

        const full = {
            transform: "translate3d(0,0,0) scale(1)",
            borderRadius: "0px",
            boxShadow: theme.shadowNone
        };
        const overview = {
            transform: transforms.current,
            borderRadius: theme.radius,
            boxShadow: theme.shadow
        };

        const animations = [
            els.currentPage.animate(
                toOverview ? [full, overview] : [overview, full],
                options
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
            [els.prevPage, sides.prev],
            [els.nextPage, sides.next]
        ].forEach(([card, visible]) => {
            if (visible) {
                animations.push(card.animate(sideFrames, options));
            }
        });

        animations.push(
            els.app.animate(
                toOverview
                    ? [
                        { backgroundColor: theme.paper },
                        { backgroundColor: theme.overview }
                    ]
                    : [
                        { backgroundColor: theme.overview },
                        { backgroundColor: theme.paper }
                    ],
                options
            ),
            ...animateChrome(toOverview, duration)
        );

        return animations;
    }

    function prepareStageMorph() {
        resetStackTurn();

        const morphStage = document.querySelector(".stage");
        morphStage.classList.add("mode-morph");

        [
            [els.prevPage, 2],
            [els.nextPage, 2],
            [els.currentPage, 4]
        ].forEach(([card, zIndex]) => {
            card.style.zIndex = String(zIndex);
            card.style.transition = "none";
        });

        return morphStage;
    }

    function clearMorphCard(card) {
        [
            "z-index",
            "transition",
            "transform",
            "opacity",
            "border-radius",
            "box-shadow"
        ].forEach((property) => card.style.removeProperty(property));
    }

    function cancelElementAnimations(...elements) {
        elements.forEach((element) => {
            element.getAnimations().forEach((animation) => animation.cancel());
        });
    }

    function waitForAnimations(animations) {
        return Promise.allSettled(
            animations.map((animation) => animation.finished)
        );
    }

    function cleanupModeMorph(morphStage, animations) {
        animations.forEach((animation) => animation.cancel());
        morphStage.classList.remove("mode-morph");

        [
            els.prevPage,
            els.currentPage,
            els.nextPage
        ].forEach(clearMorphCard);

        // Mode class changes can also create CSS transitions.
        cancelElementAnimations(els.topbar, els.bottomBar, els.app);
    }

    async function transitionToOverview() {
        if (state.modeTransitioning || state.mode === "overview") return;

        closeOverlays();
        state.modeTransitioning = true;

        ensureOverviewStrip();
        updateOverviewGeometry();
        scrollOverviewToPage(state.currentPage, "auto");
        await nextPaint();

        const transforms = getOverviewMorphTransforms();
        const sides = getMorphSides();
        const morphStage = prepareStageMorph();

        setMorphStart(true, transforms, sides);
        await nextPaint();

        const animations =
            createMorphAnimations(true, transforms, sides);

        await waitForAnimations(animations);

        // Swap only after the stage matches the real overview.
        applyAppMode("overview");
        await nextPaint();

        cleanupModeMorph(morphStage, animations);
        unlockModeTransition();
    }

    async function transitionToNormal() {
        if (state.modeTransitioning || state.mode === "normal") return;

        closeOverlays();
        state.modeTransitioning = true;

        ensureOverviewStrip();
        scrollOverviewToPage(state.currentPage, "auto");
        await nextPaint();

        renderCurrentPage();

        const transforms = getOverviewMorphTransforms();
        const sides = getMorphSides();
        const morphStage = prepareStageMorph();

        setMorphStart(false, transforms, sides);
        await nextPaint();

        // The stage now matches the overview cards underneath it.
        applyAppMode("normal");

        const animations =
            createMorphAnimations(false, transforms, sides);

        await waitForAnimations(animations);
        cleanupModeMorph(morphStage, animations);

        renderCurrentPage();
        unlockModeTransition();
    }

    function applyAppMode(mode) {
        state.mode = mode;
        els.app.classList.toggle("normal", mode === "normal");
        els.app.classList.toggle("overview", mode === "overview");
    }

    function closeOverlays() {
        closeDisplayPopover();
        closeToc();
    }

    function unlockModeTransition() {
        state.modeTransitioning = false;
    }

    function setMode(mode) {
        if (mode === state.mode || state.modeTransitioning) return;

        if (mode === "overview") {
            transitionToOverview();
        } else {
            transitionToNormal();
        }
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

    function getReadingProgress() {
        const pageCount =
            Math.max(state.pages.length, 1);

        return pageCount <= 1
            ? 0
            : state.currentPage /
            (pageCount - 1);
    }

    function getPageIndexForProgress(progress) {
        return clampPageIndex(
            Math.round(
                progress *
                Math.max(
                    0,
                    state.pages.length - 1
                )
            )
        );
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

        if (state.mode !== "overview") {
            return;
        }

        ensureOverviewStrip();

        requestAnimationFrame(() => {
            scrollOverviewToPage(
                state.currentPage,
                "auto"
            );
        });
    }

    function commitPaginationAtProgress(
        progress
    ) {
        configurePageSlider();

        state.currentPage =
            getPageIndexForProgress(progress);

        renderCurrentPage();
        refreshOverviewAfterPagination();
    }

    function setFontSize(size, { repaginate = true } = {}) {
        const nextSize = clamp(
            size,
            CONFIG.font.min,
            CONFIG.font.max
        );

        state.fontSize = nextSize;

        updateFontControls();

        storage.set(
            STORAGE.fontSize,
            nextSize
        );

        if (!repaginate) {
            setFontCss(nextSize);
            return;
        }

        /*
          Collapse rapid A+/A- taps into one pagination pass.
          This avoids doing a full-book layout for every intermediate size.
        */
        clearTimeout(
            state.fontRepaginateTimer
        );

        state.fontRepaginateTimer =
            setTimeout(() => {
                repaginateForFontSize(
                    state.fontSize
                );
            }, CONFIG.timing.fontRepaginateDebounce);
    }

    /*
      Font-size position invariant:
      - chapter first page -> same chapter first page
      - any other page     -> approximate reading progress
    */
    function getCurrentChapterStartAnchor() {
        const page =
            state.pages[state.currentPage];

        if (!page) return null;

        const chapterIndex =
            page.chapterIndex;

        if (
            !Number.isInteger(chapterIndex)
        ) {
            return null;
        }

        const chapterStart =
            state.chapterStarts[chapterIndex];

        return (
            chapterStart === state.currentPage
                ? chapterIndex
                : null
        );
    }

    function restoreFontChangePage({
        readingProgress,
        chapterStartAnchor
    }) {
        /*
          Semantic anchor wins over percentage progress.
    
          If the user was looking at the first page of a chapter,
          keep that exact chapter boundary after repagination.
        */
        if (
            Number.isInteger(
                chapterStartAnchor
            )
        ) {
            const anchoredPage =
                state.chapterStarts[
                chapterStartAnchor
                ];

            if (
                Number.isInteger(
                    anchoredPage
                )
            ) {
                return clampPageIndex(
                    anchoredPage
                );
            }
        }

        /*
          For ordinary pages, keep the existing percentage-based
          reading-position approximation.
        */
        return clampPageIndex(
            Math.round(
                readingProgress *
                Math.max(
                    0,
                    state.pages.length - 1
                )
            )
        );
    }

    function repaginateForFontSize(nextSize) {
        const oldPageCount =
            Math.max(state.pages.length, 1);

        const readingProgress =
            oldPageCount <= 1
                ? 0
                : state.currentPage /
                (oldPageCount - 1);

        /*
          Preserve semantic position when currently showing
          the first page of a chapter.
        */
        const chapterStartAnchor =
            getCurrentChapterStartAnchor();

        /*
          Phase 1:
          Only the hidden measurement page receives the new font size.
          The visible reader remains completely untouched.
        */
        setFontCss(
            nextSize,
            {
                visible: false,
                measure: true
            }
        );

        requestAnimationFrame(() => {
            /*
              Build the entire new pagination off-screen.
              No loading overlay and no overview DOM rebuild here.
            */
            paginateBook();

            const nextIndex =
                restoreFontChangePage({
                    readingProgress,
                    chapterStartAnchor
                });

            state.currentPage = nextIndex;

            /*
              Phase 2 — minimal atomic visual commit.
      
              Keep this section intentionally small.
              Do NOT call the generic commitPaginationAtProgress() here:
              that function also updates slider configuration / overview state.
      
              The visible font and the new page HTML are changed in one JS task,
              so the browser never paints "new font + old page splitting".
            */
            setFontCss(
                nextSize,
                {
                    visible: true,
                    measure: false
                }
            );

            renderPageStack();

            /*
              Only the small pieces of reading-position UI that can actually
              change are updated. Avoid reconfiguring the range control here.
            */
            updateReadingPositionUI({
                updateSlider:
                    state.mode === "overview"
            });

            /*
              Overview is expensive because it contains a copy of every page.
              In normal reading mode, merely invalidate it.
            */
            markOverviewDirty();

            if (state.mode === "overview") {
                /*
                  If overview is currently visible we have no choice but to refresh
                  it, but do so AFTER the main reader has already been committed.
                */
                requestAnimationFrame(() => {
                    ensureOverviewStrip();

                    scrollOverviewToPage(
                        state.currentPage,
                        "auto"
                    );
                });
            }
        });
    }

    function repaginateKeepingProgress() {
        const progress =
            getReadingProgress();

        setFontCss(
            state.fontSize
        );

        els.loading.hidden = false;

        requestAnimationFrame(() => {
            paginateBook();

            /*
              TOC button labels do not depend on pagination.
              chapterStarts is refreshed by paginateBook(), so there is no
              reason to rebuild the TOC DOM on every resize/fullscreen change.
            */
            commitPaginationAtProgress(
                progress
            );

            els.loading.hidden = true;
        });
    }

    // ============================================================
    // UI overlays / fullscreen
    // ============================================================

    function isDisplayPopoverOpen() {
        return els.displayPopover.classList.contains("open");
    }

    function openDisplayPopover() {
        if (isDisplayPopoverOpen()) return;

        closeToc();

        els.displayPopover.classList.add("open");
        els.displayPopover.setAttribute("aria-hidden", "false");
        els.displayButton.classList.add("active");
    }

    function closeDisplayPopover() {
        if (!isDisplayPopoverOpen()) return;

        els.displayPopover.classList.remove("open");
        els.displayPopover.setAttribute("aria-hidden", "true");
        els.displayButton.classList.remove("active");
    }

    function toggleDisplayPopover(event) {
        event?.stopPropagation();

        if (isDisplayPopoverOpen()) {
            closeDisplayPopover();
        } else {
            openDisplayPopover();
        }
    }

    function isTocOpen() {
        return els.tocDrawer.classList.contains("open");
    }

    function setTocOpen(open) {
        els.tocDrawer.classList.toggle("open", open);
        els.scrim.classList.toggle("open", open);

        const hidden = String(!open);
        els.tocDrawer.setAttribute("aria-hidden", hidden);
        els.scrim.setAttribute("aria-hidden", hidden);
    }

    function openToc() {
        if (isTocOpen()) return;
        closeDisplayPopover();
        updateTocHighlight();
        setTocOpen(true);
    }

    function closeToc() {
        if (isTocOpen()) setTocOpen(false);
    }

    function toggleToc() {
        isTocOpen() ? closeToc() : openToc();
    }

    function isFullscreen() {
        return Boolean(
            document.fullscreenElement ||
            document.webkitFullscreenElement
        );
    }

    async function enterFullscreen() {
        const target = document.documentElement;

        try {
            if (target.requestFullscreen) {
                await target.requestFullscreen({
                    navigationUI: "hide"
                });
                return;
            }

            if (target.webkitRequestFullscreen) {
                target.webkitRequestFullscreen();
            }
        } catch (error) {
            console.warn("Fullscreen request was not accepted:", error);
        }
    }

    async function exitFullscreen() {
        try {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
                return;
            }

            if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        } catch (error) {
            console.warn("Fullscreen exit failed:", error);
        }
    }

    async function toggleFullscreen() {
        closeOverlays();

        if (isFullscreen()) {
            await exitFullscreen();
        } else {
            await enterFullscreen();
        }
    }

    function updateFullscreenButton() {
        const active = isFullscreen();

        els.fullscreenButton.classList.toggle("is-active", active);
        els.fullscreenButton.setAttribute(
            "aria-label",
            active ? "全画面表示を終了" : "全画面表示"
        );
        els.fullscreenButton.setAttribute(
            "title",
            active ? "全画面表示を終了" : "全画面表示"
        );

        els.fullscreenEnterIcon.hidden = active;
        els.fullscreenExitIcon.hidden = !active;
    }

    // ---------- Event bindings ----------

    const stage = document.querySelector(".stage");

    // ============================================================
    // Normal-mode stacked page turn
    // ============================================================

    function setTurnShadow(progress) {
        stage.style.setProperty(
            "--turn-shadow-opacity",
            String(
                Math.min(
                    1,
                    Math.max(0, progress) *
                    1.25
                )
            )
        );
    }

    function setDragX(px) {
        stage.style.setProperty(
            "--drag-x",
            `${px}px`
        );

        setTurnShadow(
            Math.abs(px) /
            Math.max(1, window.innerWidth)
        );
    }

    function setReturnX(px) {
        stage.style.setProperty(
            "--return-x",
            `${px}px`
        );

        setTurnShadow(
            1 -
            Math.abs(px) /
            Math.max(1, window.innerWidth)
        );
    }

    function resetStackTurn() {
        stage.classList.remove(
            "is-animating",
            "turn-prev"
        );
        stage.style.setProperty("--drag-x", "0px");
        stage.style.setProperty("--return-x", "-100vw");
        stage.style.setProperty("--turn-shadow-opacity", "0");
    }

    function beginTurnAnimation() {
        state.isTurning = true;
        stage.classList.add("is-animating");
    }

    function endTurnAnimation(suppressTapDelay) {
        resetStackTurn();
        state.isTurning = false;
        state.dragging = false;

        window.setTimeout(() => {
            state.suppressTap = false;
        }, suppressTapDelay);
    }

    function finishTurn(direction) {
        if (state.isTurning) return;

        const canMove =
            direction === "next"
                ? state.currentPage < state.pages.length - 1
                : state.currentPage > 0;

        if (!canMove) {
            snapReaderBack();
            return;
        }

        beginTurnAnimation();

        if (direction === "next") {
            /*
              Top sheet leaves to the LEFT.
              NEXT never moves; it is simply uncovered.
            */
            requestAnimationFrame(() => {
                setDragX(-window.innerWidth);
            });
        } else {
            /*
              PREVIOUS is already above CURRENT and returns from the LEFT.
            */
            stage.classList.add("turn-prev");
            requestAnimationFrame(() => {
                setReturnX(0);
            });
        }

        window.setTimeout(() => {
            if (direction === "next") {
                state.currentPage += 1;
            } else {
                state.currentPage -= 1;
            }

            renderCurrentPage();
            endTurnAnimation(90);
        }, CONFIG.pageTurn.duration);
    }

    function snapReaderBack() {
        if (state.isTurning) return;

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
            endTurnAnimation(70);
        }, CONFIG.pageTurn.duration);
    }

    function navigateBy(delta) {
        if (state.mode === "normal") {
            finishTurn(delta > 0 ? "next" : "prev");
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

        state.currentPage = index;
        renderCurrentPage();
        setMode("normal");
    });

    els.tocList.addEventListener("click", (event) => {
        const button =
            event.target.closest(
                ".toc-button"
            );

        if (!button) return;

        const chapterIndex =
            Number(
                button.dataset.chapterIndex
            );

        if (
            !Number.isInteger(
                chapterIndex
            )
        ) {
            return;
        }

        const targetPage =
            state.chapterStarts[
            chapterIndex
            ] ?? 0;

        closeToc();

        /*
          TOC exists in overview chrome, so navigation always moves the
          already-visible overview strip.
        */
        requestAnimationFrame(() => {
            scrollOverviewToPageAnimated(
                targetPage
            );
        });
    });

    /*
      Normal reader drag behavior:
      - current/adjacent page follows the finger 1:1
      - fast flick commits even with a short distance
      - slower drag commits around 18% of the viewport width
      - release snaps smoothly to the next/previous page
    */
    stage.addEventListener("pointerdown", (event) => {
        if (
            state.mode !== "normal" ||
            state.isTurning ||
            state.modeTransitioning
        ) return;
        if (event.pointerType === "mouse" && event.button !== 0) return;

        state.pointerId = event.pointerId;
        state.pointerStartX = event.clientX;
        state.pointerStartY = event.clientY;
        state.pointerStartTime = performance.now();
        state.dragging = false;
        state.suppressTap = false;

        resetStackTurn();

        try {
            stage.setPointerCapture(event.pointerId);
        } catch (_) { }
    });

    stage.addEventListener("pointermove", (event) => {
        if (
            state.mode !== "normal" ||
            state.isTurning ||
            state.pointerId !== event.pointerId
        ) {
            return;
        }

        let dx = event.clientX - state.pointerStartX;
        const dy = event.clientY - state.pointerStartY;

        if (!state.dragging) {
            if (Math.abs(dx) < 7) return;

            if (Math.abs(dx) <= Math.abs(dy)) {
                return;
            }

            state.dragging = true;
            state.suppressTap = true;
        }

        if (dx < 0) {
            // Forward: only the current/top sheet moves.
            stage.classList.remove("turn-prev");

            if (state.currentPage === state.pages.length - 1) {
                // Small elastic response at the end of the book.
                setDragX(dx * 0.16);
            } else {
                setDragX(dx);
            }
        } else {
            // Backward: previous page returns over the current sheet.
            if (state.currentPage === 0) {
                stage.classList.remove("turn-prev");
                setDragX(dx * 0.12);
            } else {
                stage.classList.add("turn-prev");
                const returnX = -window.innerWidth + dx;
                setReturnX(Math.min(0, returnX));
            }
        }

        event.preventDefault();
    });

    function endReaderPointer(event) {
        if (state.pointerId !== event.pointerId) return;

        const now = performance.now();
        const rawDx = event.clientX - state.pointerStartX;
        const totalTime = Math.max(1, now - state.pointerStartTime);

        // px/ms; total gesture velocity is stable on mobile browsers.
        const velocity = rawDx / totalTime;
        const threshold =
            window.innerWidth * CONFIG.pageTurn.thresholdRatio;
        const fastFlick =
            Math.abs(velocity) >= CONFIG.pageTurn.flickVelocity;

        state.pointerId = null;

        try {
            stage.releasePointerCapture(event.pointerId);
        } catch (_) { }

        if (!state.dragging) {
            const x = event.clientX;
            const width = window.innerWidth;

            if (x < width * 0.32) {
                navigateBy(-1);
            } else if (x > width * 0.68) {
                navigateBy(1);
            } else {
                setMode("overview");
            }
            return;
        }

        const wantsNext =
            rawDx < -threshold ||
            (rawDx < -CONFIG.pageTurn.flickDistance && fastFlick);

        const wantsPrev =
            rawDx > threshold ||
            (rawDx > CONFIG.pageTurn.flickDistance && fastFlick);

        if (wantsNext && state.currentPage < state.pages.length - 1) {
            finishTurn("next");
        } else if (wantsPrev && state.currentPage > 0) {
            finishTurn("prev");
        } else {
            snapReaderBack();
        }
    }

    stage.addEventListener("pointerup", endReaderPointer);
    stage.addEventListener("pointercancel", endReaderPointer);

    // Native inertial scrolling in overview mode.
    els.overviewScroller.addEventListener(
        "scroll",
        syncPageFromOverviewScroll,
        { passive: true }
    );

    els.overviewScroller.addEventListener(
        "pointerdown",
        cancelOverviewProgrammaticScroll,
        { passive: true }
    );

    els.pageSlider.addEventListener("pointerdown", () => {
        if (state.mode !== "overview") return;

        cancelOverviewProgrammaticScroll();
        state.sliderDragging = true;
        setOverviewSnapSuppressed(true);
    });

    els.pageSlider.addEventListener("input", (event) => {
        const position = Number(event.target.value);

        if (state.mode === "overview") {
            queueOverviewSliderPosition(position);
            return;
        }

        /*
          In normal mode the slider still behaves as a page selector.
          Fractional values are rounded to the nearest page.
        */
        goToPage(
            Math.round(position) - 1
        );
    });

    function finishSliderDrag() {
        if (!state.sliderDragging) return;

        state.sliderDragging = false;
        setOverviewSnapSuppressed(false);

        cancelAnimationFrame(state.sliderRaf);
        state.sliderRaf = 0;

        const fractionalIndex = clamp(
            Number(els.pageSlider.value) - 1,
            0,
            Math.max(0, state.pages.length - 1)
        );

        const target = Math.round(
            fractionalIndex
        );

        /*
          Re-enable scroll-snap and settle once.
          The entire drag has already moved continuously through intermediate
          cards, so this final movement is only a small centering correction.
        */
        setCurrentPageIndex(
            target
        );

        scrollOverviewToPage(
            target,
            "smooth"
        );
    }

    [
        "pointerup",
        "pointercancel",
        "change"
    ].forEach((type) => {
        els.pageSlider.addEventListener(
            type,
            finishSliderDrag
        );
    });

    els.displayButton.addEventListener("click", toggleDisplayPopover);

    els.fullscreenButton.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;

        event.preventDefault();
        event.stopPropagation();
        toggleFullscreen();
    });

    els.fullscreenButton.addEventListener("click", (event) => {
        /*
          Touch pointerdown above already handled the request.
          Prevent the synthetic click from toggling fullscreen a second time.
        */
        if (event.detail === 0) {
            // Keyboard-generated click remains usable.
            toggleFullscreen();
        }

        event.preventDefault();
        event.stopPropagation();
    });

    function scheduleRepagination(delay = CONFIG.timing.resizeDebounce) {
        clearTimeout(state.resizeTimer);
        state.resizeTimer = setTimeout(repaginateKeepingProgress, delay);
    }

    function handleFullscreenChange() {
        updateFullscreenButton();
        scheduleRepagination(CONFIG.timing.fullscreenRepaginate);
    }

    [
        "fullscreenchange",
        "webkitfullscreenchange"
    ].forEach((type) => {
        document.addEventListener(
            type,
            handleFullscreenChange
        );
    });
    els.fontDown.addEventListener("click", () => setFontSize(state.fontSize - CONFIG.font.step));
    els.fontUp.addEventListener("click", () => setFontSize(state.fontSize + CONFIG.font.step));

    els.tocOpenButton.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;

        event.preventDefault();
        event.stopPropagation();

        toggleToc();
    });

    /*
      Suppress the synthetic click generated after touch pointerup.
      Without this, some Android browsers can effectively toggle twice.
    */
    els.tocOpenButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
    });

    els.scrim.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        closeToc();
    });

    document.addEventListener("click", (event) => {
        if (
            isDisplayPopoverOpen() &&
            !els.displayPopover.contains(event.target) &&
            !els.displayButton.contains(event.target)
        ) {
            closeDisplayPopover();
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
            closeOverlays();
        }
    });

    window.addEventListener("resize", () => {
        updateOverviewGeometry();
        scheduleRepagination();
    });

    if (window.visualViewport) {
        let lastVisualViewportHeight = window.visualViewport.height;

        window.visualViewport.addEventListener("resize", () => {
            const nextHeight = window.visualViewport.height;

            /*
              Ignore tiny sub-pixel/layout fluctuations. Reflow only when the
              visible browser viewport actually changes meaningfully.
            */
            if (Math.abs(nextHeight - lastVisualViewportHeight) < 8) return;

            lastVisualViewportHeight = nextHeight;
            updateOverviewGeometry();
            scheduleRepagination();
        });
    }

    function init() {
        updateFullscreenButton();
        updateOverviewGeometry();
        setFontSize(state.fontSize, { repaginate: false });
        paginateBook();
        buildToc();
        configurePageSlider();

        /*
          Overview clones are invisible at startup and can be expensive for
          long books. Build them lazily on the first overview transition.
        */
        markOverviewDirty();

        state.currentPage =
            clampPageIndex(
                state.currentPage
            );

        renderCurrentPage();
        updateFontControls();
        els.loading.hidden = true;
    }

    init();
})();