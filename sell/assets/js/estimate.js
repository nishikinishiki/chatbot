/**
 * estimate.js
 * 投資用物件査定ロジック (基礎単価・計算処理)
 */

// 1. データ定義 (基礎単価: 万円/㎡)
// ※実際の運用ではAPIから取得するか、より詳細なマスタデータを使用します。
const BASE_PRICES = {
    "tokyo": {
        "chiyoda": { "1R": 150, "1K": 145, "1LDK": 160, "2LDK": 170 },
        "minato":   { "1R": 160, "1K": 155, "1LDK": 170, "2LDK": 180 },
        "shinjuku": { "1R": 110, "1K": 105, "1LDK": 120, "2LDK": 130 },
        "shibuya":  { "1R": 140, "1K": 135, "1LDK": 150, "2LDK": 160 },
        "toshima":  { "1R": 100, "1K": 95,  "1LDK": 110, "2LDK": 120 }, // サンプル値
        "other":    { "1R": 80,  "1K": 75,  "1LDK": 90,  "2LDK": 100 }
    },
    "kanagawa": {
        "yokohama": { "1R": 70,  "1K": 65,  "1LDK": 80,  "2LDK": 90 },
        "kawasaki": { "1R": 65,  "1K": 60,  "1LDK": 75,  "2LDK": 85 },
        "other":    { "1R": 50,  "1K": 45,  "1LDK": 55,  "2LDK": 65 }
    }
};

/**
 * 査定計算ロジック関数
 * 簡易査定ボタンクリック時に実行される
 */
function calculateEstimate() {
    // --- 1. 入力値の取得 ---
    const pref = document.getElementById("prefecture").value;
    const city = document.getElementById("city").value;
    const layout = document.getElementById("layout").value;
    const areaStr = document.getElementById("area").value;
    const floorStr = document.getElementById("floor").value;

    // バリデーション (必須項目)
    if (!pref || !city || !layout) {
        alert("必須項目（都道府県・市区町村・間取り）を入力してください。");
        return;
    }

    // --- 2. 基礎単価の取得 ---
    let basePriceUnit = 0;
    
    // データアクセス (存在しないキーへのアクセス回避)
    try {
        if(BASE_PRICES[pref][city] && BASE_PRICES[pref][city][layout]) {
            basePriceUnit = BASE_PRICES[pref][city][layout];
        } else if (BASE_PRICES[pref]["other"] && BASE_PRICES[pref]["other"][layout]) {
             // 区が見つからない場合のフォールバック
            basePriceUnit = BASE_PRICES[pref]["other"][layout];
        } else {
             // デフォルト
            basePriceUnit = 80;
        }
    } catch (e) {
        basePriceUnit = 80; 
        console.warn("Base price not found, using default.");
    }

    // --- 3. 補正係数と面積の処理 ---
    
    // 面積 (未入力時はレイアウトから仮定)
    let area = parseFloat(areaStr);
    if (isNaN(area) || area <= 0) {
        if (layout === '1R' || layout === '1K') area = 25;
        else if (layout === '1LDK') area = 40;
        else area = 55;
    }

    // 階数 (1階あがるごとに0.5%アップ)
    let floorFactor = 1.0;
    let floor = parseInt(floorStr);
    if (!isNaN(floor)) {
        floorFactor = 1 + (floor * 0.005);
    }

    // --- 4. 計算実行 ---
    // 単価計算 (階数補正込み)
    let adjustedUnitPrice = basePriceUnit * floorFactor;
    // 総額計算
    let estimatedPrice = adjustedUnitPrice * area;

    // 価格帯の生成 (±10%のレンジ)
    const minPrice = Math.floor(estimatedPrice * 0.9);
    const maxPrice = Math.floor(estimatedPrice * 1.1);

    // --- 5. 結果表示の更新 ---
    const resLocation = document.getElementById("resLocation");
    const resLayout = document.getElementById("resLayout");
    const priceMinEl = document.getElementById("priceMin");
    const priceMaxEl = document.getElementById("priceMax");
    const unitPriceEl = document.getElementById("unitPrice");
    const resultSection = document.getElementById("resultSection");

    // 場所・間取りテキスト更新
    const prefText = document.getElementById("prefecture").options[document.getElementById("prefecture").selectedIndex].text;
    const cityText = document.getElementById("city").options[document.getElementById("city").selectedIndex].text;
    
    resLocation.textContent = `${prefText}${cityText}`;
    resLayout.textContent = layout;

    // 金額更新 (カンマ区切り)
    priceMinEl.textContent = minPrice.toLocaleString();
    priceMaxEl.textContent = maxPrice.toLocaleString();
    unitPriceEl.textContent = adjustedUnitPrice.toFixed(1);

    // 結果セクションを表示 (アニメーション)
    resultSection.classList.remove("hidden");
    
    // スムーズスクロールで結果まで移動
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
}