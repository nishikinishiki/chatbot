document.addEventListener('DOMContentLoaded', function() {
    // === 1. Privacy Modal Logic ===
    const modal = document.getElementById('privacy-modal');
    const openBtn = document.getElementById('open-privacy-modal');
    const closeBtn = document.getElementById('close-modal-btn');
    const closeX = document.getElementById('close-modal-x');

    const openModal = (e) => {
        e.preventDefault();
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // 背景スクロール固定
    };
    const closeModal = () => {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // 背景スクロール解除
    };

    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    closeX.addEventListener('click', closeModal);
    
    // 背景クリックで閉じる
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });


    // === 2. Form Submission Logic (GAS Integration) ===
    const form = document.getElementById('scholarship-form');
    const submitBtn = document.getElementById('submit-btn');
    const formContainer = document.getElementById('form-container'); 
    const successView = document.getElementById('success-view');

    // ★ここに作成したGASアプリのURLを貼り付けます★
    const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbwspFKHuNRIvL7UO5SG35_r-ybYc5bl-rXQGvCloL7M0ujDBKWDQaYd2tT-3flYwUIV1g/exec'; 

    form.addEventListener('submit', function(e) {
        e.preventDefault(); // デフォルトの送信をキャンセル

        // URLが設定されていない場合のアラート
        if(GAS_API_URL === 'YOUR_GAS_WEB_APP_URL_HERE') {
            alert('エラー: 送信先のGoogle Apps Script URLが設定されていません。管理者へご連絡ください。');
            return;
        }

        // ボタンを無効化してローディング表示
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = '送信中...';

        // フォームデータを取得
        const formData = new FormData(form);

        // データをオブジェクトに変換
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        // GASへ送信
        fetch(GAS_API_URL, {
            method: 'POST',
            mode: 'no-cors', // CORSエラー回避
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(() => {
            // no-corsのためレスポンス内容は確認できないが、エラーなく到達すれば成功とみなす
            // フォームを非表示にして完了メッセージを表示
            form.style.display = 'none';
            successView.style.display = 'block';
            
            // 完了画面へスクロール
            successView.scrollIntoView({ behavior: 'smooth', block: 'center' });
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('送信に失敗しました。時間をおいて再度お試しください。');
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        });
    });
});