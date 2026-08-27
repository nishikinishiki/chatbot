from pathlib import Path

path = Path("zz_ebook/shared/style.css")
css = path.read_text(encoding="utf-8")

old = '''/* Switch to a two-page spread only when the viewport is wide enough. */
@media (min-width: 1024px) {
    :root {
        --reader-page-width: 50vw;
        --reader-content-max-width: 720px;
        --reader-gutter-padding: 64px;
        --reader-outer-padding:
            max(
                var(--reader-gutter-padding),
                calc(
                    var(--reader-page-width) -
                    var(--reader-content-max-width) -
                    var(--reader-gutter-padding)
                )
            );
    }

    .measure-page,
    .stage .page-card--current:not(.cover-card):not(.full-image-card) {
        padding-left: var(--reader-outer-padding);
        padding-right: var(--reader-gutter-padding);
    }

    .stage .page-card--next:not(.full-image-card) {
        padding-left: var(--reader-gutter-padding);
        padding-right: var(--reader-outer-padding);
    }

    .stage .page-card--current {
        left: 0;
        z-index: 2;
        transform: translateX(0);
        filter: none;
    }

    .stage .page-card--next:not(.is-empty) {
        left: 50vw;
        z-index: 2;
    }

    .stage:has(.page-card--next:not(.is-empty))::after {
        content: "";
        position: absolute;
        top: 0;
        bottom: 0;
        left: 50%;
        z-index: 3;
        width: 30px;
        transform: translateX(-50%);
        background: linear-gradient(to right,
                transparent,
                rgba(0, 0, 0, 0.03) 45%,
                rgba(0, 0, 0, 0.1) 50%,
                rgba(0, 0, 0, 0.03) 55%,
                transparent);
        pointer-events: none;
    }

    .stage .page-card--current.cover-card {
        left: 25vw;
    }

    .stage .page-card--prev {
        display: none;
    }

    .stage .page-card--next .book-image-block img {
        pointer-events: auto;
        cursor: zoom-in;
    }
}
'''

new = '''/* Switch to a two-page spread only when the viewport is wide enough. */
@media (min-width: 1024px) {
    :root {
        --reader-page-width: 50vw;
    }

    .measure-page,
    .stage .page-card:not(.cover-card):not(.full-image-card) {
        padding-inline: 64px;
    }

    .measure-body,
    .stage .page-card:not(.cover-card):not(.full-image-card) .page-body {
        width: 100%;
        max-width: 720px;
    }

    .measure-page,
    .stage .page-card--current:not(.cover-card):not(.full-image-card) {
        align-items: flex-end;
    }

    .stage .page-card--next:not(.cover-card):not(.full-image-card) {
        align-items: flex-start;
    }

    .stage .page-card--current {
        left: 0;
        z-index: 2;
        transform: translateX(0);
        filter: none;
    }

    .stage .page-card--next:not(.is-empty) {
        left: 50vw;
        z-index: 2;
    }

    .stage:has(.page-card--next:not(.is-empty))::after {
        content: "";
        position: absolute;
        top: 0;
        bottom: 0;
        left: 50%;
        z-index: 3;
        width: 30px;
        transform: translateX(-50%);
        background: linear-gradient(to right,
                transparent,
                rgba(0, 0, 0, 0.03) 45%,
                rgba(0, 0, 0, 0.1) 50%,
                rgba(0, 0, 0, 0.03) 55%,
                transparent);
        pointer-events: none;
    }

    .stage .page-card--current.cover-card {
        left: 25vw;
    }

    .stage .page-card--next .book-image-block img {
        pointer-events: auto;
        cursor: zoom-in;
    }
}
'''

count = css.count(old)
if count != 1:
    raise SystemExit(f"expected spread block once, found {count}")

path.write_text(css.replace(old, new, 1), encoding="utf-8")
