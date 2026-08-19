(() => {
    "use strict";

    if (!window.bookMarkdown) return;

    const source = window.bookMarkdown;

    function getPublicationDate(markdown) {
        const frontmatter = markdown.match(/^published:\s*(.+)$/m);
        if (frontmatter) return frontmatter[1].trim();

        const legacy = markdown.match(/^-\s*発行日\s*[:：]\s*(.+)$/m);
        return legacy ? legacy[1].trim() : "";
    }

    function formatPublicationDate(value) {
        const match = value.match(/^(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日$/);
        if (!match) return value;

        return `${match[1]}年 ${match[2]}月 ${match[3]}日`;
    }

    const publicationDate = formatPublicationDate(
        getPublicationDate(source)
    );

    const commonColophon = [
        "【発行日】",
        publicationDate || "発行日未設定",
        "【発行元】",
        "J.P.RETURNS 編集部",
        "https://wealthknowledge.jpreturns.com/",
        "〒100-6923 東京都千代田区丸の内 2-6-1 丸の内パークビルディング23階",
        "© J.P.Returns. All rights reserved",
        "本作品の全部あるいは一部を無断で複製・転載・配信・送信したり、ホームページやSNS上に転載することを禁止します。本作品の内容を無断で改変、改ざん等を行うことも禁止します。",
        "また、有償・無償にかかわらず本作品を第三者に譲渡することはできません。",
        "【注意】",
        "本書は情報の提供および学習を目的としたものであり、発行元であるウェルスナレッジ編集部独自の調査・見解に基づいて執筆しています。投資の運用における成功においてを保証するものではありません。",
        "本書の内容に基づいた運用や判断等については必ずご自身の責任と判断によって行ってください。",
        "本書の内容に基づいて行った結果については、発刊元および J.P.RETURNS 株式会社はいかなる責任も負いかねます。",
        "なお、本書に記載されているケース等については、いずれも執筆当時の事例を参考にしたものであり今後変更される可能性があります。"
    ];

    // Remove any legacy per-book colophon and append the shared version.
    const body = source
        .replace(/\n#\s*奥付\s*\n[\s\S]*$/m, "")
        .trimEnd();

    const colophonMarkdown = commonColophon
        .map((line) => `> ${line}`)
        .join("\n");

    window.bookMarkdown = `${body}\n\n# 奥付\n${colophonMarkdown}\n`;

    /*
      viewer.js uses an internal "奥付" marker to detect the final section.
      Keep that marker internally, but hide the generated heading and metadata
      so the user only sees the shared colophon content.
    */
    const style = document.createElement("style");
    style.textContent = `
        .colophon > h1,
        .colophon > dl {
            display: none;
        }

        .colophon__note {
            margin: 0.55em 0 0 !important;
            color: var(--text);
            font-size: 0.72em;
            line-height: 1.8;
            text-indent: 0 !important;
        }
    `;
    document.head.appendChild(style);

    // The overview header previously displayed the internal "奥付" marker.
    const hideInternalColophonLabel = () => {
        const title = document.getElementById("topbarTitle");
        if (title?.textContent.trim() === "奥付") {
            title.textContent = "";
        }
    };

    const observer = new MutationObserver(hideInternalColophonLabel);
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });

    hideInternalColophonLabel();
})();