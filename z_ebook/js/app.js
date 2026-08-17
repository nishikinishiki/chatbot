// ========================================================
// 共通のHTMLテンプレート (全書籍で使い回すレイアウト)
// ========================================================
const layoutHTML = `
    <header class="header">
        <div class="header-left">
            <button id="tocBtn" class="btn-icon" title="目次を開く">
                <i class="fa-solid fa-list-ul"></i>
                <span style="font-size:0.85rem; font-weight:bold;" class="desktop-only">目次</span>
            </button>
            <div style="width: 1px; height: 16px; background: var(--border-color); margin: 0 8px;"></div>
            <h1 class="header-title" id="bookTitle"></h1>
        </div>
        <div class="header-right">
            <button id="settingsBtn" class="btn-icon" title="表示設定"><i class="fa-solid fa-font"></i></button>
            <button id="fullscreenBtn" class="btn-icon desktop-only" title="全画面表示"><i class="fa-solid fa-expand"></i></button>
        </div>
    </header>

    <div id="settingsPanel" class="settings-panel hidden">
        <div class="setting-group">
            <span class="setting-label">文字の大きさ</span>
            <div class="toggle-group">
                <button data-size="sm" class="toggle-btn size-opt">小</button>
                <button data-size="base" class="toggle-btn size-opt active">中</button>
                <button data-size="lg" class="toggle-btn size-opt">大</button>
            </div>
        </div>
        <div class="setting-group">
            <span class="setting-label">表示モード</span>
            <div class="toggle-group" style="gap:4px; padding:4px;">
                <button id="viewModeTwo" class="toggle-btn active-dark" style="border-radius:4px;"><i class="fa-solid fa-book-open"></i> 見開き(2P)</button>
                <button id="viewModeOne" class="toggle-btn" style="border-radius:4px;"><i class="fa-solid fa-file"></i> 単ページ(1P)</button>
            </div>
        </div>
    </div>

    <div id="tocDrawer" class="toc-drawer">
        <div class="toc-header">
            <span><i class="fa-solid fa-book-bookmark" style="color:var(--accent-color);"></i> 目次</span>
            <button id="closeTocBtn" class="btn-icon"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div id="tocList" class="toc-list"></div>
    </div>
    <div id="tocOverlay" class="overlay hidden"></div>

    <main class="main-content">
        <button id="prevBtn" class="nav-btn prev-btn"><i class="fa-solid fa-chevron-left"></i></button>
        <button id="nextBtn" class="nav-btn next-btn"><i class="fa-solid fa-chevron-right"></i></button>
        <div id="book" class="book-wrapper">
            <div id="pageSpread" class="page-spread"></div>
        </div>
    </main>

    <div id="zoomModal" class="modal hidden">
        <div class="modal-card">
            <div class="modal-header">
                <span id="zoomModalTitle"><i class="fa-solid fa-magnifying-glass-plus"></i> 拡大表示</span>
                <button id="closeModalBtn" class="btn-icon"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div id="zoomModalBody" class="modal-body"></div>
            <div class="modal-footer">タップ/クリックまたは画面外を押して閉じます</div>
        </div>
    </div>

    <footer class="footer">
        <div class="page-indicator">
            <span id="currentPageNum" class="current">1</span> / <span id="totalPagesNum">1</span> P
        </div>
        <div class="slider-container">
            <input type="range" id="pageSlider" min="1" max="1" value="1" class="range-slider">
        </div>
    </footer>
`;

// ========================================================
// 状態管理・DOMキャッシュ
// ========================================================
let ebookData = null;
let currentPage = 1;
let viewMode = 'two';
let currentFontSize = 'base';
let isUiVisible = true;
let els = {};

// ========================================================
// 初期化・データ取得 (JSONの読み込みと目次自動生成)
// ========================================================
window.addEventListener('DOMContentLoaded', async () => {
    // 空のbodyに、全書籍共通のHTML枠組みを流し込む
    document.body.innerHTML = layoutHTML;
    // DOM要素のキャッシュ
    els = {
        container: document.getElementById('pageSpread'),
        currentPageNum: document.getElementById('currentPageNum'),
        totalPagesNum: document.getElementById('totalPagesNum'),
        pageSlider: document.getElementById('pageSlider'),
        prevBtn: document.getElementById('prevBtn'),
        nextBtn: document.getElementById('nextBtn'),
        viewModeOne: document.getElementById('viewModeOne'),
        viewModeTwo: document.getElementById('viewModeTwo'),
        settingsBtn: document.getElementById('settingsBtn'),
        settingsPanel: document.getElementById('settingsPanel'),
        sizeOpts: document.querySelectorAll('.size-opt'),
        tocBtn: document.getElementById('tocBtn'),
        closeTocBtn: document.getElementById('closeTocBtn'),
        tocDrawer: document.getElementById('tocDrawer'),
        tocOverlay: document.getElementById('tocOverlay'),
        tocList: document.getElementById('tocList'),
        fullscreenBtn: document.getElementById('fullscreenBtn'),
        bookEl: document.getElementById('book'),
        mainContent: document.querySelector('.main-content'),
        zoomModal: document.getElementById('zoomModal'),
        zoomModalBody: document.getElementById('zoomModalBody'),
        closeModalBtn: document.getElementById('closeModalBtn'),
        bookTitle: document.getElementById('bookTitle')
    };

    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const rawData = await response.json();

        // ヘッダーのタイトルを反映
        els.bookTitle.innerText = rawData.title;

        // ブラウザのタイトルタグを自動で書き換える
        document.title = `${rawData.title} | JPリターンズ`;

        // 最終ページ（奥付）の自動生成
        const colophonHtml = `
            <div class="colophon-top">
                <div class="colophon-title">${rawData.title}</div>
                ${rawData.thumb ? `<img src="${rawData.thumb}" class="colophon-thumb" alt="表紙サムネイル">` : ''}
            </div>
            <hr class="colophon-divider">
            <div class="colophon-bottom">
                <p><strong>【発行日】</strong><br>${rawData.date}</p>
                <p><strong>【発行元】</strong><br>J.P.RETURNS 編集部<br>https://wealthknowledge.jpreturns.com/<br>〒100-6923 東京都千代田区丸の内2-6-1 丸の内パークビルディング23階<br>&copy; J.P.Returns. All rights reserved.</p>
                <p>本作品の全部あるいは一部を無断で複製・転載・配信・送信したり、ホームページやSNS上に転載することを禁止します。本作品の内容を無断で改変、改ざん等を行うことも禁止します。また、有償・無償にかかわらず本作品を第三者に譲渡することはできません。</p>
                <p><strong>【注意】</strong><br>本書は情報の提供および学習を目的としたものであり、発行元であるウェルスナレッジ編集部独自の調査・見解に基づいて執筆しています。投資の運用における成功においてを保証するものではありません。<br>本書の内容に基づいた運用や判断等については必ずご自身の責任と判断によって行ってください。本書の内容に基づいて行った結果については、発行元および J.P.RETURNS 株式会社はいかなる責任も負いかねます。<br>なお、本書に記載されているケース等については、いずれも執筆当時の事例を参考にしたものであり今後変更される可能性があります。</p>
            </div>
        `;
        rawData.pages.push({
            id: rawData.pages.length + 1,
            chapterTitle: "奥付",
            content: colophonHtml
        });

        // --- 目次と章タイトルの自動生成 ---
        let currentChapterTitle = rawData.title;
        const tocList = [];

        rawData.pages.forEach(page => {
            if (page.id === 1) {
                page.chapterTitle = "表紙";
                tocList.push({ id: 1, title: "表紙" });
                return;
            }

            // 正規表現で h1 または h2 のテキストを抽出
            const match = page.content.match(/<(h[12])[^>]*>(.*?)<\/\1>/);
            if (match) {
                const extractedTitle = match[2].replace(/<[^>]+>/g, '').trim();
                currentChapterTitle = extractedTitle;
                tocList.push({ id: page.id, title: extractedTitle });
            }

            // フッター表示用に現在の章タイトルをセット
            page.chapterTitle = currentChapterTitle;
        });

        rawData.toc = tocList;
        ebookData = rawData;

        // UIの初期化
        updateResponsiveViewMode();
        populateToc();
        setupEventListeners();
        renderPages(1);

    } catch (error) {
        console.error("データの読み込みに失敗しました:", error);
        alert("書籍データの読み込みに失敗しました。");
    }
});

// ========================================================
// レンダリング・表示切替ロジック
// ========================================================
function updateResponsiveViewMode() {
    if (window.innerWidth < 768) {
        viewMode = 'one';
    }
    els.viewModeOne.className = (viewMode === 'one') ? 'toggle-btn active-dark' : 'toggle-btn';
    els.viewModeTwo.className = (viewMode === 'two') ? 'toggle-btn active-dark' : 'toggle-btn';
}

function renderPages(pageIndex) {
    if (!ebookData) return;

    const total = ebookData.pages.length;
    pageIndex = Math.max(1, Math.min(pageIndex, total));

    if (viewMode === 'two' && pageIndex % 2 === 0) pageIndex--;
    currentPage = pageIndex;

    const fontClass = `text-size-${currentFontSize}`;
    const createPageHtml = (pageData, widthClass, shadowClass) => {
        if (!pageData) return '';
        const contentHtml = pageData.id === 1 ? pageData.content : `<div class="page-content">${pageData.content}</div>`;
        const titleText = pageData.chapterTitle || ebookData.title;

        return `
            <div class="page-card ${widthClass} ${shadowClass} ${fontClass}">
                ${contentHtml}
                <div class="page-footer">
                    <span>${titleText}</span>
                    <span>${pageData.id}</span>
                </div>
            </div>
        `;
    };

    const pagesToRender = viewMode === 'two'
        ? [
            { data: ebookData.pages[currentPage - 1], width: 'half', shadow: 'left-page-shadow' },
            { data: ebookData.pages[currentPage], width: 'half', shadow: 'right-page-shadow' }
        ]
        : [
            { data: ebookData.pages[currentPage - 1], width: 'full', shadow: 'left-page-shadow' }
        ];

    els.container.innerHTML = pagesToRender
        .map(p => createPageHtml(p.data, p.width, p.shadow))
        .join('');

    const isTwoPage = (viewMode === 'two' && currentPage < total);
    els.currentPageNum.innerText = isTwoPage ? `${currentPage}-${currentPage + 1}` : currentPage;
    els.totalPagesNum.innerText = total;
    els.pageSlider.value = isTwoPage ? currentPage + 1 : currentPage;
    els.pageSlider.max = total;

    els.prevBtn.disabled = (currentPage <= 1);
    els.nextBtn.disabled = (isTwoPage ? currentPage >= total - 1 : currentPage >= total);

    // ========================================================
    // ★ GA4 アクセス解析用: ページめくりの計測
    // ========================================================
    if (typeof gtag === 'function') {
        // "read_page" というカスタムイベントをGA4に送信
        gtag('event', 'read_page', {
            'book_title': ebookData.title,
            'page_number': currentPage
        });
    }
}

// ========================================================
// ページ遷移・機能ロジック
// ========================================================
function nextPage() {
    const step = (viewMode === 'two') ? 2 : 1;
    if (currentPage + step <= ebookData.pages.length + (viewMode === 'two' ? 1 : 0)) {
        renderPages(currentPage + step);
    }
}

function prevPage() {
    const step = (viewMode === 'two') ? 2 : 1;
    if (currentPage - step >= 1) {
        renderPages(currentPage - step);
    }
}

const changeViewMode = (mode) => {
    if (viewMode === mode) return;
    viewMode = mode;
    updateResponsiveViewMode();
    renderPages(currentPage);
};

function populateToc() {
    els.tocList.innerHTML = ebookData.toc.map(item => `
        <button onclick="jumpToPage(${item.id})" class="toc-item">
            ${item.id}. ${item.title}
        </button>
    `).join('');
}

function openToc() {
    els.tocDrawer.classList.add('open');
    els.tocOverlay.classList.remove('hidden');
}

function closeToc() {
    els.tocDrawer.classList.remove('open');
    els.tocOverlay.classList.add('hidden');
}

window.jumpToPage = function (pageId) {
    closeToc();
    renderPages(pageId);
};

function openModal(imageSrc) {
    els.zoomModalBody.innerHTML = `<img src="${imageSrc}" alt="拡大画像">`;
    els.zoomModal.classList.remove('hidden');
}

function closeModal() {
    els.zoomModal.classList.add('hidden');
}

// ========================================================
// イベントリスナーの集約
// ========================================================
function setupEventListeners() {
    els.nextBtn.addEventListener('click', nextPage);
    els.prevBtn.addEventListener('click', prevPage);
    els.pageSlider.addEventListener('input', (e) => renderPages(parseInt(e.target.value)));

    els.viewModeOne.addEventListener('click', () => changeViewMode('one'));
    els.viewModeTwo.addEventListener('click', () => changeViewMode('two'));

    els.settingsBtn.addEventListener('click', () => els.settingsPanel.classList.toggle('hidden'));
    els.sizeOpts.forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentFontSize = e.target.getAttribute('data-size');
            els.sizeOpts.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderPages(currentPage);
        });
    });

    els.tocBtn.addEventListener('click', openToc);
    els.closeTocBtn.addEventListener('click', closeToc);
    els.tocOverlay.addEventListener('click', closeToc);

    els.fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    });

    els.closeModalBtn.addEventListener('click', closeModal);
    els.zoomModal.addEventListener('click', (e) => {
        if (e.target.id === 'zoomModal') closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'PageDown') nextPage();
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') prevPage();
        if (e.key === 'Escape') {
            closeToc();
            closeModal();
        }
    });

    let touchStartX = 0, touchEndX = 0;
    els.bookEl.addEventListener('touchstart', e => touchStartX = e.changedTouches[0].screenX, { passive: true });
    els.bookEl.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchStartX - touchEndX > 50) nextPage();
        if (touchEndX - touchStartX > 50) prevPage();
    }, { passive: true });

    els.mainContent.addEventListener('click', (e) => {
        if (e.target.closest('.nav-btn')) return;
        const clickX = e.clientX, width = window.innerWidth;
        if (clickX > width * 0.2 && clickX < width * 0.8) {
            if (!els.settingsPanel.classList.contains('hidden')) {
                els.settingsPanel.classList.add('hidden');
                return;
            }
            isUiVisible = !isUiVisible;
            document.body.classList.toggle('ui-hidden', !isUiVisible);
        }
    });

    window.addEventListener('resize', () => {
        updateResponsiveViewMode();
        renderPages(currentPage);
    });
}