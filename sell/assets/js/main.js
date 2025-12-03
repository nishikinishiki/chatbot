/**
 * main.js
 * フォームUI操作、イベント制御
 */

// 市区町村データマスタ
const CITIES = {
    "tokyo": [
        { id: "chiyoda", name: "千代田区" },
        { id: "minato", name: "港区" },
        { id: "shinjuku", name: "新宿区" },
        { id: "shibuya", name: "渋谷区" },
        { id: "toshima", name: "豊島区" },
        { id: "other", name: "その他" }
    ],
    "kanagawa": [
        { id: "yokohama", name: "横浜市" },
        { id: "kawasaki", name: "川崎市" },
        { id: "other", name: "その他" }
    ]
};

/**
 * 市区町村プルダウンを更新する関数
 * 都道府県の選択変更時に発火
 */
function updateCities() {
    const prefSelect = document.getElementById("prefecture");
    const citySelect = document.getElementById("city");
    const selectedPref = prefSelect.value;

    // リセット
    citySelect.innerHTML = '<option value="">市区町村を選択</option>';
    citySelect.disabled = true;

    if (selectedPref && CITIES[selectedPref]) {
        CITIES[selectedPref].forEach(city => {
            const option = document.createElement("option");
            option.value = city.id;
            option.textContent = city.name;
            citySelect.appendChild(option);
        });
        citySelect.disabled = false;
    }
}

/**
 * 詳細フォーム送信 (モック)
 */
function submitFinal() {
    // バリデーション
    const name = document.querySelector("#detailForm input[type='text'][required]").value;
    const email = document.querySelector("#detailForm input[type='email']").value;
    const tel = document.querySelector("#detailForm input[type='tel']").value;

    if(!name || !email || !tel) {
        alert("必須項目（お名前・メールアドレス・電話番号）を入力してください。");
        return;
    }

    // 送信処理シミュレーション
    alert("査定依頼を受け付けました。\n担当者よりご連絡いたします。");
    
    // フォームリセット等の処理
    document.getElementById("simpleForm").reset();
    document.getElementById("detailForm").reset();
    document.getElementById("resultSection").classList.add("hidden");
    
    // トップへスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
}