// 接続準備後、dryRunをfalseに変更。テスト専用Form Handlerを使用してください。
window.PARDOT_TEST_CONFIG = {
    dryRun: true,
    initialEndpoint: '',
    additionalEndpoint: '',
    timeoutMs: 30000,
    // 左: chatbotの項目名、右: Form Handlerの「外部項目名」。
    // 不要な項目は削除。Pardot側にも同じ外部項目名を登録してください。
    initialFields: {
        email_address: 'email_address', last_name: 'last_name', first_name: 'first_name',
        last_name_kana: 'last_name_kana', first_name_kana: 'first_name_kana',
        phone_number: 'phone_number', occupation: 'occupation',
        annual_income: 'annual_income', age_group: 'age_group',
        digital_gift_choice: 'digital_gift_choice', final_consent_given: 'final_consent_given',
        utm_source: 'utm_source', utm_medium: 'utm_medium', utm_campaign: 'utm_campaign',
        utm_term: 'utm_term', utm_content: 'utm_content',
        submission_id: 'submission_id', form_variant: 'form_variant',
        meeting_date_answered: 'meeting_date_answered'
    },
    additionalFields: {
        email_address: 'email_address',
        first_choice_date: 'first_choice_date', first_choice_time: 'first_choice_time',
        first_choice_time_other: 'first_choice_time_other',
        second_choice_date: 'second_choice_date', second_choice_time: 'second_choice_time',
        second_choice_time_other: 'second_choice_time_other',
        application_reason: 'application_reason', referral_source: 'referral_source',
        submission_id: 'submission_id', form_variant: 'form_variant',
        meeting_date_answered: 'meeting_date_answered'
    }
};
