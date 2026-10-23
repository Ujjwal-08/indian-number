/** Minimal ANSI colouring that turns itself off when colour is unwanted. */

export function colorEnabled(env = process.env, stream = process.stdout) {
    if (env.NO_COLOR !== undefined && env.NO_COLOR !== "") return false;
    if (env.FORCE_COLOR !== undefined && env.FORCE_COLOR !== "") return true;
    return Boolean(stream && stream.isTTY);
}

const CODES = {
    reset: "\u001B[0m",
    bold: "\u001B[1m",
    dim: "\u001B[2m",
    cyan: "\u001B[36m",
    yellow: "\u001B[33m",
    green: "\u001B[32m",
};

/** Returns `{ bold, dim, cyan, yellow, green }`, each a `string => string`. */
export function createColors(enabled = colorEnabled()) {
    const wrap = (code) => (text) => (enabled ? code + text + CODES.reset : String(text));
    return {
        bold: wrap(CODES.bold),
        dim: wrap(CODES.dim),
        cyan: wrap(CODES.cyan),
        yellow: wrap(CODES.yellow),
        green: wrap(CODES.green),
    };
}
