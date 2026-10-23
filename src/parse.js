import { partsToString, shiftRight, toParts } from "./decimal.js";
import { fromDevanagariDigits } from "./digits.js";
import { PARSE_SUFFIXES } from "./constants.js";

const CURRENCY_PREFIX = /^(?:₹|rs\.?|inr|rupees?|रुपये|रू\.?)/i;
const AMOUNT = /^([+-]?)((?:\d+(?:\.\d*)?|\.\d+))(.*)$/;

/**
 * The inverse of `format()`, plus the shorthands people actually type.
 *
 * Accepts grouping commas, spaces, Devanagari digits, a ₹ / Rs. / INR prefix,
 * a trailing `/-`, and k / L / lakh / Cr / crore / arab / kharab suffixes in
 * either script. Returns `NaN` for anything it cannot read.
 *
 * @param {unknown} input
 * @returns {number}
 */
export function parse(input) {
    if (typeof input === "number") return Number.isFinite(input) ? input : NaN;
    if (typeof input === "bigint") return Number(input);
    if (typeof input !== "string") return NaN;

    let text = fromDevanagariDigits(input).trim().toLowerCase();

    // The sign can sit on either side of the symbol: "-₹500" and "₹-500".
    let sign = "";
    const leadingSign = /^([+-])\s*/.exec(text);
    if (leadingSign) {
        sign = leadingSign[1];
        text = text.slice(leadingSign[0].length);
    }

    text = sign + text.replace(CURRENCY_PREFIX, "").trim();
    text = text.replace(/\/-$/, "").trim();
    text = text.replace(/[\s,_]/g, "");
    if (text === "") return NaN;

    const match = AMOUNT.exec(text);
    if (!match) return NaN;

    const [, matchedSign, digits, tail] = match;
    if (digits === "." || digits === "") return NaN;

    let places = 0;
    if (tail !== "") {
        if (!Object.prototype.hasOwnProperty.call(PARSE_SUFFIXES, tail)) return NaN;
        places = PARSE_SUFFIXES[tail];
    }

    const parts = shiftRight(toParts(matchedSign + digits), places);
    return Number(partsToString(parts));
}
