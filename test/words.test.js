import assert from "node:assert/strict";
import test from "node:test";

import { toRupeeWords, toWords } from "../index.js";

const ENGLISH = [
    [0, "zero"],
    [1, "one"],
    [7, "seven"],
    [10, "ten"],
    [11, "eleven"],
    [13, "thirteen"],
    [15, "fifteen"],
    [19, "nineteen"],
    [20, "twenty"],
    [21, "twenty one"],
    [25, "twenty five"],
    [29, "twenty nine"],
    [30, "thirty"],
    [39, "thirty nine"],
    [40, "forty"],
    [48, "forty eight"],
    [49, "forty nine"],
    [50, "fifty"],
    [59, "fifty nine"],
    [60, "sixty"],
    [67, "sixty seven"],
    [69, "sixty nine"],
    [70, "seventy"],
    [78, "seventy eight"],
    [79, "seventy nine"],
    [80, "eighty"],
    [88, "eighty eight"],
    [89, "eighty nine"],
    [90, "ninety"],
    [99, "ninety nine"],
    [100, "one hundred"],
    [101, "one hundred one"],
    [110, "one hundred ten"],
    [999, "nine hundred ninety nine"],
    [1000, "one thousand"],
    [1001, "one thousand one"],
    [10000, "ten thousand"],
    [100000, "one lakh"],
    [123456, "one lakh twenty three thousand four hundred fifty six"],
    [1000000, "ten lakh"],
    [1234567, "twelve lakh thirty four thousand five hundred sixty seven"],
    [10000000, "one crore"],
    [12345678, "one crore twenty three lakh forty five thousand six hundred seventy eight"],
    [1000000000, "one hundred crore"],
    [100000000000, "ten thousand crore"],
    [1000000000000, "one lakh crore"],
    [
        99999999999,
        "nine thousand nine hundred ninety nine crore ninety nine lakh ninety nine thousand nine hundred ninety nine",
    ],
];

const HINDI = [
    [0, "शून्य"],
    [1, "एक"],
    [7, "सात"],
    [10, "दस"],
    [11, "ग्यारह"],
    [13, "तेरह"],
    [15, "पंद्रह"],
    [19, "उन्नीस"],
    [20, "बीस"],
    [21, "इक्कीस"],
    [25, "पच्चीस"],
    [29, "उनतीस"],
    [30, "तीस"],
    [32, "बत्तीस"],
    [39, "उनतालीस"],
    [40, "चालीस"],
    [48, "अड़तालीस"],
    [49, "उनचास"],
    [50, "पचास"],
    [59, "उनसठ"],
    [60, "साठ"],
    [67, "सरसठ"],
    [69, "उनहत्तर"],
    [70, "सत्तर"],
    [78, "अठहत्तर"],
    [79, "उन्यासी"],
    [80, "अस्सी"],
    [88, "अठासी"],
    [89, "नवासी"],
    [90, "नब्बे"],
    [99, "निन्यानवे"],
    [100, "एक सौ"],
    [101, "एक सौ एक"],
    [999, "नौ सौ निन्यानवे"],
    [1000, "एक हज़ार"],
    [10000, "दस हज़ार"],
    [100000, "एक लाख"],
    [1234567, "बारह लाख चौंतीस हज़ार पाँच सौ सरसठ"],
    [10000000, "एक करोड़"],
    [1000000000, "एक अरब"],
    [100000000000, "एक खरब"],
    [
        99999999999,
        "निन्यानवे अरब निन्यानवे करोड़ निन्यानवे लाख निन्यानवे हज़ार नौ सौ निन्यानवे",
    ],
];

test("toWords in English", () => {
    for (const [input, expected] of ENGLISH) {
        assert.equal(toWords(input), expected, `toWords(${input})`);
    }
});

test("toWords in Hindi uses the irregular 0-99 words", () => {
    for (const [input, expected] of HINDI) {
        assert.equal(toWords(input, { locale: "hi" }), expected, `toWords(${input}, hi)`);
    }
});

test("every Hindi word from 1 to 99 is distinct and non-empty", () => {
    const seen = new Set();
    for (let n = 0; n <= 99; n += 1) {
        const word = toWords(n, { locale: "hi" });
        assert.ok(word.length > 0, `missing Hindi word for ${n}`);
        assert.ok(!word.includes(" "), `Hindi word for ${n} should be a single word, got "${word}"`);
        assert.ok(!seen.has(word), `duplicate Hindi word "${word}" at ${n}`);
        seen.add(word);
    }
    assert.equal(seen.size, 100);
});

test("toWords handles negatives, decimals and bigints", () => {
    assert.equal(toWords(-45), "minus forty five");
    assert.equal(toWords(-45, { locale: "hi" }), "ऋण पैंतालीस");
    assert.equal(toWords(1234.5), "one thousand two hundred thirty four point five");
    assert.equal(toWords(1234.5, { locale: "hi" }), "एक हज़ार दो सौ चौंतीस दशमलव पाँच");
    assert.equal(toWords(0.07), "zero point zero seven");
    assert.equal(toWords(12.0), "twelve");
    assert.equal(toWords("1,23,45,678"), "one crore twenty three lakh forty five thousand six hundred seventy eight");
    assert.equal(toWords(10000000000000000000000n), "ten crore crore crore");
    assert.equal(toWords(-0), "zero");
});

test("toRupeeWords English", () => {
    assert.equal(
        toRupeeWords(1234.5),
        "Rupees One Thousand Two Hundred Thirty Four and Fifty Paise Only",
    );
    assert.equal(toRupeeWords(1234), "Rupees One Thousand Two Hundred Thirty Four Only");
    assert.equal(toRupeeWords(1234.0), "Rupees One Thousand Two Hundred Thirty Four Only");
    assert.equal(toRupeeWords(0), "Rupees Zero Only");
    assert.equal(toRupeeWords(0.75), "Rupees Zero and Seventy Five Paise Only");
    assert.equal(toRupeeWords(1.01), "Rupees One and One Paisa Only");
    assert.equal(toRupeeWords(5.05), "Rupees Five and Five Paise Only");
    assert.equal(toRupeeWords(9.99), "Rupees Nine and Ninety Nine Paise Only");
    assert.equal(toRupeeWords(-100), "Minus Rupees One Hundred Only");
    assert.equal(
        toRupeeWords(123456789.99),
        "Rupees Twelve Crore Thirty Four Lakh Fifty Six Thousand Seven Hundred Eighty Nine and Ninety Nine Paise Only",
    );
});

test("toRupeeWords rounds to the nearest paisa", () => {
    assert.equal(toRupeeWords(1234.567), "Rupees One Thousand Two Hundred Thirty Four and Fifty Seven Paise Only");
    assert.equal(toRupeeWords(1234.564), "Rupees One Thousand Two Hundred Thirty Four and Fifty Six Paise Only");
    assert.equal(toRupeeWords(1234.995), "Rupees One Thousand Two Hundred Thirty Five Only");
    assert.equal(toRupeeWords(0.004), "Rupees Zero Only");
    assert.equal(toRupeeWords(0.005), "Rupees Zero and One Paisa Only");
});

test("toRupeeWords Hindi", () => {
    assert.equal(
        toRupeeWords(1234.5, { locale: "hi" }),
        "रुपये एक हज़ार दो सौ चौंतीस और पचास पैसे मात्र",
    );
    assert.equal(toRupeeWords(1234, { locale: "hi" }), "रुपये एक हज़ार दो सौ चौंतीस मात्र");
    assert.equal(toRupeeWords(0, { locale: "hi" }), "रुपये शून्य मात्र");
    assert.equal(toRupeeWords(1.01, { locale: "hi" }), "रुपये एक और एक पैसा मात्र");
    assert.equal(toRupeeWords(99.99, { locale: "hi" }), "रुपये निन्यानवे और निन्यानवे पैसे मात्र");
    assert.equal(toRupeeWords(-100, { locale: "hi" }), "ऋण रुपये एक सौ मात्र");
});
