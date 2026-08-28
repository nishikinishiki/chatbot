from pathlib import Path

path = Path("zz_ebook/shared/style.css")
css = path.read_text(encoding="utf-8")


def replace_once(old, new, label):
    global css
    count = css.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected 1 match, found {count}")
    css = css.replace(old, new, 1)


replace_once(
'''    --bar-height: clamp(60px, calc(52px + 2vw), 72px);\n    --reader-page-width: 100vw;\n''',
'''    --bar-height: clamp(60px, calc(52px + 2vw), 72px);\n    --topbar-height: calc(var(--bar-height) + env(safe-area-inset-top, 0px));\n    --bottombar-height: calc(var(--bar-height) + env(safe-area-inset-bottom, 0px));\n    --reader-page-width: 100vw;\n''',
"add outer bar dimensions"
)

replace_once(
'''    --reader-viewport-height:\n        calc(\n            100dvh -\n            var(--bar-height) -\n            var(--bar-height) -\n            env(safe-area-inset-bottom, 0px)\n        );\n''',
'''    --reader-viewport-height:\n        calc(100dvh - var(--topbar-height) - var(--bottombar-height));\n''',
"simplify reader viewport height"
)

replace_once(
'''    height: var(--bar-height);\n    display: grid;\n''',
'''    height: var(--topbar-height);\n    display: grid;\n''',
"use topbar height"
)

replace_once(
'''    height: calc(var(--bar-height) + env(safe-area-inset-bottom, 0px));\n    display: grid;\n''',
'''    height: var(--bottombar-height);\n    display: grid;\n''',
"use bottombar height"
)

replace_once(
'''    inset:\n        var(--bar-height) 0\n        calc(var(--bar-height) + env(safe-area-inset-bottom, 0px));\n''',
'''    inset: var(--topbar-height) 0 var(--bottombar-height);\n''',
"align reader shell with chrome"
)

replace_once(
'''    padding:\n        calc(env(safe-area-inset-top, 0px) + var(--page-padding-y)) var(--page-padding-x) calc(env(safe-area-inset-bottom, 0px) + var(--page-padding-y)) var(--page-padding-x);\n''',
'''    padding: var(--page-padding-y) var(--page-padding-x);\n''',
"remove safe area from pages"
)

replace_once(
''':where(.page-body, .measure-body) {\n    flex: 1;\n    min-height: 0;\n    overflow: hidden;\n    text-align: justify;\n}\n''',
''':where(.page-body, .measure-body) {\n    flex: 1;\n    min-height: 0;\n    overflow: hidden;\n    text-align: justify;\n}\n\n:where(.page-body, .measure-body) > :first-child {\n    margin-top: 0;\n}\n''',
"remove first element top margin"
)

replace_once(
'''    top: calc(env(safe-area-inset-top, 0px) + 60px);\n''',
'''    top: var(--topbar-height);\n''',
"align popover with topbar"
)

path.write_text(css, encoding="utf-8")
