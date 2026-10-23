import assert from "node:assert/strict";
import test from "node:test";

import { format, fromDevanagariDigits, toDevanagariDigits } from "../index.js";

test("toDevanagariDigits", () => {
    assert.equal(toDevanagariDigits(2024), "२०२४");
    assert.equal(toDevanagariDigits(0), "०");
    assert.equal(toDevanagariDigits(1234567890), "१२३४५६७८९०");
    assert.equal(toDevanagariDigits(-45), "-४५");
    assert.equal(toDevanagariDigits(12345678901234567890n), "१२३४५६७८९०१२३४५६७८९०");
});

test("toDevanagariDigits leaves separators and symbols alone", () => {
    assert.equal(toDevanagariDigits(format(12345678.9)), "१,२३,४५,६७८.९");
    assert.equal(toDevanagariDigits("₹ 1,234.50"), "₹ १,२३४.५०");
    assert.equal(toDevanagariDigits("no digits here"), "no digits here");
});

test("fromDevanagariDigits", () => {
    assert.equal(fromDevanagariDigits("२०२४"), "2024");
    assert.equal(fromDevanagariDigits("१,२३,४५,६७८.९"), "1,23,45,678.9");
    assert.equal(fromDevanagariDigits("₹५००"), "₹500");
    assert.equal(fromDevanagariDigits("already 123"), "already 123");
    assert.equal(fromDevanagariDigits(""), "");
});

test("the two digit conversions are inverses", () => {
    for (let n = 0; n < 1000; n += 7) {
        assert.equal(fromDevanagariDigits(toDevanagariDigits(n)), String(n));
    }
    const sample = "1,23,45,678.90";
    assert.equal(fromDevanagariDigits(toDevanagariDigits(sample)), sample);
});

test("digit conversion rejects non-finite and non-primitive input", () => {
    assert.throws(() => toDevanagariDigits(Number.NaN), TypeError);
    assert.throws(() => toDevanagariDigits(Number.POSITIVE_INFINITY), TypeError);
    assert.throws(() => toDevanagariDigits(null), TypeError);
    assert.throws(() => fromDevanagariDigits(undefined), TypeError);
    assert.throws(() => fromDevanagariDigits({}), TypeError);
});
