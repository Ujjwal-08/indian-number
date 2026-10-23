/**
 * Exact decimal handling on strings.
 *
 * Everything in this package goes through `toParts()` so that rounding and
 * grouping never depend on IEEE-754 artefacts, `Number.prototype.toFixed`
 * or the host machine's locale.
 */

const NUMERIC = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;
const EXPONENTIAL = /^([+-]?)(\d+)(?:\.(\d+))?[eE]([+-]?\d+)$/;

/** Rewrite `1.23e-7` as `0.000000123`. Returns `s` unchanged when it has no exponent. */
export function expandExponential(s) {
    const m = EXPONENTIAL.exec(s);
    if (!m) return s;
    const [, sign, intPart, fracPart = "", expStr] = m;
    const digits = intPart + fracPart;
    const point = intPart.length + Number(expStr);
    let out;
    if (point <= 0) out = "0." + "0".repeat(-point) + digits;
    else if (point >= digits.length) out = digits + "0".repeat(point - digits.length);
    else out = digits.slice(0, point) + "." + digits.slice(point);
    return sign + out;
}

function typeError(value) {
    const shown =
        typeof value === "string" ? JSON.stringify(value)
        : typeof value === "object" && value !== null ? Object.prototype.toString.call(value)
        : String(value);
    return new TypeError(
        `indian-number: expected a finite number, numeric string or bigint, received ${shown}`,
    );
}

/**
 * Normalise any accepted input into exact decimal parts.
 *
 * @param {number|string|bigint} value
 * @returns {{ negative: boolean, int: string, frac: string }}
 */
export function toParts(value) {
    let text;
    if (typeof value === "bigint") {
        text = value.toString();
    } else if (typeof value === "number") {
        if (!Number.isFinite(value)) throw typeError(value);
        text = expandExponential(String(value));
    } else if (typeof value === "string") {
        // Tolerate the output of format(): grouping commas and padding spaces.
        const cleaned = expandExponential(value.trim().replace(/[\s,_]/g, ""));
        if (!NUMERIC.test(cleaned)) throw typeError(value);
        text = cleaned;
    } else {
        throw typeError(value);
    }

    let negative = text[0] === "-";
    if (text[0] === "-" || text[0] === "+") text = text.slice(1);

    const dot = text.indexOf(".");
    let int = dot === -1 ? text : text.slice(0, dot);
    let frac = dot === -1 ? "" : text.slice(dot + 1);

    int = stripLeadingZeros(int);
    if (negative && isZero(int, frac)) negative = false;
    return { negative, int, frac };
}

export function stripLeadingZeros(digits) {
    const trimmed = digits.replace(/^0+/, "");
    return trimmed === "" ? "0" : trimmed;
}

export function stripTrailingZeros(frac) {
    return frac.replace(/0+$/, "");
}

export function isZero(int, frac) {
    return !/[1-9]/.test(int) && !/[1-9]/.test(frac);
}

/** Add one to a non-negative digit string, growing it when it overflows. */
export function incrementDigits(digits) {
    const out = digits.split("");
    let i = out.length - 1;
    while (i >= 0) {
        if (out[i] === "9") {
            out[i] = "0";
            i -= 1;
        } else {
            out[i] = String(Number(out[i]) + 1);
            return out.join("");
        }
    }
    return "1" + out.join("");
}

/**
 * Round decimal parts to `decimals` places, half away from zero.
 * Always returns exactly `decimals` fractional digits, and never a signed zero.
 */
export function roundParts(parts, decimals) {
    let { negative, int, frac } = parts;

    if (frac.length <= decimals) {
        frac = frac.padEnd(decimals, "0");
    } else {
        let digits = int + frac.slice(0, decimals);
        const next = frac.charCodeAt(decimals) - 48;
        if (next >= 5) digits = incrementDigits(digits);
        int = stripLeadingZeros(decimals === 0 ? digits : digits.slice(0, digits.length - decimals));
        frac = decimals === 0 ? "" : digits.slice(digits.length - decimals);
    }

    if (negative && isZero(int, frac)) negative = false;
    return { negative, int, frac };
}

/** Move the decimal point `places` digits to the left (i.e. divide by 10**places). */
export function shiftLeft(parts, places) {
    if (places === 0) return { ...parts };
    let int = parts.int;
    if (int.length <= places) int = int.padStart(places + 1, "0");
    return {
        negative: parts.negative,
        int: stripLeadingZeros(int.slice(0, int.length - places)),
        frac: int.slice(int.length - places) + parts.frac,
    };
}

/** Move the decimal point `places` digits to the right (i.e. multiply by 10**places). */
export function shiftRight(parts, places) {
    if (places === 0) return { ...parts };
    const moved = parts.frac.slice(0, places).padEnd(places, "0");
    return {
        negative: parts.negative,
        int: stripLeadingZeros(parts.int + moved),
        frac: parts.frac.slice(places),
    };
}

/**
 * Indian digit grouping: the last three digits, then groups of two.
 * `"12345678"` becomes `"1,23,45,678"`.
 */
export function groupIndian(intDigits) {
    if (intDigits.length <= 3) return intDigits;
    const last3 = intDigits.slice(-3);
    let rest = intDigits.slice(0, -3);
    const groups = [];
    while (rest.length > 2) {
        groups.unshift(rest.slice(-2));
        rest = rest.slice(0, -2);
    }
    if (rest.length > 0) groups.unshift(rest);
    return groups.join(",") + "," + last3;
}

/** Render parts back to a plain (ungrouped) decimal string. */
export function partsToString(parts) {
    return (parts.negative ? "-" : "") + parts.int + (parts.frac ? "." + parts.frac : "");
}
