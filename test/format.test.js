import assert from "node:assert/strict";
import test from "node:test";

import { abbreviate, format, formatCurrency } from "../index.js";
import { groupIndian } from "../src/decimal.js";

test("Indian grouping table", () => {
    const cases = [
        [0, "0"],
        [1, "1"],
        [99, "99"],
        [999, "999"],
        [1000, "1,000"],
        [9999, "9,999"],
        [10000, "10,000"],
        [99999, "99,999"],
        [100000, "1,00,000"],
        [999999, "9,99,999"],
        [1000000, "10,00,000"],
        [10000000, "1,00,00,000"],
        [12345678, "1,23,45,678"],
        [123456789, "12,34,56,789"],
        [1000000000, "1,00,00,00,000"],
        [99999999999, "99,99,99,99,999"],
        [1000000000000, "10,00,00,00,00,000"],
        [-1, "-1"],
        [-1000, "-1,000"],
        [-12345678, "-1,23,45,678"],
        [12345678.9, "1,23,45,678.9"],
        [-12345678.9, "-1,23,45,678.9"],
        [0.5, "0.5"],
        [-0.5, "-0.5"],
    ];
    for (const [input, expected] of cases) {
        assert.equal(format(input), expected, `format(${input})`);
    }
});

test("groupIndian works on raw digit strings of any length", () => {
    assert.equal(groupIndian("1"), "1");
    assert.equal(groupIndian("123"), "123");
    assert.equal(groupIndian("1234"), "1,234");
    assert.equal(groupIndian("12345"), "12,345");
    assert.equal(groupIndian("123456"), "1,23,456");
    assert.equal(groupIndian("123456789012345678"), "1,23,45,67,89,01,23,45,678");
});

test("format honours the decimals option and rounds half away from zero", () => {
    assert.equal(format(1234.5, { decimals: 2 }), "1,234.50");
    assert.equal(format(1234.567, { decimals: 2 }), "1,234.57");
    assert.equal(format(1234.564, { decimals: 2 }), "1,234.56");
    assert.equal(format(1234.565, { decimals: 2 }), "1,234.57");
    assert.equal(format(-1234.565, { decimals: 2 }), "-1,234.57");
    assert.equal(format(2.5, { decimals: 0 }), "3");
    assert.equal(format(3.5, { decimals: 0 }), "4");
    assert.equal(format(-2.5, { decimals: 0 }), "-3");
    assert.equal(format(1.005, { decimals: 2 }), "1.01");
    assert.equal(format(999.995, { decimals: 2 }), "1,000.00");
    assert.equal(format(99999.999, { decimals: 2 }), "1,00,000.00");
});

test("format survives floating point noise", () => {
    assert.equal(format(0.1 + 0.2, { decimals: 2 }), "0.30");
    assert.equal(format(0.1 + 0.2), "0.30000000000000004");
    assert.equal(format(1e21), "1,00,00,00,00,00,00,00,00,00,000");
    assert.equal(format(1e-7, { decimals: 8 }), "0.00000010");
});

test("format never prints a negative zero", () => {
    assert.equal(format(-0), "0");
    assert.equal(format(-0.001, { decimals: 2 }), "0.00");
    assert.equal(format(-0.4, { decimals: 0 }), "0");
    assert.equal(formatCurrency(-0.004), "₹0.00");
});

test("format accepts strings and bigints", () => {
    assert.equal(format("12345678.9"), "1,23,45,678.9");
    assert.equal(format("1,23,45,678.90"), "1,23,45,678.9");
    assert.equal(format(" -1234 "), "-1,234");
    assert.equal(format(12345678901234567890123n), "12,34,56,78,90,12,34,56,78,90,123");
    assert.equal(format(9007199254740993n), "9,00,71,99,25,47,40,993");
});

test("formatCurrency", () => {
    assert.equal(formatCurrency(12345678.9), "₹1,23,45,678.90");
    assert.equal(formatCurrency(1234), "₹1,234.00");
    assert.equal(formatCurrency(1234, { symbol: "Rs. " }), "Rs. 1,234.00");
    assert.equal(formatCurrency(1234, { symbol: "INR", spaceAfterSymbol: true }), "INR 1,234.00");
    assert.equal(formatCurrency(1234, { symbol: "Rs. ", spaceAfterSymbol: true }), "Rs. 1,234.00");
    assert.equal(formatCurrency(-5000), "-₹5,000.00");
    assert.equal(formatCurrency(0), "₹0.00");
    assert.equal(formatCurrency(99.999), "₹100.00");
    assert.equal(formatCurrency(1234.5, { decimals: 0 }), "₹1,235");
    assert.equal(formatCurrency(1234.5, { symbol: "" }), "1,234.50");
});

test("abbreviate boundaries", () => {
    assert.equal(abbreviate(0), "0");
    assert.equal(abbreviate(999), "999");
    assert.equal(abbreviate(1000), "1 thousand");
    assert.equal(abbreviate(1500), "1.5 thousand");
    assert.equal(abbreviate(99999), "1 lakh");
    assert.equal(abbreviate(99499), "99.5 thousand");
    assert.equal(abbreviate(100000), "1 lakh");
    assert.equal(abbreviate(1234567), "12.35 lakh");
    assert.equal(abbreviate(9999999), "1 crore");
    assert.equal(abbreviate(9949999), "99.5 lakh");
    assert.equal(abbreviate(10000000), "1 crore");
    assert.equal(abbreviate(12345678), "1.23 crore");
    assert.equal(abbreviate(1000000000), "1 arab");
    assert.equal(abbreviate(100000000000), "1 kharab");
    assert.equal(abbreviate(123456789012345), "1,234.57 kharab");
});

test("abbreviate options", () => {
    assert.equal(abbreviate(12345678, { short: true }), "1.23 Cr");
    assert.equal(abbreviate(1234567, { short: true }), "12.35 L");
    assert.equal(abbreviate(1500, { short: true }), "1.5 K");
    assert.equal(abbreviate(1500000000, { short: true }), "1.5 Ar");
    assert.equal(abbreviate(1234567, { decimals: 0 }), "12 lakh");
    assert.equal(abbreviate(1234567, { decimals: 4 }), "12.3457 lakh");
    assert.equal(abbreviate(-1234567), "-12.35 lakh");
    assert.equal(abbreviate(1234567, { locale: "hi" }), "12.35 लाख");
    assert.equal(abbreviate(12345678, { locale: "hi" }), "1.23 करोड़");
    assert.equal(abbreviate(1500, { locale: "hi" }), "1.5 हज़ार");
});
