// --- UTM条件定義 ---
const UTM_RULES = {
  hideIncomeUnder500Keywords: [
    'ALA_gift_ebook',
    'BKR_gift_ebook'
  ],
  hideOccupationSelfEmployedKeywords: [
    'ALA_gift_ebook',
    'BKR_gift_ebook'
  ],
  hideAgeKeywords: [
    'ALA_gift_',
    'BKR_gift_',
    'GMO_gift_',
    'CRS_gift_'
  ],
  //「お申し込みの決め手」を表示する対象UTM
  showApplicationReason: [
    'ALA_gift_ebook_4362',
    'ALA_gift_ebook_4362PM'
  ]
};

// --- システムメッセージ定義 ---
const SYSTEM_MESSAGES = {
  // ウェルカムメッセージ
  welcome: [
    { text: "JPリターンズにご興味を持っていただきありがとうございます！<br>30秒程度の簡単な質問をさせてください。", isHtml: true }
  ],
  // 前半フロー完了メッセージ
  initial_complete: [
    { text: "送信が完了しました。<br>お問い合わせいただきありがとうございました！", isHtml: true },
    { text: "デジタル書籍は下記から閲覧できます！" },
    { text: "デジタル書籍を閲覧する", isHtml: false, isEbookBtn: true }
  ],
  // 全フロー完了メッセージ
  final_complete: [
    { text: "全ての情報を承りました。ご回答ありがとうございました！<br>後ほど担当よりご連絡いたします。", isHtml: true },
    { text: "お問い合わせはお電話でも受け付けております。<br>電話番号：<a href='tel:0120147104'>0120-147-104</a><br>営業時間：10:00～22:00（お盆・年末年始除く）", isHtml: true }
  ],
  // エラーメッセージ
  error: [
    { text: "エラーが発生し、データを送信できませんでした。お手数ですが、時間をおいて再度お試しください。", isHtml: false, isError: true }
  ]
};

const GIFT_TERMS_CONFIG = {
  link_text_prefix: "※進呈条件の詳細は",
  link_text_clickable: "こちら",
  popup_content:
    `<h3>えらべるデジタルギフト<br>プレゼント条件</h3>
    <h4>【個別面談・Web面談をお申込みのお客様】</h4>
    <p>プレゼントは、Web面談で20,000円、オフライン（対面）個別面談で50,000円相当のえらべるデジタルギフトを予定しております。面談でえらべるデジタルギフトプレゼントは以下の条件を満たした方が対象となります。なお、Web面談、個別面談において当社のコンサルタントと当社オフィスもしくは当社オフィス外、ウェブ通信にて対面し、当社サービスの十分な説明とお客様についての十分な（数回にわたり）情報を相互に交換することが要件となります。<br>
    また、えらべるデジタルギフトではAmazonギフトカード、PayPayマネーライト、楽天ポイントからご希望の1種のみを選択いただけます。<br>
    ご希望のポイントは、フォームの「ご質問・ご要望」欄に記入ください。お申し込み時にご記入がない場合は、Amazonギフトカードをプレゼントいたします。お申し込み完了後の変更は原則受け付けておりませんので、予めご了承ください。<br>
    ※お電話内容や商談の様子は弊社サービスへのお問い合わせ対応及びサービス改善のため録画・録音しております。予めご了承ください。<br>
    ※獲得いただける楽天ポイントは期間限定ポイントになり、有効期限はポイント獲得後、6ヶ月間です。</p>

    <h4>プレゼント対象者の条件</h4>
    <p>下記のすべての項⽬を満たしている⽅が対象になります。</p>
    <ul>
      <li>①年収700万円以上の方（※主婦、パートの方は、配偶者様の年収が700万円以上の場合に対象となります）</li>
      <li>②25歳以上満55歳未満の方（※主婦、パートの方は、配偶者様のご年齢にて判断いたします）</li>
      <li>③勤続年数2年以上の方（※主婦、パートの方は、配偶者様の勤続年数にて判断いたします）</li>
      <li>④上場企業、それに準ずる企業（＝資本⾦1億円以上）、またはそのグループ会社にお勤めの⽅、もしくは医師・公務員・看護師・薬剤師として現在お勤めの⽅<br>
      （※主婦、パートの方は、配偶者様が上記の勤務先条件を満たしている場合に対象となります）<br>
      ※面談参加時に、以下の書類をご提示いただける方<br>
      A.顔写真付き身分証明書（マイナンバーカード・運転免許証等）<br>
      B.年収を確認できる書類（最新支給月の給与明細または最新年度の源泉徴収票または確定申告書等）<br>
      C.現預金通帳等のエビデンス（現金での投資をご検討される場合）</li>
      <li>⑤予約申込後、90⽇以内に個別面談を完了された⽅（本⼈確認必須。Web⾯談の場合、カメラON、お顔が⾒える状態で⾯談をお願いします）</li>
      <li>⑥⾯談(Web以外も含め)に3回以上ご参加いただいた⽅<br>
      ※お客様のご状況や提案状況に応じて、複数回の⾯談を実施する場合がございます</li>
      <li>⑦フォームよりお申込後、メールでお送りした属性アンケートにご回答いただいた内容、もしくは、営業担当がヒアリングした内容が上記の年収、勤続年数などの条件を満たした⽅</li>
      <li>⑧WebカメラやFacetime等、テレビ通話を通じて対面で面談ができる方（お顔を隠さず、Face to Faceで面談できる方）</li>
      <li>⑨当社提携金融機関の融資が受けられる方（ローン審査通過が必須）</li>
      <li>⑩⾯談前の電話及び⾯談中の質問事項にすべてお答えいただけた⽅<br>
      ※ご融資に必要な質問事項、および当社のサービス提供にあたり必要な質問事項を含む</li>
      <li>⑪過去に「J.P.RETURNS」の不動産投資サービスのご面談特典を進呈されていないこと</li>
      <li>⑫賃料や価格等についての合理的な諸条件に合致する投資用物件の購入を具体的に検討している方</li>
    </ul>
    <p>※初めてJPリターンズのサービスをご利用の方（面談・資料請求・セミナー・動画セミナー・イベント等）<br>
    ※主婦・パート・アルバイトの方でも、配偶者等の年収が700万円以上の場合は対象となります。その場合、配偶者等の収入証明書類（源泉徴収票等）のご提示が必須となります</p>

    <h4>以下のようなケースでは、プレゼント対象外となります</h4>
    <ul>
      <li>ご本人以外の面談の場合</li>
      <li>1世帯で2回以上の申込みの場合</li>
      <li>虚偽、重複、悪戯、迷惑行為、不正申込、連絡が取れない方、個別面談を受けられない方</li>
      <li>当社で行なっている他キャンペーンに応募したことがある方</li>
      <li>同業他社にお勤めの方</li>
      <li>無職、学生、フリーター・パート・アルバイト、契約・派遣社員の方（例外があります）</li>
      <li>現在の借り入れ状況や相談内容等によりサービスの提供ができない場合</li>
      <li>自営業の方、既に住宅ローンがある、疾病などの御理由により、ローンが組めない場合（ローンのご提案が難しい場合）</li>
      <li>Web参加されても途中退席される方</li>
      <li>(Web以外も含め)ご面談が複数回になる場合がある事をご了承いただけない場合</li>
      <li>十分な面談時間が取れない場合(1回の面談につき、1～2時間程度)</li>
      <li>⾯談中、明らかに当社コンサルタントと対話する姿勢でない場合</li>
      <li>お申込後、事前に「顔写真付き身分証明書」および「年収を確認できる書類」をデータ送付いただけない方（または、当日、画面にて提示いただけない方）</li>
      <li>お申込後の事前の内容確認およびご融資に必要な質問事項に対して情報を秘匿される等、ご提案へ⾮協⼒的と判断される⽅</li>
      <li>過度に⾯談スケジュールのキャンセルや変更等をされる他、営業担当者からの連絡に対してご連絡が繋がらない等、営業担当者からの情報提供に対し協⼒的でないと判断される場合</li>
      <li>不動産購入に対して決裁権がご自身にない場合またはご相談が必要な場合、決裁権のある方またはご相談者（配偶者等）同席での面談を別途実施できると確認できない方</li>
      <li>当社の提案を全て聴いていただけた上で、不動産購⼊に対して決裁権がご⾃⾝にあり、ご⾃⾝だけで判断できると確認できない⽅</li>
      <li>不動産投資に興味がないなど特典⽬当てと当社が判断した場合</li>
      <li>初回の⾯談から30⽇以上次回の⾯談⽇程がとれない場合</li>
    </ul>

    <h4>ご⾯談についてのご留意事項</h4>
    <p>今現在、不動産投資を検討されていない⽅は、お申し込みをご遠慮ください。<br>
    以下に当てはまる場合に関してはご⾯談をお断り・キャンセルさせていただく可能性がございます。予めご了承の上でお申し込みください。</p>
    <ul>
      <li>①情報収集のみを⽬的とされる等、不動産を活⽤した資産形成やマンション経営を検討されていないと判断される場合</li>
      <li>②当社で取り扱いの無い投資⼿法やサービスをご希望される場合<br>
      ※投資条件（取り扱いエリア・物件種別・平均利回りなど）に当てはまらない場合<br>
      ※ご希望される内容が、当社の商品やサービスにマッチしない場合</li>
      <li>③具体的な話やシミュレーションのご提⽰が不要という⽅</li>
      <li>④現在の不動産市況・ご⾃⾝の所得状況と乖離のある要求をされる⽅</li>
      <li>⑤現在の借り⼊れ状況や相談内容等によりサービスの提供ができない、ローンのご提案が難しい場合</li>
      <li>⑥客観的に「ポイントのみが⽬当て」と判断される⾔動や⾏動をされる⽅</li>
    </ul>

    <h4>当社の取り扱い商品の特徴</h4>
    <ul>
      <li><b>《取り扱いエリア》</b><br>
      ⼊居率や家賃の相場が⾼い【東京・神奈川エリア】の中古区分物件を中⼼に、築年数や駅距離などの条件の良いものをセレクトし、お客様にご提案しています。<br>
      ※⼀部、⼤阪、神戸、京都、福岡エリア物件の取り扱いあり</li>
      <li><b>《物件ラインナップ》</b><br>
      お客様のニーズにお応えするために、低価格⾼利回り物件からファミリータイプ物件まで、様々な物件を取り扱っています。<br>
      ＜価格帯＞1,000万〜5,000万円程度<br>
      ＜平均利回り＞4%前後</li>
    </ul>

    <h4>ご注意</h4>
    <ul>
      <li>現物でのギフトカードの贈呈はございません。</li>
      <li>特典はメールにてお渡しいたします（当社指定の⽅法による）。</li>
      <li>特典付与のタイミングは⾯談から90⽇後頃を想定しております。</li>
      <li>本キャンペーンはJ.P.RETURNS株式会社による提供です。本キャンペーンについてのお問い合わせはAmazon・PayPay・楽天でお受けしておりません。J.P.RETURNS株式会社 キャンペーン事務局（0120-147-104）までお願いいたします。</li>
      <li>Amazon、Amazon.co.jpおよびそれらのロゴはAmazon.com,Inc.またはその関連会社の商標です。</li>
      <li>PayPay ギフトカードで付与の場合、PayPay/PayPay カード公式ストアでも利用可能です。出金・譲渡不可になります。</li>
      <li>楽天ポイントおよびそのロゴは、楽天グループ株式会社の登録商標です。</li>
      <li>キャンペーン参加等により被った一切の損害について、当社は責任を負わないものとします。</li>
      <li>当社は、諸事情等により、予告なく本キャンペーンの内容の全部または一部を変更したり、本キャンペーンの適正な運用を確保するために必要と判断した措置を講じることができたり、本キャンペーンを早期に終了したりすることができるものとします。</li>
      <li>プレゼントの付与対象とならなかった場合、メール等で連絡されることはありません。お断りの理由については一切お答えができませんのでご了承ください。</li>
      <li>お申し込み前に、必ずページ内に記載の「取り扱い商品の特徴」をご確認ください。</li>
      <li>上記条件を全て満たしていなくても、ご成約後、特典を進呈する場合があります。なお、この場合、付与決定までは「付与保留」の取り扱いとさせていただきますので、ご了承ください。<br>
      （例）<br>
      ・現⾦で投資⽤不動産をご購⼊いただけた⽅<br>
      ・頭⾦として現⾦をお⽀払いいただくことにより、投資⽤不動産をご購⼊いただけた⽅<br>
      ・年収700万円未満または勤続2年未満でも、当社提携の⾦融機関から融資を受け、投資⽤不動産をご購⼊いただけた⽅</li>
    </ul>`
};

const katakanaRegex = /^[ァ-ヶー　]+$/;

const initialQuestions = [
  {
    id: 'occupation', item: "職業", question: "ご職業を教えてください。", answer_method: "single-choice",
    options: [
      { label: "会社員 (上場企業)", value: "会社員（上場企業）" },
      { label: "会社員 (その他)", value: "会社員（その他）" },
      { label: "公務員", value: "公務員" },
      { label: "経営者,役員", value: "経営者" },
      { label: "医師,看護師", value: "士業（医師、看護師、弁護士、税護士など）" },
      { label: "士業 (弁護士,税理士等)", value: "士業（医師、看護師、弁護士、税護士など）" },
      {
        label: "自営業", value: "自営業・その他",
        isVisible: (utmParams) => {
          const source = utmParams?.utm_source || '';
          return !UTM_RULES.hideOccupationSelfEmployedKeywords.some(keyword => source.includes(keyword));
        }
      },
      { label: "その他", value: "自営業・その他" }
    ],
    key: "occupation", validation: (v) => !!v, errorMessage: "選択してください。"
  },
  {
    id: 'annual_income', item: "年収", question: "続いて、現在の年収を教えてください。", answer_method: "single-choice",
    options: [
      {
        label: "500万未満", value: "0～399万",
        isVisible: (utmParams) => {
          const source = utmParams?.utm_source || '';
          return !UTM_RULES.hideIncomeUnder500Keywords.some(keyword => source.includes(keyword));
        }
      },
      { label: "500万～", value: "500～599万" },
      { label: "600万～", value: "600～699万" },
      { label: "700万～", value: "700～799万" },
      { label: "800万～", value: "800～899万" },
      { label: "900万～", value: "900～999万" },
      { label: "1000万～", value: "1000～1099万" },
      { label: "1200万～", value: "1200～1299万" },
      { label: "1500万～", value: "1500～1999万" },
      { label: "2000万～", value: "2000～2499万" },
      { label: "3000万～", value: "3000～3999万" },
      { label: "5000万～", value: "5000万～1億未満" }
    ],
    key: "annual_income", validation: (v) => !!v, errorMessage: "選択してください。"
  },
  {
    id: 'age_group', item: "年齢", question: "ご年齢はおいくつでしょうか？", answer_method: "single-choice",
    options: [
      {
        label: "20歳未満", value: "20歳未満",
        isVisible: (utmParams) => {
          const source = utmParams?.utm_source || '';
          return !UTM_RULES.hideAgeKeywords.some(keyword => source.includes(keyword));
        }
      },
      {
        label: "20～24歳", value: "20～24歳",
        isVisible: (utmParams) => {
          const source = utmParams?.utm_source || '';
          return !UTM_RULES.hideAgeKeywords.some(keyword => source.includes(keyword));
        }
      },
      { label: "25～29歳", value: "25～29歳" },
      { label: "30～34歳", value: "30～34歳" },
      { label: "35～39歳", value: "35～39歳" },
      { label: "40～44歳", value: "40～44歳" },
      { label: "45～49歳", value: "45～49歳" },
      { label: "50～54歳", value: "50～54歳" },
      { label: "55～59歳", value: "55～59歳" },
      {
        label: "60歳～", value: "60～64歳",
        isVisible: (utmParams) => {
          const source = utmParams?.utm_source || '';
          return !UTM_RULES.hideAgeKeywords.some(keyword => source.includes(keyword));
        }
      }
    ],
    key: "age_group", validation: (v) => !!v, errorMessage: "選択してください。"
  },
  {
    id: 'name_kanji', item: "お名前（漢字）", pre_message: "ありがとうございます！", answer_method: "text-pair",
    prompt: "お名前を入力してください。",
    inputs: [
      { label: "姓", key: "last_name", placeholder: "山田", type: "text" },
      { label: "名", key: "first_name", placeholder: "太郎", type: "text" }
    ],
    combinedValidation: (v1, v2) => (v1 && v1.trim().length > 0) && (v2 && v2.trim().length > 0),
    combinedErrorMessage: "姓と名の両方を入力してください。",
    key_group: "name_details"
  },
  {
    id: 'name_kana', item: "お名前（フリガナ）", answer_method: "text-pair",
    prompt: "続いて、フリガナを入力してください。（全角カタカナ）",
    inputs: [
      { label: "セイ", key: "last_name_kana", placeholder: "ヤマダ", type: "text" },
      { label: "メイ", key: "first_name_kana", placeholder: "タロウ", type: "text" }
    ],
    combinedValidation: (v1, v2) => (v1 && katakanaRegex.test(v1.trim())) && (v2 && katakanaRegex.test(v2.trim())),
    combinedErrorMessage: "セイとメイの両方を全角カタカナで入力してください。",
    key_group: "name_details"
  },
  { id: 'phone_number', item: "電話番号", pre_message: "ありがとうございます。残り3問です！", question: "電話番号を入力してください。", placeholder: "09012345678", answer_method: "text", type: "tel", key: "phone_number", validation: (v) => /^[0-9]{10,11}$/.test(v.replace(/-/g, "")), errorMessage: "有効な電話番号をハイフンなし半角数字で入力してください。" },
  { id: 'email_address', item: "メールアドレス", question: "次に、メールアドレスを入力してください！", placeholder: "user@example.com", answer_method: "text", type: "email", key: "email_address", validation: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), errorMessage: "有効なメールアドレスを入力してください。" },
  {
    id: 'digital_gift_choice',
    item: "希望デジタルギフト",
    pre_message: "面談完了でえらべるデジタルギフト<span style='color: red;'>最大50,000円分</span>プレゼントの対象となります！", isHtmlPreMessage: true,
    question: "最後に、ご希望のデジタルギフトの種類をお選びください。",
    answer_method: "single-choice",
    options: [
      { label: "Amazonギフトカード", value: "Amazonギフトカード" },
      { label: "PayPayマネーライト", value: "PayPayポイント" },
      { label: "楽天ポイント", value: "楽天ポイント" }
    ],
    key: "digital_gift_choice",
    validation: (v) => !!v,
    errorMessage: "選択してください。"
  },
  {
    id: 'final_consent',
    item: "最終確認",
    pre_message: "ご回答ありがとうございました！",
    question: "入力内容・利用規約をご確認の上、「同意して送信」を押してください。",
    answer_method: "final-consent",
    privacy_policy_link_text: "個人情報のお取り扱い",
    privacy_policy_url: "https://jpreturns.com/privacypolicy/",
    submit_button_text: "同意して送信",
    key: "final_consent_given"
  }
];

const TIME_SLOTS = [
  { label: "10:00~", value: "10：00～12：00" },
  { label: "12:00~", value: "12：00～14：00" },
  { label: "14:00~", value: "14：00～16：00" },
  { label: "16:00~", value: "16：00～18：00" },
  { label: "18:00~", value: "18：00～20：00" },
  { label: "20:00~", value: "20：00 以降" },
  { label: "その他", value: "その他の時間" }
];
const additionalQuestions = [
  {
    id: 'first_choice_date',
    item: "面談希望日時（第一希望）",
    summaryLabel: "日時 第1希望",
    pre_message: "面談を受けていただくと<span style='color: red;'>最大50,000円相当</span>のえらべるデジタルギフト、プレゼントの対象となります！",
    question: "【第1希望】<br>ご相談希望日時をお選びください。",
    isHtmlQuestion: true,
    answer_method: "time-table",
    keys: { date: 'first_choice_date', time: 'first_choice_time' },
    timeSlots: TIME_SLOTS,
    validation: (v) => !!v,
    errorMessage: "ご希望の日時を選択してください。"
  },
  {
    id: 'first_choice_time_other',
    item: "面談希望時間（第一希望その他）",
    summaryLabel: "その他時間",
    question: "【第1希望】<br>ご相談希望時間を入力ください。",
    isHtmlQuestion: true,
    answer_method: "text",
    type: "text",
    key: "first_choice_time_other",
    condition: { key: "first_choice_time", value: "その他の時間" },
    validation: (v) => v && v.trim().length > 0,
    errorMessage: "希望時間を入力してください。"
  },
  {
    id: 'second_choice_date',
    item: "面談希望日時（第二希望）",
    summaryLabel: "日時 第2希望",
    question: "【第2希望】<br>ご相談希望日時をお選びください。",
    isHtmlQuestion: true,
    answer_method: "time-table",
    keys: { date: 'second_choice_date', time: 'second_choice_time' },
    timeSlots: TIME_SLOTS,
    validation: (v) => !!v,
    errorMessage: "ご希望の日時を選択してください。"
  },
  {
    id: 'second_choice_time_other',
    item: "面談希望時間（第二希望その他）",
    summaryLabel: "その他時間",
    question: "【第2希望】<br>ご相談希望時間を入力ください。",
    isHtmlQuestion: true,
    answer_method: "text",
    type: "text",
    key: "second_choice_time_other",
    condition: { key: "second_choice_time", value: "その他の時間" },
    validation: (v) => v && v.trim().length > 0,
    errorMessage: "希望時間を入力してください。"
  },
  {
    id: 'application_reason',
    item: "お申し込みの決め手",
    question: "お申し込みの決め手を教えてください。（複数選択可）",
    answer_method: "multi-choice",
    options: [
      { label: "特別レポートの配布", value: "特別レポートの配布" },
      { label: "デジタルギフトの付与", value: "デジタルギフトの付与" },
      { label: "ランキング1位掲載", value: "ランキング1位掲載" },
      { label: "その他", value: "その他" }
    ],
    key: "application_reason",
    validation: (v) => Array.isArray(v) && v.length > 0,
    errorMessage: "少なくとも1つ選択してください。",

    // ★該当のutm_sourceに含まれていない場合はスキップする
    shouldSkip: (utmParams) => !UTM_RULES.showApplicationReason.includes(utmParams?.utm_source)
  },
  {
    id: 'referral_source',
    item: "弊社を知ったきっかけ",
    question: "これが最後の質問です！<br>弊社を知ったきっかけを教えてください。（複数選択可）",
    isHtmlQuestion: true,
    answer_method: "multi-choice",
    options: [
      { label: "Web検索", value: "ネット検索" },
      { label: "ポイントサイト", value: "ポイントサイト" },
      { label: "SNS広告", value: "SNS広告" },
      { label: "インフルエンサーの投稿", value: "インフルエンサーの投稿" },
      { label: "知人のご紹介", value: "知人紹介" },
      { label: "ホリエモンチャンネル", value: "ホリエモンチャンネル" },
      { label: "その他", value: "その他" }
    ],
    key: "referral_source",
    validation: (v) => Array.isArray(v) && v.length > 0,
    errorMessage: "少なくとも1つ選択してください。"
  }
];