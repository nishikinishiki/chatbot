// 設定ファイル (config.js)

// 1. Google Apps ScriptのウェブアプリURL（完成データ用）
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyigqfQx0uNHXUIECwD3CxWEPT1Q4mpqJhABdvt8B2DFIdDDXWT3NmdxbdWPX5iHtV3AA/exec';

// 2. 質問者アイコンの画像URL
const BOT_ICON_URL = '/ebook_propertyinvestment/images/icon_jp.png';
const CAMPAIGN_ICONS = {
    // utm_campaign や utm_source の値をキーにする
    'fbtrg': '/ebook_propertyinvestment/images/icon_woman.png'
};

// 3. ファビコンの画像URL
const FAVICON_URL = '/ebook_propertyinvestment/images/favicon.png';

// 4. チャット開始時に表示するバナー画像のURL
const BANNER_IMAGE_URL = '/ebook_propertyinvestment/images/banner_ebook_gift.webp';

// 5. utm_sourceに応じて表示するバナー画像のURL
const CAMPAIGN_BANNERS = {
    'ALA_gift_ebook_4362': '/ebook_propertyinvestment/images/banner_buzz_260512.webp',
    'ALA_gift_ebook_4362PM': '/ebook_propertyinvestment/images/banner_buzz_260512.webp',
    'like_dining': '/ebook_propertyinvestment/images/banner_ebook_like-dining.png',
    'like_suv': '/ebook_propertyinvestment/images/banner_ebook_like-suv.png',
    'like_watch': '/ebook_propertyinvestment/images/banner_ebook_like-watch.png',
    'fbtrg': '/ebook_propertyinvestment/images/banner_ebook_meta.webp'
};