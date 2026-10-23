import {
    groupIndian,
    roundParts,
    shiftLeft,
    stripTrailingZeros,
    toParts,
} from "./decimal.js";
import { ABBREVIATION_UNITS, assertLocale } from "./constants.js";

/**
 * Format a number with Indian digit grouping (last three digits, then twos).
 *
 * @param {number|string|bigint} value
 * @param {{ decimals?: number }} [options]
 * @returns {string}
 */
export function format(value, options = {}) {
    const { decimals } = options;
    let parts = toParts(value);

    if (decimals === undefined || decimals === null) {
        parts = { ...parts, frac: stripTrailingZeros(parts.frac) };
    } else {
        parts = roundParts(parts, assertDecimals(decimals));
    }

    return (parts.negative ? "-" : "") + groupIndian(parts.int) + (parts.frac ? "." + parts.frac : "");
}

/**
 * Format a number as an Indian currency amount.
 *
 * @param {number|string|bigint} value
 * @param {{ decimals?: number, symbol?: string, spaceAfterSymbol?: boolean }} [options]
 * @returns {string}
 */
export function formatCurrency(value, options = {}) {
    const { decimals = 2, symbol = "₹", spaceAfterSymbol = false } = options;
    if (typeof symbol !== "string") {
        throw new TypeError(`indian-number: symbol must be a string, received ${String(symbol)}`);
    }

    const body = format(value, { decimals });
    const negative = body.startsWith("-");
    const digits = negative ? body.slice(1) : body;
    const gap = spaceAfterSymbol && !/\s$/.test(symbol) ? " " : "";

    return (negative ? "-" : "") + symbol + gap + digits;
}

/**
 * Shorten a number using Indian scale units (thousand, lakh, crore, arab, kharab).
 *
 * @param {number|string|bigint} value
 * @param {{ decimals?: number, short?: boolean, locale?: "en"|"hi" }} [options]
 * @returns {string}
 */
export function abbreviate(value, options = {}) {
    const { decimals = 2, short = false, locale = "en" } = options;
    assertLocale(locale);
    const places = assertDecimals(decimals);
    const parts = toParts(value);

    let index = unitIndexFor(parts.int);
    let scaled = roundParts(shiftLeft(parts, ABBREVIATION_UNITS[index].places), places);

    // Rounding can push a value into the next unit (99,999 -> "1 lakh", not "100 thousand").
    if (overflowsUnit(scaled.int, index) && index < ABBREVIATION_UNITS.length - 1) {
        index += 1;
        scaled = roundParts(shiftLeft(parts, ABBREVIATION_UNITS[index].places), places);
    }

    const frac = stripTrailingZeros(scaled.frac);
    const number =
        (scaled.negative ? "-" : "") + groupIndian(scaled.int) + (frac ? "." + frac : "");

    const unit = unitLabel(ABBREVIATION_UNITS[index], short, locale);
    return unit ? number + " " + unit : number;
}

function unitLabel(unit, short, locale) {
    if (locale === "hi") return unit.hi;
    return short ? unit.short : unit.en;
}

function unitIndexFor(intDigits) {
    const digits = intDigits === "0" ? 0 : intDigits.length;
    let index = 0;
    for (let i = 0; i < ABBREVIATION_UNITS.length; i += 1) {
        if (digits >= ABBREVIATION_UNITS[i].digits) index = i;
    }
    return index;
}

function overflowsUnit(intDigits, index) {
    // Unit 0 holds up to 999; every later unit holds up to 99 before the next one starts.
    return index === 0 ? intDigits.length > 3 : intDigits.length > 2;
}

export function assertDecimals(decimals) {
    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 100) {
        throw new TypeError(
            `indian-number: decimals must be an integer between 0 and 100, received ${String(decimals)}`,
        );
    }
    return decimals;
}
