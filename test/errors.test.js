import assert from "node:assert/strict";
import test from "node:test";

import { abbreviate, format, formatCurrency, toRupeeWords, toWords } from "../index.js";

const FORMATTERS = { format, formatCurrency, abbreviate, toWords, toRupeeWords };
const BAD_INPUTS = [
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    null,
    undefined,
    {},
    [],
    () => 1,
    true,
    Symbol("x"),
    "",
    "abc",
    "12 lakh",
    "1.2.3",
];

test("every formatter rejects non-finite and non-numeric input with a TypeError", () => {
    for (const [name, fn] of Object.entries(FORMATTERS)) {
        for (const value of BAD_INPUTS) {
            assert.throws(
                () => fn(value),
                (error) => error instanceof TypeError && /indian-number/.test(error.message),
                `${name}(${String(value)}) should throw a TypeError`,
            );
        }
    }
});

test("error messages name the package and the offending value", () => {
    assert.throws(() => format(Number.NaN), /indian-number: expected a finite number.*NaN/);
    assert.throws(() => format("abc"), /indian-number: expected a finite number.*"abc"/);
});

test("unsupported locales are rejected", () => {
    assert.throws(() => toWords(1, { locale: "ta" }), /unsupported locale/);
    assert.throws(() => toRupeeWords(1, { locale: "en-IN" }), /unsupported locale/);
    assert.throws(() => abbreviate(1, { locale: null }), /unsupported locale/);
});

test("bad option values are rejected", () => {
    assert.throws(() => format(1, { decimals: -1 }), /decimals/);
    assert.throws(() => format(1, { decimals: 1.5 }), /decimals/);
    assert.throws(() => format(1, { decimals: "2" }), /decimals/);
    assert.throws(() => abbreviate(1, { decimals: -2 }), /decimals/);
    assert.throws(() => formatCurrency(1, { symbol: 5 }), /symbol/);
});

test("zero and tiny values are accepted everywhere", () => {
    assert.equal(format(0), "0");
    assert.equal(formatCurrency(0), "₹0.00");
    assert.equal(abbreviate(0), "0");
    assert.equal(toWords(0), "zero");
    assert.equal(toRupeeWords(0), "Rupees Zero Only");
    assert.equal(format(Number.MIN_VALUE, { decimals: 2 }), "0.00");
});
