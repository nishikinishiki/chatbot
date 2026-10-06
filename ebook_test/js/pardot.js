(() => {
    'use strict';
    function buildPayload(data, isAdditional) {
        const config = window.PARDOT_TEST_CONFIG;
        const mapping = isAdditional ? config.additionalFields : config.initialFields;
        const payload = {};
        for (const [key, externalName] of Object.entries(mapping)) {
            // 未回答項目は送らない。既存値を空文字で上書きしない。
            if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
                payload[externalName] = String(data[key]);
            }
        }
        if (!data.email_address || !payload[mapping.email_address]) {
            throw new Error('メールアドレスの設定・回答が必要です。');
        }
        return payload;
    }
    async function submit(data, isAdditional) {
        const config = window.PARDOT_TEST_CONFIG;
        const payload = buildPayload(data, isAdditional);
        if (config.dryRun) {
            const details = document.createElement('details');
            const summary = document.createElement('summary');
            summary.textContent = (isAdditional ? '第2' : '第1') + 'ステップの送信予定内容';
            const pre = document.createElement('pre');
            pre.style.whiteSpace = 'pre-wrap';
            pre.textContent = JSON.stringify(payload, null, 2);
            details.append(summary, pre);
            document.getElementById('chatMessages').appendChild(details);
            return { dryRun: true };
        }
        const endpoint = new URL(isAdditional ? config.additionalEndpoint : config.initialEndpoint);
        if (endpoint.protocol !== 'https:') throw new Error('HTTPSのForm Handler URLを設定してください。');
        if (location.protocol !== 'https:') throw new Error('実送信はHTTPSで公開したテストページで実施してください。');
        const token = crypto.randomUUID();
        const frame = document.createElement('iframe');
        frame.name = 'pardot-test-' + token;
        frame.hidden = true;
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = endpoint.href;
        form.target = frame.name;
        form.hidden = true;
        for (const status of ['success', 'error']) {
            const callback = new URL('/ebook_test/callback.html', location.origin);
            callback.searchParams.set('token', token);
            callback.searchParams.set('status', status);
            payload[status + '_location'] = callback.href;
        }
        for (const [name, value] of Object.entries(payload)) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            input.value = value;
            form.appendChild(input);
        }
        document.body.append(frame, form);
        return new Promise((resolve, reject) => {
            let timer;
            function finish(error) {
                clearTimeout(timer);
                window.removeEventListener('message', onMessage);
                frame.remove();
                form.remove();
                error ? reject(error) : resolve({ dryRun: false });
            }
            function onMessage(event) {
                if (event.origin !== location.origin || event.source !== frame.contentWindow ||
                    event.data?.type !== 'pardot-test-result' || event.data.token !== token) return;
                if (event.data.status === 'success') finish();
                else if (event.data.status === 'error') finish(new Error('Pardotが送信を受け付けませんでした。必須項目・外部項目名を確認してください。'));
            }
            window.addEventListener('message', onMessage);
            timer = setTimeout(() => finish(new Error('送信結果を確認できませんでした。Pardot側の履歴を確認してから再試行してください。')), config.timeoutMs);
            try { HTMLFormElement.prototype.submit.call(form); }
            catch (error) { finish(error); }
        });
    }
    window.PardotTest = { submit, buildPayload };
})();
