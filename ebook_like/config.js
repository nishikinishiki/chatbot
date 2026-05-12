// 設定ファイル (config.js)

// 1. Google Apps ScriptのウェブアプリURL（完成データ用）
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyigqfQx0uNHXUIECwD3CxWEPT1Q4mpqJhABdvt8B2DFIdDDXWT3NmdxbdWPX5iHtV3AA/exec';

// 2. 質問者アイコンの画像URL
const BOT_ICON_URL = 'images/icon.png';

// 3. ファビコンの画像URL
const FAVICON_URL = 'images/favicon.png'; 

// 4. チャット開始時に表示するバナー画像のURL
const BANNER_IMAGE_URL = 'images/banner_ebook_like-dining.png';

// キャンペーンごとのバナー出し分け設定
const CAMPAIGN_BANNERS = {
    // 'utm_campaignの値' : '表示したい画像へのパス' の形式で追加します
    'like_dining': 'images/banner_ebook_like-dining.png',
    'like_suv': 'images/banner_ebook_like-suv.png',
    'like_watch': 'images/banner_ebook_like-watch.png',
};