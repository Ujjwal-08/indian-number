import { DEVANAGARI_DIGITS, LATIN_DIGITS } from "./constants.js";

function asText(value) {
    if (typeof value === "string") return value;
    if (typeof value === "bigint") return value.toString();
    if (typeof value === "number") {
        if (!Number.isFinite(value)) {
            throw new TypeError(`indian-number: expected a finite number, received ${String(value)}`);
        }
        return String(value);
    }
    throw new TypeError(
        `indian-number: expected a string, finite number or bigint, received ${String(value)}`,
    );
}

/** `2024` -> `"२०२४"`. Non-digit characters (commas, ₹, spaces) are left alone. */
export function toDevanagariDigits(value) {
    return asText(value).replace(/[0-9]/g, (d) => DEVANAGARI_DIGITS[LATIN_DIGITS.indexOf(d)]);
}

/** `"२०२४"` -> `"2024"`. Non-digit characters are left alone. */
export function fromDevanagariDigits(value) {
    return asText(value).replace(/[०-९]/g, (d) => LATIN_DIGITS[DEVANAGARI_DIGITS.indexOf(d)]);
}

export function hasDevanagariDigits(text) {
    return /[०-९]/.test(text);
}
