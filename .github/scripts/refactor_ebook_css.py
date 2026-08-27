from pathlib import Path


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 match, found {count}")
    return text.replace(old, new, 1)


viewer_path = Path("zz_ebook/shared/viewer.js")
viewer = viewer_path.read_text(encoding="utf-8")

viewer = replace_once(
    viewer,
    '    <div class="app" id="app">\n      <header class="topbar">',
    '    <header class="topbar">',
    "remove app opening wrapper",
)
viewer = replace_once(
    viewer,
    '      <div class="loading" id="loading">ページを再計算しています…</div>\n    </div>\n\n    <dialog class="image-viewer"',
    '    <div class="loading" id="loading">ページを再計算しています…</div>\n\n    <dialog class="image-viewer"',
    "remove app closing wrapper",
)
viewer = replace_once(
    viewer,
    '        app: document.getElementById("app"),\n',
    '',
    "remove app element reference",
)
viewer = replace_once(
    viewer,
    '        els.app.classList.toggle("overview", mode === "overview");',
    '        document.body.classList.toggle("overview", mode === "overview");',
    "move overview state to body",
)

viewer_path.write_text(viewer, encoding="utf-8")


css_path = Path("zz_ebook/shared/style.css")
css = css_path.read_text(encoding="utf-8")

css = replace_once(
    css,
    '    --topbar-height: 72px;\n    --bottombar-height: 72px;',
    '    --bar-height: 72px;',
    "merge desktop bar height variables",
)
css = replace_once(
    css,
    '        --topbar-height: 60px;\n        --bottombar-height: 60px;',
    '        --bar-height: 60px;',
    "merge mobile bar height variables",
)
css = css.replace('var(--topbar-height)', 'var(--bar-height)')
css = css.replace('var(--bottombar-height)', 'var(--bar-height)')

css = replace_once(
    css,
    '''.app {
    position: fixed;
    inset: 0;
    background: var(--paper);
}

.app.overview {
    background: var(--overview-bg);
}
''',
    '''body.overview {
    background: var(--overview-bg);
}
''',
    "remove app CSS wrapper",
)
css = css.replace('.app.overview .stage', 'body.overview .stage')
css = css.replace('.app.overview .overview-scroller', 'body.overview .overview-scroller')

css = replace_once(
    css,
    '''.overview-strip {
    height: 100%;
    display: flex;
    align-items: center;
    gap: var(--overview-gap);
    transform: translateY(calc((var(--bar-height) - var(--bar-height)) / 2));
}

.overview-strip::before,
.overview-strip::after {
    content: "";
    flex: 0 0 max(0px,
            calc(var(--overview-side-pad) - var(--overview-gap)));
    pointer-events: none;
}
''',
    '''.overview-strip {
    height: 100%;
    display: flex;
    align-items: center;
    gap: var(--overview-gap);
    padding-inline: var(--overview-side-pad);
}
''',
    "simplify overview side spacing",
)

css = replace_once(
    css,
    '''    .topbar__title {
        font-weight: 600;
    }

''',
    '',
    "remove duplicate mobile title weight",
)
css = replace_once(
    css,
    '''    :where(.page-card, .measure-page) {
        padding:
            var(--page-padding-top) var(--page-padding-x) var(--page-padding-bottom);
    }

''',
    '',
    "remove duplicate mobile page padding",
)

css = replace_once(
    css,
    '''.toc-dialog {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    overflow: hidden;
    transition:
''',
    ''':where(.toc-dialog, .image-viewer) {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 0;
    border: 0;
    overflow: hidden;
}

.toc-dialog {
    background: transparent;
    transition:
''',
    "share fullscreen dialog base styles",
)
css = replace_once(
    css,
    '''.image-viewer {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 0;
    border: 0;
    overflow: hidden;
    background: rgba(0, 0, 0, 0.9);
''',
    '''.image-viewer {
    background: rgba(0, 0, 0, 0.9);
''',
    "deduplicate image viewer fullscreen base",
)

css = replace_once(
    css,
    '''.stage .page-card {
    top: 0;
    left: 0;
    opacity: 0;
    transform: translateX(0);
    filter: none;
    border-radius: 0;
    box-shadow: none;
    pointer-events: none;
    will-change: transform;
}
''',
    '''.stage .page-card {
    top: 0;
    left: 0;
    opacity: 0;
    pointer-events: none;
    will-change: transform;
}
''',
    "remove obsolete page-card resets",
)

marker = '@media (min-width: 1024px) {'
if marker not in css:
    raise SystemExit('desktop media query not found')
head, desktop = css.split(marker, 1)
desktop = desktop.replace('.stage:not(.turn-prev) .page-card--current', '.stage .page-card--current')
desktop = desktop.replace('.stage:not(.turn-prev) .page-card--next:not(.is-empty)', '.stage .page-card--next:not(.is-empty)')
desktop = desktop.replace('.stage:not(.turn-prev):has(.page-card--next:not(.is-empty))::after', '.stage:has(.page-card--next:not(.is-empty))::after')
desktop = desktop.replace('.stage:not(.turn-prev) .page-card--current.cover-card', '.stage .page-card--current.cover-card')
desktop = desktop.replace('.stage:not(.turn-prev) .page-card--prev', '.stage .page-card--prev')
css = head + marker + desktop

css_path.write_text(css, encoding="utf-8")
