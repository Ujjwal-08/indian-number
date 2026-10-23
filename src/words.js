import { roundParts, stripTrailingZeros, toParts } from "./decimal.js";
import {
    CURRENCY_WORDS,
    EN_ONES,
    EN_TENS,
    HI_BELOW_HUNDRED,
    SCALE_WORDS,
    assertLocale,
} from "./constants.js";

const HUNDRED = 100n;
const THOUSAND = 1000n;
const LAKH = 100000n;
const CRORE = 10000000n;
const ARAB = 1000000000n;
const KHARAB = 100000000000n;

/** English words for 0-99. */
export function englishBelowHundred(n) {
    if (n < 20) return EN_ONES[n];
    const tens = EN_TENS[Math.floor(n / 10)];
    const ones = n % 10;
    return ones === 0 ? tens : tens + " " + EN_ONES[ones];
}

/** Hindi words for 0-99, straight from the irregular table. */
export function hindiBelowHundred(n) {
    return HI_BELOW_HUNDRED[n];
}

function englishBelowCrore(n) {
    const out = [];
    const lakh = Number((n / LAKH) % 100n);
    const thousand = Number((n / THOUSAND) % 100n);
    const hundred = Number((n / HUNDRED) % 10n);
    const rest = Number(n % 100n);

    if (lakh) out.push(englishBelowHundred(lakh), "lakh");
    if (thousand) out.push(englishBelowHundred(thousand), "thousand");
    if (hundred) out.push(EN_ONES[hundred], "hundred");
    if (rest) out.push(englishBelowHundred(rest));
    return out.join(" ");
}

/**
 * English words. Above a crore the count of crores is itself written in the
 * Indian system, so 1e12 reads "one lakh crore" rather than "one trillion".
 */
export function englishWords(n) {
    if (n === 0n) return "zero";
    if (n >= CRORE) {
        const crores = n / CRORE;
        const rest = n % CRORE;
        const head = englishWords(crores) + " crore";
        return rest === 0n ? head : head + " " + englishBelowCrore(rest);
    }
    return englishBelowCrore(n);
}

function hindiBelowKharab(n) {
    const out = [];
    const arab = Number((n / ARAB) % 100n);
    const crore = Number((n / CRORE) % 100n);
    const lakh = Number((n / LAKH) % 100n);
    const thousand = Number((n / THOUSAND) % 100n);
    const hundred = Number((n / HUNDRED) % 10n);
    const rest = Number(n % 100n);

    if (arab) out.push(HI_BELOW_HUNDRED[arab], SCALE_WORDS.hi.arab);
    if (crore) out.push(HI_BELOW_HUNDRED[crore], SCALE_WORDS.hi.crore);
    if (lakh) out.push(HI_BELOW_HUNDRED[lakh], SCALE_WORDS.hi.lakh);
    if (thousand) out.push(HI_BELOW_HUNDRED[thousand], SCALE_WORDS.hi.thousand);
    if (hundred) out.push(HI_BELOW_HUNDRED[hundred], SCALE_WORDS.hi.hundred);
    if (rest) out.push(HI_BELOW_HUNDRED[rest]);
    return out.join(" ");
}

/** Hindi words, using हज़ार / लाख / करोड़ / अरब / खरब. */
export function hindiWords(n) {
    if (n === 0n) return HI_BELOW_HUNDRED[0];
    if (n >= KHARAB) {
        const kharab = n / KHARAB;
        const rest = n % KHARAB;
        const head = hindiWords(kharab) + " " + SCALE_WORDS.hi.kharab;
        return rest === 0n ? head : head + " " + hindiBelowKharab(rest);
    }
    return hindiBelowKharab(n);
}

function integerWords(n, locale) {
    return locale === "hi" ? hindiWords(n) : englishWords(n);
}

function digitWord(digit, locale) {
    return locale === "hi" ? HI_BELOW_HUNDRED[digit] : EN_ONES[digit];
}

/**
 * Spell a number out in words.
 *
 * @param {number|string|bigint} value
 * @param {{ locale?: "en"|"hi" }} [options]
 * @returns {string}
 */
export function toWords(value, options = {}) {
    const { locale = "en" } = options;
    assertLocale(locale);

    const parts = toParts(value);
    const scale = SCALE_WORDS[locale];
    const words = [];

    if (parts.negative) words.push(scale.minus);
    words.push(integerWords(BigInt(parts.int), locale));

    const frac = stripTrailingZeros(parts.frac);
    if (frac) {
        words.push(scale.point);
        for (const digit of frac) words.push(digitWord(Number(digit), locale));
    }

    return words.join(" ");
}

function titleCase(text) {
    return text.replace(/\S+/g, (word) => word[0].toUpperCase() + word.slice(1));
}

/**
 * Cheque / invoice wording for a rupee amount, rounded to the nearest paisa.
 *
 * @param {number|string|bigint} value
 * @param {{ locale?: "en"|"hi" }} [options]
 * @returns {string}
 */
export function toRupeeWords(value, options = {}) {
    const { locale = "en" } = options;
    assertLocale(locale);

    const amount = roundParts(toParts(value), 2);
    const labels = CURRENCY_WORDS[locale];
    const rupees = BigInt(amount.int);
    const paise = Number(amount.frac || "0");

    const cased = (text) => (locale === "hi" ? text : titleCase(text));
    const out = [];

    if (amount.negative) out.push(labels.minus);
    out.push(labels.major, cased(integerWords(rupees, locale)));

    if (paise > 0) {
        out.push(
            labels.and,
            cased(integerWords(BigInt(paise), locale)),
            paise === 1 ? labels.minorOne : labels.minorMany,
        );
    }

    out.push(labels.suffix);
    return out.join(" ");
}
