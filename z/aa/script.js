const ebookData = {
    title: "年収2500万円の税金対策は不動産投資が鍵になる",
    coverImage: "test.png",
    pages: [
        { id: 1, chapterTitle: "表紙", isCover: true },
        {
            id: 2, chapterTitle: "はじめに",
            content: `
                <h2>はじめに</h2>
                <p>「年収2500万円あれば、お金に困ることはないだろう」</p>
                <p>そう思われがちですが、実際には高所得者ほど税金負担が重く、手取りは思ったよりも少ないのが現実です。</p>
                <p>所得税・住民税・社会保険料といった各種税金は、年収が上がるほど比例して増えていき、気づけば毎年1,000万円以上を納税に充てているケースも珍しくありません。</p>
                <blockquote>
                    <h4 style="margin-bottom:0.25rem;">💡 編集部メッセージ</h4>
                    税金はただ支払うものではなく、知識を持って<strong>戦略的にコントロールするもの</strong>です。
                </blockquote>`
        },
        {
            id: 3, chapterTitle: "1. 年収2500万円の税金と手取り",
            content: `
                <h2>年収2500万円の税金と手取りはいくら？</h2>
                <p>日本の所得税は「累進課税制度」に基づいており、所得が高くなるほど税率も上がる仕組みだからです。</p>
                <div class="table-preview" onclick="zoomElement('taxTableWrapper', '所得税率と控除額')">
                    <div style="display:flex; justify-content:space-between; font-size:0.75rem; font-weight:700; margin-bottom:0.4rem;">
                        <span>【表1】所得税率と控除額（国税庁）</span>
                        <span style="color:var(--color-accent-gold);"><i class="fa-solid fa-magnifying-glass-plus"></i> 拡大表示</span>
                    </div>
                    <div id="taxTableWrapper">
                        <table class="custom-table">
                            <thead><tr><th>課税所得金額</th><th>税率</th><th>控除額</th></tr></thead>
                            <tbody>
                                <tr><td>1,000円 〜 1,949,000円</td><td>5％</td><td>0円</td></tr>
                                <tr><td>1,950,000円 〜 3,299,000円</td><td>10％</td><td>97,500円</td></tr>
                                <tr><td>3,300,000円 〜 6,949,000円</td><td>20％</td><td>427,500円</td></tr>
                                <tr><td>6,950,000円 〜 8,999,000円</td><td>23％</td><td>636,000円</td></tr>
                                <tr><td>9,000,000円 〜 17,999,000円</td><td>33％</td><td>1,536,000円</td></tr>
                                <tr style="background:#fef9c3; font-weight:700;"><td>18,000,000円 〜 39,999,000円</td><td>40％</td><td>2,796,000円</td></tr>
                                <tr><td>40,000,000円 以上</td><td>45％</td><td>4,796,000円</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>`
        },
        {
            id: 4, chapterTitle: "税負担の現実と専門家の見解",
            content: `
                <p>家族構成にもよりますが、所得税（約560万円）、住民税（約210万円）、社会保険料（約160万円）を合計すると、年間で<strong>930万円以上が徴収</strong>されます。</p>
                <p>手取り額は1,500万円弱（月額約130万円）となり、高収入とはいえ都心での生活費や教育費を考えると余裕があるとは言い切れません。</p>
                <div class="advisor-card">
                    <div class="advisor-card__header">
                        <div class="advisor-card__avatar">今中</div>
                        <div>
                            <h4 style="margin:0; font-size:0.8rem; color:var(--color-text-dark);">税理士 今中氏の解説</h4>
                            <div style="font-size:0.7rem; color:var(--color-accent-gold);">自分に合う節税方法を見つけることが大切</div>
                        </div>
                    </div>
                    <p style="font-size:0.75rem; margin:0; padding-top:0.4rem; border-top:1px solid rgba(245,158,11,0.2);">モデルケースの手取り額です。扶養家族や各種控除を網羅的に活用することが大切です。</p>
                </div>`
        },
        {
            id: 5, chapterTitle: "2. 高収入者が税金対策に取り組むべき理由",
            content: `
                <h2>高収入者が税金対策に取り組むべき理由</h2>
                <p>年収2500万円クラスにとって、税金対策は単なる節約術ではなく、<strong>効率的な資産形成をするための重要な戦略</strong>です。</p>
                <h3>主な3つの理由</h3>
                <ul>
                    <li><strong>節税効果が大きいから</strong>：高税率が適用されるため恩恵も絶大</li>
                    <li><strong>将来の資産形成につながるから</strong>：浮いた資金を再投資へ展開</li>
                    <li><strong>資金効率が良くなるから</strong>：税引き前の効果的運用が可能</li>
                </ul>`
        },
        {
            id: 6, chapterTitle: "節税効果と資金効率のメカニズム",
            content: `
                <h3>節税効果の大きさ</h3>
                <p>年収300万円の方が10万円の控除を受けた効果は約2万円ですが、<strong>年収2500万円だと約5万円の節税効果</strong>（所得税40%+住民税10%）が得られます。</p>
                <h3>資金効率の向上</h3>
                <p>手取りから投資するのではなく、損益通算などを経由することで税引前と同等の効率で運用を進められます。</p>`
        },
        {
            id: 7, chapterTitle: "3. 年収2500万円クラスに有効な税金対策3選",
            content: `
                <h2>有効な税金対策3選</h2>
                <h3>1. iDeCo・NISAを活用した積立投資</h3>
                <p>新NISAでは年間360万円（限度額1,800万円）まで長期非課税運用が可能です。</p>
                <h3>2. ふるさと納税</h3>
                <p>年収2500万円では実質2,000円で80万円超の寄附が可能。家計費節減に大きく貢献します。</p>
                <h3>3. 不動産投資による節税（本命）</h3>
                <p>減価償却費を活用して損益通算し、大幅な所得圧縮を実現します。</p>`
        },
        {
            id: 8, chapterTitle: "なぜ不動産投資は有効なのか？",
            content: `
                <h2>不動産投資が節税に有効な理由</h2>
                <p>理由の筆頭は<strong>「損益通算」と「減価償却費」</strong>です。帳簿上の赤字を給与所得と合算して申告できます。</p>
                <div style="padding:0.75rem; background:var(--color-accent-gold-light); border-radius:0.5rem; text-align:center; border:1px solid var(--color-accent-gold-border);">
                    <h4 style="margin:0; color:var(--color-text-dark);">【図解】節税インパクト計算例</h4>
                    <div style="font-size:0.75rem; margin-top:0.4rem;">
                        不動産所得の帳簿上赤字：<strong style="color:#dc2626;">200万円</strong><br>
                        適用税率：<strong>50%</strong><br>
                        <span style="font-weight:700; color:var(--color-accent-gold); display:inline-block; margin-top:0.25rem;">年間節税効果 ≒ 約100万円</span>
                    </div>
                </div>`
        },
        {
            id: 9, chapterTitle: "不動産投資のメリット (前編)",
            content: `
                <h2>節税以外の主なメリット</h2>
                <h3>1. 安定した家賃収入</h3>
                <p>景気に左右されにくい長期的・継続的なキャッシュフローが得られます。</p>
                <h3>2. レバレッジ効果</h3>
                <p>高年収の信用力を活かして融資を引き出し、少ない自己資金で大きな資産を運用できます。</p>
                <h3>3. インフレヘッジ効果</h3>
                <p>実物資産である不動産価値は物価上昇に連動して維持されます。</p>`
        },
        {
            id: 10, chapterTitle: "不動産投資のメリット (後編)",
            content: `
                <h3>4. 生命保険効果（団信）</h3>
                <p>万が一の際はローン残債が0円になり、無借金物件を家族へ残せます。</p>
                <h3>5. 相続税対策</h3>
                <p>現金よりも路線価・固定資産税評価額が大幅に低く評価されます。</p>
                <div class="table-preview" onclick="zoomImage('https://placehold.co/800x350/f8fafc/0f172a?text=%E7%9B%B8%E7%B6%9A%E7%A5%8E%E8%A9%95%E4%20%E4%BE%A1%E3%81%AE%E5%9C%A7%E7%B8%AE%E3%83%A1%E3%82%AB%E3%83%8B%E3%82%BA%E3%83%A0', '相続税評価額の圧縮メカニズム')">
                    <img src="https://placehold.co/600x200/f8fafc/0f172a?text=%E7%9B%B8%E7%B6%9A%E7%A5%8E%E8%A9%95%E4%20%E4%BE%A1%E3%81%AE%E5%9C%A7%E7%B8%AE%E3%83%A1%E3%82%AB%E3%83%8B%E3%82%BA%E3%83%A0" alt="相続税圧縮" style="width:100%; border-radius:0.25rem;">
                    <span style="font-size:0.65rem; color:var(--color-text-muted); display:block; text-align:center; margin-top:0.25rem;">【図2】相続税評価額の圧縮メカニズム（タップで拡大）</span>
                </div>`
        },
        {
            id: 11, chapterTitle: "6. 不動産投資のリスクと管理",
            content: `
                <h2>把握しておくべき主なリスク</h2>
                <ul>
                    <li><strong>空室リスク</strong>：入居率の維持戦略</li>
                    <li><strong>資産価値低減リスク</strong>：立地選びが最大の予防策</li>
                    <li><strong>家賃滞納リスク</strong>：管理会社の活用</li>
                    <li><strong>金利変動リスク</strong>：固定金利・繰上返済</li>
                    <li><strong>災害リスク</strong>：ハザードマップ確認と保険</li>
                </ul>
                <p>都心駅近物件の選択やシミュレーションでリスクはコントロール可能です。</p>`
        },
        {
            id: 12, chapterTitle: "7. まとめ・無料個別相談",
            content: `
                <h2>まとめ：不動産投資が資産拡大の鍵</h2>
                <p>高所得層の資産形成には「守り（節税）」と「攻め（収益化）」の高度な調和が欠かせません。</p>
                <div style="padding:0.75rem; background:var(--color-text-dark); color:#ffffff; border-radius:0.75rem; text-align:center; margin:0.75rem 0;">
                    <h4 style="color:#ffffff; margin:0; font-size:0.8rem;">不動産投資が学べる動画プレゼント</h4>
                    <button class="btn btn--primary" style="width:100%; margin-top:0.5rem; font-size:0.75rem;" onclick="alert('動画リンクを送信しました。')">
                        セミナー動画を受け取る
                    </button>
                </div>
                <div style="padding:0.75rem; background:var(--color-accent-gold-light); border-radius:0.75rem; text-align:center; border:1px solid var(--color-accent-gold-border);">
                    <h4 style="margin:0; font-size:0.8rem; color:var(--color-text-dark);">J.P.RETURNS の無料個別相談</h4>
                    <button class="btn btn--primary" style="width:100%; margin-top:0.5rem; font-size:0.75rem;" onclick="alert('無料個別相談の予約画面へ予約移動します。')">
                        無料個別相談に申し込む
                    </button>
                </div>`
        }
    ]
};

let currentPage = 1;
let viewMode = 'two';
let userSelectedViewMode = null;
let currentFontSize = 'base';
let controlsVisible = false;
let autoHideTimer = null;

const appHeader = document.getElementById('appHeader');
const appFooter = document.getElementById('appFooter');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const miniPageBadge = document.getElementById('miniPageBadge');

// ページ進む／戻る共通関数
function nextPage() {
    const step = viewMode === 'two' ? 2 : 1;
    if (currentPage < ebookData.pages.length) {
        renderPages(currentPage + step);
    }
}

function prevPage() {
    const step = viewMode === 'two' ? 2 : 1;
    if (currentPage > 1) {
        renderPages(currentPage - step);
    }
}

// UIコントロール（ヘッダー・フッター・ナビボタン）の表示制御
function showControls() {
    controlsVisible = true;
    appHeader.classList.add('app-header--visible');
    appFooter.classList.add('app-footer--visible');
    prevBtn.classList.add('nav-btn--visible');
    nextBtn.classList.add('nav-btn--visible');
    if (miniPageBadge) miniPageBadge.style.opacity = '0';

    clearTimeout(autoHideTimer);
    autoHideTimer = setTimeout(hideControls, 4000);
}

function hideControls() {
    controlsVisible = false;
    appHeader.classList.remove('app-header--visible');
    appFooter.classList.remove('app-footer--visible');
    prevBtn.classList.remove('nav-btn--visible');
    nextBtn.classList.remove('nav-btn--visible');
    if (miniPageBadge) miniPageBadge.style.opacity = '1';
    document.getElementById('settingsPanel').classList.remove('settings-panel--open');
}

// ビューポート（画面タップ・クリック）のイベント判定
const viewport = document.getElementById('readerViewport');

let touchStartX = 0;
let touchStartY = 0;

viewport.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true });

viewport.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;

    // 横方向のスワイプ判定
    if (Math.abs(diffX) > 50 && Math.abs(diffY) < 100) {
        if (diffX < 0) {
            nextPage();
        } else {
            prevPage();
        }
    }
});

viewport.addEventListener('click', (e) => {
    // UI上のボタンやモーダル、設定パネルのクリック時は処理をスキップ
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.table-preview') || e.target.closest('#settingsPanel') || e.target.closest('.drawer')) {
        return;
    }

    const width = window.innerWidth;
    const clickX = e.clientX;

    // 左側25%タップで前へ、右側25%タップで次へ、中央でUI表示切り替え
    if (clickX < width * 0.25) {
        prevPage();
    } else if (clickX > width * 0.75) {
        nextPage();
    } else {
        controlsVisible ? hideControls() : showControls();
    }
});

// マウスホイール（スクロール）でのページ移動
let isWheelCooldown = false;
viewport.addEventListener('wheel', (e) => {
    if (isWheelCooldown) return;

    if (e.deltaY > 0 || e.deltaX > 0) {
        nextPage();
        triggerWheelCooldown();
    } else if (e.deltaY < 0 || e.deltaX < 0) {
        prevPage();
        triggerWheelCooldown();
    }
}, { passive: true });

function triggerWheelCooldown() {
    isWheelCooldown = true;
    setTimeout(() => { isWheelCooldown = false; }, 350);
}

// PCの矢印キー入力でのページ移動
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
        nextPage();
    } else if (e.key === 'ArrowLeft') {
        prevPage();
    }
});

function updateResponsiveViewMode() {
    viewMode = (window.innerWidth < 768) ? 'one' : (userSelectedViewMode || 'two');
    document.getElementById('viewModeOne').className = (viewMode === 'one') ? 'btn btn--primary' : 'btn';
    document.getElementById('viewModeTwo').className = (viewMode === 'two') ? 'btn btn--primary' : 'btn';
}

function buildPageHTML(pageData, sideClass, fontClass, total) {
    if (!pageData) return `<div class="page-card ${sideClass}"></div>`;

    if (pageData.isCover) {
        return `
            <div class="page-card ${sideClass} page-card--cover">
                <img src="${ebookData.coverImage}" alt="表紙" class="cover-image">
            </div>`;
    }

    return `
        <div class="page-card ${sideClass} ${fontClass}">
            <div class="reader-content">${pageData.content}</div>
            <div class="page-footer">
                <span>${sideClass.includes('left') ? pageData.chapterTitle : pageData.id}</span>
                <span>${sideClass.includes('left') ? pageData.id : pageData.chapterTitle}</span>
            </div>
        </div>`;
}

function renderPages(pageIndex) {
    const container = document.getElementById('pageSpread');
    const total = ebookData.pages.length;

    if (pageIndex < 1) pageIndex = 1;
    if (pageIndex > total) pageIndex = total;
    if (viewMode === 'two' && pageIndex % 2 === 0 && pageIndex > 1) pageIndex -= 1;

    currentPage = pageIndex;
    const fontClass = `text-size-${currentFontSize}`;
    let html = '';

    if (viewMode === 'two') {
        const left = ebookData.pages[pageIndex - 1];
        const right = ebookData.pages[pageIndex];

        html += buildPageHTML(left, 'page-card--left', fontClass, total);
        html += buildPageHTML(right, 'page-card--right', fontClass, total);
    } else {
        const single = ebookData.pages[pageIndex - 1];
        if (single.isCover) {
            html = `
                <div class="page-card page-card--single page-card--cover">
                    <img src="${ebookData.coverImage}" alt="表紙" class="cover-image">
                </div>`;
        } else {
            html = `
                <div class="page-card page-card--single ${fontClass}">
                    <div class="reader-content">${single.content}</div>
                    <div class="page-footer"><span>${single.chapterTitle}</span><span>${single.id} / ${total}</span></div>
                </div>`;
        }
    }

    container.innerHTML = html;
    document.getElementById('currentPageNum').innerText = currentPage;
    document.getElementById('totalPagesNum').innerText = total;
    document.getElementById('miniCurrentPage').innerText = currentPage;
    document.getElementById('miniTotalPage').innerText = total;
    document.getElementById('pageSlider').value = currentPage;
    document.getElementById('progressPercent').innerText = `${Math.round((currentPage / total) * 100)}%`;

    prevBtn.disabled = (currentPage <= 1);
    nextBtn.disabled = (viewMode === 'two' ? currentPage >= total - 1 : currentPage >= total);
}

window.zoomImage = function (src, title) {
    document.getElementById('zoomModalTitle').innerText = title;
    document.getElementById('zoomModalBody').innerHTML = `<img src="${src}" style="max-width:100%; max-height:70vh; border-radius:0.5rem;">`;
    document.getElementById('zoomModal').classList.add('modal--open');
};

window.zoomElement = function (id, title) {
    const el = document.getElementById(id);
    if (!el) return;
    document.getElementById('zoomModalTitle').innerText = title;
    document.getElementById('zoomModalBody').innerHTML = `<div style="width:100%; overflow-x:auto;">${el.outerHTML}</div>`;
    document.getElementById('zoomModal').classList.add('modal--open');
};

window.closeZoomModal = function () {
    document.getElementById('zoomModal').classList.remove('modal--open');
};

prevBtn.addEventListener('click', prevPage);
nextBtn.addEventListener('click', nextPage);

document.getElementById('pageSlider').addEventListener('input', (e) => renderPages(parseInt(e.target.value)));

document.getElementById('settingsBtn').addEventListener('click', () => {
    document.getElementById('settingsPanel').classList.toggle('settings-panel--open');
});

document.querySelectorAll('.size-opt').forEach(btn => {
    btn.addEventListener('click', (e) => {
        currentFontSize = e.currentTarget.getAttribute('data-size');
        document.querySelectorAll('.size-opt').forEach(b => b.className = 'btn size-opt');
        e.currentTarget.className = 'btn size-opt btn--primary';
        renderPages(currentPage);
    });
});

document.getElementById('viewModeOne').addEventListener('click', () => { userSelectedViewMode = 'one'; updateResponsiveViewMode(); renderPages(currentPage); });
document.getElementById('viewModeTwo').addEventListener('click', () => { userSelectedViewMode = 'two'; updateResponsiveViewMode(); renderPages(currentPage); });

// TOC (目次)
const tocDrawer = document.getElementById('tocDrawer');
const tocOverlay = document.getElementById('tocOverlay');
document.getElementById('tocBtn').addEventListener('click', () => {
    document.getElementById('tocList').innerHTML = ebookData.pages.map(p => `
        <button onclick="jumpToPage(${p.id})" class="btn" style="width:100%; justify-content:space-between; padding:0.6rem; border-bottom:1px solid var(--color-border-light);">
            <span>${p.id}. ${p.chapterTitle}</span>
            <i class="fa-solid fa-chevron-right" style="font-size:0.7rem; color:var(--color-text-muted);"></i>
        </button>`).join('');
    tocDrawer.classList.add('drawer--open');
    tocOverlay.classList.add('drawer-overlay--visible');
});

function closeToc() {
    tocDrawer.classList.remove('drawer--open');
    tocOverlay.classList.remove('drawer-overlay--visible');
}

document.getElementById('closeTocBtn').addEventListener('click', closeToc);
tocOverlay.addEventListener('click', closeToc);
window.jumpToPage = function (id) { closeToc(); renderPages(id); };

window.addEventListener('resize', () => { updateResponsiveViewMode(); renderPages(currentPage); });
window.onload = function () { updateResponsiveViewMode(); renderPages(1); };