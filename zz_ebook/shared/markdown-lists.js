(() => {
    "use strict";

    if (typeof window.bookMarkdown !== "string") return;

    const lines = window.bookMarkdown.split("\n");
    const output = [];
    let inList = false;

    const isBlank = (line) => !line.trim();
    const isListLine = (line) =>
        /^\s*[-*+]\s+\S/.test(line) || /^\s*\d+\.\s+\S/.test(line);

    const pushBlankIfNeeded = () => {
        if (output.length && !isBlank(output[output.length - 1])) {
            output.push("");
        }
    };

    lines.forEach((line, index) => {
        const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
        const ordered = line.match(/^\s*(\d+)\.\s+(.+)$/);

        if (unordered || ordered) {
            if (!inList) {
                pushBlankIfNeeded();
                inList = true;
            }

            output.push(
                unordered
                    ? `• ${unordered[1]}`
                    : `${ordered[1]}. ${ordered[2]}`
            );

            const nextLine = lines[index + 1] ?? "";
            if (!isListLine(nextLine)) {
                pushBlankIfNeeded();
                inList = false;
            }
            return;
        }

        output.push(line);
        inList = false;
    });

    window.bookMarkdown = output.join("\n");
})();
