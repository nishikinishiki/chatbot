"use strict";

// =================== scroll animation ===================
document.addEventListener("DOMContentLoaded", () => {
  const targets = document.querySelectorAll(".slideUp, .fadeIn");

  // 1. IntersectionObserver がサポートされているか判定
  if ('IntersectionObserver' in window) {

    // サポートされている最新のブラウザ（Meta広告内ブラウザ含む）の処理
    const checkAnimation = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-animated");
          observer.unobserve(entry.target); // 一度発火したら監視を解除
        }
      });
    };

    const anmOpt = { rootMargin: "0% 0% -5%", threshold: 0 };
    const anmObserver = new IntersectionObserver(checkAnimation, anmOpt);

    targets.forEach((el) => {
      anmObserver.observe(el);
    });

  } else {
    // 2. サポートされていない古いブラウザの場合の保険（フォールバック）
    // アニメーションは諦めて、最初からすべて表示状態にしてコンテンツを読ませる
    targets.forEach((el) => el.classList.add("is-animated"));
  }
});

// =================== dialog (進呈条件) ===================
const dialog = document.querySelector("dialog");
let dialogScrollY = 0;

function lockScroll() {
  dialogScrollY = window.scrollY;
  document.body.style.overflow = "hidden";
  document.body.style.position = "fixed";
  document.body.style.top = `-${dialogScrollY}px`;
  document.body.style.width = "100%";
}

function unlockScroll() {
  document.body.style.overflow = "";
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.width = "";
  window.scrollTo(0, dialogScrollY);
}

if (dialog) {
  // 古いアプリ内ブラウザ等、<dialog>.showModal()未対応環境のフォールバック
  const supportsShowModal = typeof dialog.showModal === "function";

  document.querySelectorAll(".dialog_open, .js-dialog-open").forEach((opener) => {
    opener.addEventListener("click", function (e) {
      e.preventDefault();
      if (supportsShowModal) {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
      dialog.classList.add("show");
      lockScroll();
    });
  });

  const closeBtn = document.querySelector(".dialog_close");
  if (closeBtn) closeBtn.addEventListener("click", closeDialog);

  dialog.addEventListener("click", (event) => {
    if (!event.target.closest(".dialog_inner")) closeDialog();
  });
}

function closeDialog() {
  if (!dialog) return;
  dialog.classList.remove("show");
  unlockScroll();
  const supportsShowModal = typeof dialog.showModal === "function";
  setTimeout(() => {
    if (supportsShowModal) {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }, 500);
}

// =================== parameter pass-through ===================
document.addEventListener("DOMContentLoaded", function () {
  const param = window.location.search;
  const lpParam = "?lp=ebook_renovation";

  document.querySelectorAll(".p-parameter-link").forEach(function (el) {
    const link = el.getAttribute("href");
    if (!link) return;
    el.setAttribute(
      "href",
      param ? link + lpParam + param.replace("?", "&") : link + lpParam
    );
  });
});

// =================== chatbot (PC: iframe popup) ===================
document.addEventListener("DOMContentLoaded", function () {
  const chatbot = document.querySelector(".js-chatbot");
  const closeBtn = document.querySelector(".js-chatbot-close-btn");
  const iframe = document.getElementById("ctaIframe");

  if (iframe) {
    const base = "https://toshi-knowledge.com/ebook_propertyinvestment/";
    const query = window.location.search;
    iframe.src = query ? base + "?" + query.substring(1) : base;
  }

  if (chatbot && closeBtn) {
    closeBtn.addEventListener("click", function () {
      chatbot.classList.remove("is-open");
      chatbot.classList.add("is-close");
    });
  }

  // CTA リンクのクリック: PCはチャットボット popup 起動、SPは通常遷移
  document.querySelectorAll(".js-chatbot-link").forEach((link) => {
    link.addEventListener("click", function (e) {
      if (link.classList.contains("js-dialog-open")) return;
      if (window.innerWidth > 768 && chatbot) {
        e.preventDefault();
        chatbot.classList.remove("is-close");
        chatbot.classList.add("is-open");
      }
    });
  });
});

// =================== PC floating CTA 表示/非表示 ===================
const floatingBtn = document.querySelector(".js-cta-floating");
const footerEl = document.getElementById("footer");

document.addEventListener("scroll", () => {
  if (!floatingBtn) return;

  const scrollY = window.scrollY;
  const footerTop = footerEl
    ? footerEl.getBoundingClientRect().top + scrollY - 600
    : Infinity;

  if (scrollY > 450) {
    if (scrollY > footerTop) {
      floatingBtn.classList.remove("is-visible");
      floatingBtn.classList.add("is-hidden");
    } else {
      floatingBtn.classList.remove("is-hidden");
      floatingBtn.classList.add("is-visible");
    }
  } else {
    floatingBtn.classList.remove("is-visible", "is-hidden");
  }
});

// =================== 追従ナビ: FVスクロール後にフェードイン / セクションハイライト / フッター付近で非表示 ===================
document.addEventListener("DOMContentLoaded", () => {
  const gnav = document.getElementById("gnav");
  if (!gnav) return;

  const gnavLinks = gnav.querySelectorAll(".gnav_link[data-section]");

  // FV が viewport から外れたら gnav を表示 (下からフェードイン)
  const fvEl = document.getElementById("fv");
  if (fvEl) {
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            gnav.classList.add("is-visible");
          } else {
            gnav.classList.remove("is-visible");
          }
        });
      },
      { threshold: 0 }
    ).observe(fvEl);
  }

  // セクションが viewport に入ったらリンクをアクティブに
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          gnavLinks.forEach((link) => {
            link.classList.toggle("is-active", link.dataset.section === id);
          });
        }
      });
    },
    { threshold: 0.3 }
  );

  document.querySelectorAll("section[id]").forEach((s) => sectionObserver.observe(s));

  // フッターが見えたら gnav を強制非表示
  if (footerEl) {
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          gnav.classList.toggle("is-hidden", entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    ).observe(footerEl);
  }
});

// =================== FV: renovation_photo ランダムグリッド ===================
document.addEventListener("DOMContentLoaded", () => {
  const cells = document.querySelectorAll(".js-fv-photo");
  if (!cells.length) return;

  const photos = [
    "./img/renovation_photo/002_R80228A.webp",
    "./img/renovation_photo/004_R60607A.webp",
    "./img/renovation_photo/004_R80430B_901.webp",
    "./img/renovation_photo/005_R80409D_105.webp",
    "./img/renovation_photo/006_R80226.webp",
    "./img/renovation_photo/007_R50608.webp",
    "./img/renovation_photo/011_R60328A.webp",
    "./img/renovation_photo/011_R80419A_202.webp",
    "./img/renovation_photo/013_R80219B.webp",
    "./img/renovation_photo/014_R50818.webp",
    "./img/renovation_photo/014_R60519B.webp",
    "./img/renovation_photo/017_R71208A.webp",
    "./img/renovation_photo/019_R80228A.webp",
    "./img/renovation_photo/019_R80329A_102.webp",
    "./img/renovation_photo/019_R80426_712.webp",
    "./img/renovation_photo/arbeil_nihonbashi.webp",
    "./img/renovation_photo/vera_heights_nihonbashi.webp",
    "./img/renovation_photo/pal_royal_akasaka.webp",
    "./img/renovation_photo/useful_yutenji.webp",
    "./img/renovation_photo/nisshin_nakameguro.webp",
  ];

  // シャッフル関数
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // 初期表示: 各セルに別々の写真を設定
  let pool = shuffle(photos);
  cells.forEach((cell, i) => {
    const img = cell.querySelector("img");
    img.src = pool[i % pool.length];
    img.alt = "リノベーション施工事例";
  });

  // 3秒ごとにランダムで1セルの画像を切り替え
  let usedIndexes = Array.from({ length: cells.length }, (_, i) => i % pool.length);

  setInterval(() => {
    const cellIdx = Math.floor(Math.random() * cells.length);
    const cell = cells[cellIdx];
    const img = cell.querySelector("img");

    // 現在使用中でない写真を選ぶ
    const available = photos.filter((p) => !usedIndexes.some((ui, ci) => ci !== cellIdx && photos[ui] === p));
    const nextPhoto = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : photos[Math.floor(Math.random() * photos.length)];

    // フェードで切り替え（CSSのopacity transition 1.3sに合わせる）
    img.style.opacity = "0";
    setTimeout(() => {
      img.src = nextPhoto;
      img.style.opacity = "1";
      usedIndexes[cellIdx] = photos.indexOf(nextPhoto);
    }, 1300);
  }, 3800);
});

// =================== 横スクロールカルーセル (施工事例 / FV共通) ===================
function initPhotoCarousel(carouselSelector, itemClassName, altText, itemWidthPC, itemWidthSP) {
  document.addEventListener("DOMContentLoaded", () => {
    const carousel = document.querySelector(carouselSelector);
    if (!carousel) return;

    const photos = [
      "./img/renovation_photo/002_R80228A.webp",
      "./img/renovation_photo/004_R60607A.webp",
      "./img/renovation_photo/004_R80430B_901.webp",
      "./img/renovation_photo/005_R80409D_105.webp",
      "./img/renovation_photo/006_R80226.webp",
      "./img/renovation_photo/007_R50608.webp",
      "./img/renovation_photo/011_R60328A.webp",
      "./img/renovation_photo/011_R80419A_202.webp",
      "./img/renovation_photo/013_R80219B.webp",
      "./img/renovation_photo/014_R50818.webp",
      "./img/renovation_photo/014_R60519B.webp",
      "./img/renovation_photo/017_R71208A.webp",
      "./img/renovation_photo/019_R80228A.webp",
      "./img/renovation_photo/019_R80329A_102.webp",
      "./img/renovation_photo/019_R80426_712.webp",
      "./img/renovation_photo/arbeil_nihonbashi.webp",
      "./img/renovation_photo/vera_heights_nihonbashi.webp",
      "./img/renovation_photo/pal_royal_akasaka.webp",
      "./img/renovation_photo/useful_yutenji.webp",
      "./img/renovation_photo/nisshin_nakameguro.webp",
    ];

    // シャッフルして2周分を生成（ループのため）
    const shuffle = (arr) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    const shuffled = shuffle(photos);
    const items = [...shuffled, ...shuffled]; // 無限ループ用に2周

    const corners = ["corner-tl", "corner-tr", "corner-bl", "corner-br"];

    items.forEach((src) => {
      const div = document.createElement("div");
      div.className = itemClassName;
      // 各写真にランダムで1角だけ角丸を付与
      div.classList.add(corners[Math.floor(Math.random() * corners.length)]);
      const img = document.createElement("img");
      img.src = src;
      img.alt = altText;
      img.loading = "lazy"; // jsで生成する画像にも遅延読み込みを適用
      div.appendChild(img);
      carousel.appendChild(div);
    });

    // 自動スクロール（右から左）
    let offset = 0;
    let isPaused = false;
    let isIntersecting = false; // 【追加】画面内に入っているかどうかのフラグ
    const speed = 0.5; // px/frame

    const itemWidth = window.innerWidth > 768 ? itemWidthPC : itemWidthSP; // item + gap
    const totalW = itemWidth * shuffled.length;

    // 【追加】カルーセルが画面内に入っているかを監視
    const observer = new IntersectionObserver((entries) => {
      isIntersecting = entries[0].isIntersecting;
    });
    observer.observe(carousel);

    const tick = () => {
      // 【修正】画面内に入っている時（isIntersecting === true）のみ処理を実行
      if (!isPaused && isIntersecting) {
        offset += speed;
        if (offset >= totalW) offset = 0;
        carousel.style.transform = `translateX(-${offset}px)`;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    // PC: ホバーで一時停止
    carousel.addEventListener("mouseenter", () => { isPaused = true; });
    carousel.addEventListener("mouseleave", () => { isPaused = false; });

    // SP: スワイプ対応
    if (window.innerWidth <= 768) {
      let startX = 0;
      let startOff = 0;

      carousel.parentElement.addEventListener("touchstart", (e) => {
        isPaused = true;
        startX = e.touches[0].clientX;
        startOff = offset;
      }, { passive: true });

      carousel.parentElement.addEventListener("touchmove", (e) => {
        const dx = startX - e.touches[0].clientX;
        offset = Math.max(0, startOff + dx);
        if (offset >= totalW) offset = offset % totalW;
        carousel.style.transform = `translateX(-${offset}px)`;
      }, { passive: true });

      carousel.parentElement.addEventListener("touchend", () => {
        isPaused = false;
      }, { passive: true });
    }
  });
}

initPhotoCarousel(".js-jirei-carousel", "jirei_carousel_item", "施工事例", 348, 538);
initPhotoCarousel(".js-fv-carousel", "fv_carousel_item_sp", "リノベーション施工事例", 348, 428);

// =================== SP fixed CTA 表示/非表示 ===================
document.addEventListener("DOMContentLoaded", () => {
  const spFixedCta = document.querySelector(".sp_fixed_cta");
  if (!spFixedCta) return;

  const fvCtaEl = document.querySelector(".fv_cta");
  if (fvCtaEl) {
    new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) {
          spFixedCta.classList.add("is-visible");
        } else {
          spFixedCta.classList.remove("is-visible");
        }
      },
      { threshold: 0 }
    ).observe(fvCtaEl);
  }
});

// =================== SP アコーディオン（施工） ===================
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".js-sekou-toggle");
  const closeBtn = document.querySelector(".js-sekou-close");
  const body = document.querySelector(".js-sekou-accordion-body");
  if (!toggle || !body) return;

  toggle.addEventListener("click", () => {
    body.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    const accordion = toggle.closest(".sekou_accordion");
    if (accordion) accordion.classList.add("is-open");
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      body.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      const accordion = closeBtn.closest(".sekou_accordion");
      if (accordion) accordion.classList.remove("is-open");
    });
  }
});

// =================== SP アコーディオン（安心の証） ===================
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".js-ansin-toggle");
  const closeBtn = document.querySelector(".js-ansin-close");
  const body = document.querySelector(".js-ansin-accordion-body");
  if (!toggle || !body) return;

  toggle.addEventListener("click", () => {
    body.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    const accordion = toggle.closest(".ansin_accordion");
    if (accordion) accordion.classList.add("is-open");
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      body.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      const accordion = closeBtn.closest(".ansin_accordion");
      if (accordion) accordion.classList.remove("is-open");
    });
  }
});

// =================== sekou_no1_badge: 高さをsekou_head sec_headに追従 ===================
(() => {
  const head = document.querySelector(".sekou_head_row .sekou_head");
  const badge = document.querySelector(".sekou_head_row .sekou_no1_badge");
  if (!head || !badge) return;

  const syncBadgeHeight = () => {
    if (window.innerWidth <= 768) {
      badge.classList.remove("js-badge-matched");
      badge.style.height = "";
      return;
    }
    // 固定幅レイアウトに戻してsec_headの実測高さを取得（バッジ拡大による再計算の巻き戻りを防ぐ）
    badge.classList.remove("js-badge-matched");
    badge.style.height = "";
    const headHeight = head.getBoundingClientRect().height;
    badge.style.height = headHeight + "px";
    badge.classList.add("js-badge-matched");
  };

  window.addEventListener("load", syncBadgeHeight);
  window.addEventListener("resize", () => {
    clearTimeout(window.__sekouBadgeResizeTimer);
    window.__sekouBadgeResizeTimer = setTimeout(syncBadgeHeight, 150);
  });
})();