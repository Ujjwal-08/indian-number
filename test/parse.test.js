import assert from "node:assert/strict";
import test from "node:test";

import { format, formatCurrency, parse } from "../index.js";

test("parse reads formatted output back", () => {
    assert.equal(parse("1,23,45,678.90"), 12345678.9);
    assert.equal(parse("1,23,45,678"), 12345678);
    assert.equal(parse("999"), 999);
    assert.equal(parse("0"), 0);
    assert.equal(parse("-1,234.50"), -1234.5);
    assert.equal(parse("+1,234"), 1234);
    assert.equal(parse(".5"), 0.5);
    assert.equal(parse("  1 234  "), 1234);
});

test("parse reads currency prefixes", () => {
    assert.equal(parse("₹1,234"), 1234);
    assert.equal(parse("₹ 1,234.50"), 1234.5);
    assert.equal(parse("Rs. 1,234"), 1234);
    assert.equal(parse("Rs 1234"), 1234);
    assert.equal(parse("INR 1,23,456"), 123456);
    assert.equal(parse("rupees 50"), 50);
    assert.equal(parse("1,234/-"), 1234);
    assert.equal(parse("-₹1,234.50"), -1234.5);
    assert.equal(parse("₹-1,234.50"), -1234.5);
    assert.equal(parse("- Rs. 90"), -90);
    assert.equal(parse("रुपये 500"), 500);
});

test("parse reads scale suffixes, case insensitively", () => {
    assert.equal(parse("12.5 lakh"), 1250000);
    assert.equal(parse("₹1.2 crore"), 12000000);
    assert.equal(parse("1.2Cr"), 12000000);
    assert.equal(parse("1.2 CRORE"), 12000000);
    assert.equal(parse("5k"), 5000);
    assert.equal(parse("5 K"), 5000);
    assert.equal(parse("2.5L"), 250000);
    assert.equal(parse("3 lacs"), 300000);
    assert.equal(parse("1 arab"), 1000000000);
    assert.equal(parse("1 kharab"), 100000000000);
    assert.equal(parse("-2.5 lakh"), -250000);
    assert.equal(parse("12.5 लाख"), 1250000);
    assert.equal(parse("1.2 करोड़"), 12000000);
});

test("parse reads Devanagari digits", () => {
    assert.equal(parse("२०२४"), 2024);
    assert.equal(parse("१,२३,४५६"), 123456);
    assert.equal(parse("₹१.२ करोड़"), 12000000);
});

test("parse returns NaN for junk", () => {
    const junk = [
        "",
        "   ",
        "abc",
        "lakh",
        "₹",
        "1.2.3",
        "12 lakh crore",
        "1,2,3 banana",
        "--5",
        "5-",
        "0x10",
        "1e5",
        ".",
        "NaN",
        "Infinity",
        null,
        undefined,
        {},
        [],
        true,
        Number.NaN,
        Number.POSITIVE_INFINITY,
    ];
    for (const value of junk) {
        assert.ok(Number.isNaN(parse(value)), `parse(${String(value)}) should be NaN`);
    }
});

test("parse accepts numbers and bigints unchanged", () => {
    assert.equal(parse(1234.5), 1234.5);
    assert.equal(parse(-7), -7);
    assert.equal(parse(1234n), 1234);
});

test("format -> parse round-trips over 200 random values", () => {
    let seed = 20260218;
    const random = () => {
        // Mulberry32: deterministic, so a failure is reproducible.
        seed = (seed + 0x6d2b79f5) >>> 0;
        let t = seed;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    for (let i = 0; i < 200; i += 1) {
        const magnitude = 10 ** Math.floor(random() * 13);
        const sign = random() < 0.3 ? -1 : 1;
        const value = sign * random() * magnitude;
        if (value === 0) continue;
        const text = format(value);
        const back = parse(text);
        assert.equal(back, value, `round-trip failed for ${value} (formatted as ${text})`);
    }
});

test("format -> parse round-trips at a fixed scale within epsilon", () => {
    let seed = 7;
    const random = () => {
        seed = (seed * 1103515245 + 12345) % 2147483648;
        return seed / 2147483648;
    };

    for (let i = 0; i < 200; i += 1) {
        const value = (random() - 0.4) * 1e9;
        const text = formatCurrency(value, { decimals: 2 });
        const back = parse(text);
        assert.ok(
            Math.abs(back - value) <= 0.005,
            `round-trip drifted for ${value}: ${text} -> ${back}`,
        );
    }
});
