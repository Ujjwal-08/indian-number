# indian-number

Indian digit grouping (lakh, crore), rupee amounts in words in English and Hindi, and a
parser that reads it all back. Zero dependencies, no `toLocaleString`, identical output on
every machine.

```
$ npx indian-number 12345678.9

indian-number  12345678.9

  grouped      1,23,45,678.90
  currency     ₹1,23,45,678.90
  short        1.23 crore  (1.23 Cr)
  devanagari   १,२३,४५,६७८.९०

  words en     one crore twenty three lakh forty five thousand six hundred seventy eight point nine
  words hi     एक करोड़ तेईस लाख पैंतालीस हज़ार छह सौ अठहत्तर दशमलव नौ

  cheque en    Rupees One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight and Ninety Paise Only
  cheque hi    रुपये एक करोड़ तेईस लाख पैंतालीस हज़ार छह सौ अठहत्तर और नब्बे पैसे मात्र
```

## Install

```sh
npx indian-number 12345678.9     # no install needed
npm i indian-number              # to use the API
```

Node 18 or newer, ESM only.

## Usage

```js
import {
    abbreviate,
    format,
    formatCurrency,
    fromDevanagariDigits,
    parse,
    toDevanagariDigits,
    toRupeeWords,
    toWords,
} from "indian-number";
```

Real output of the examples below (copied from a `node` run):

```js
format(12345678.9)                        // "1,23,45,678.9"
format(1234.5, { decimals: 2 })           // "1,234.50"
format(0.1 + 0.2, { decimals: 2 })        // "0.30"
formatCurrency(12345678.9)                // "₹1,23,45,678.90"
formatCurrency(1234, { symbol: "Rs. " })  // "Rs. 1,234.00"
abbreviate(1234567)                       // "12.35 lakh"
abbreviate(12345678, { short: true })     // "1.23 Cr"
abbreviate(999)                           // "999"
toWords(1234567)                          // "twelve lakh thirty four thousand five hundred sixty seven"
toWords(1234567, { locale: "hi" })        // "बारह लाख चौंतीस हज़ार पाँच सौ सरसठ"
toWords(99999999999)                      // "nine thousand nine hundred ninety nine crore ninety nine lakh ninety nine thousand nine hundred ninety nine"
toWords(99999999999, { locale: "hi" })    // "निन्यानवे अरब निन्यानवे करोड़ निन्यानवे लाख निन्यानवे हज़ार नौ सौ निन्यानवे"
toRupeeWords(1234.50)                     // "Rupees One Thousand Two Hundred Thirty Four and Fifty Paise Only"
toRupeeWords(1234.5, { locale: "hi" })    // "रुपये एक हज़ार दो सौ चौंतीस और पचास पैसे मात्र"
parse("1,23,45,678.90")                   // 12345678.9
parse("12.5 lakh")                        // 1250000
parse("₹1.2 crore")                       // 12000000
parse("not a number")                     // NaN
toDevanagariDigits(2024)                  // "२०२४"
fromDevanagariDigits("२०२४")              // "2024"
```

### CLI

```sh
npx indian-number "12.5 lakh" --decimals 0
npx indian-number 1234.50 --json
```

| Flag | Meaning |
| --- | --- |
| `-d, --decimals <n>` | Decimals for the grouped and currency lines (default `2`) |
| `-s, --symbol <s>` | Currency symbol (default `₹`) |
| `--json` | Print the same data as JSON |
| `-h, --help` | Show help |
| `-v, --version` | Show the version |

The amount may be anything `parse()` accepts, so `npx indian-number "Rs. 1.2 crore"` works.
Colour is dropped when `NO_COLOR` is set or stdout is not a TTY.

## API

Every function accepts `number | string | bigint`. Strings may carry grouping commas and
spaces. Non-finite numbers, `null`, `undefined`, objects and unreadable strings throw a
`TypeError` whose message starts with `indian-number:` — the one exception is `parse()`,
which is a parser and returns `NaN` instead.

### `format(value, { decimals? })`

Groups the integer part the Indian way: last three digits, then twos (`1,23,45,678`).
With `decimals`, rounds **half away from zero** and always prints that many decimals;
without it, prints the value's own decimals. Never returns `-0`.

Rounding works on the decimal string, not the binary double, so `format(1.005, { decimals: 2 })`
is `"1.01"` and `format(0.1 + 0.2, { decimals: 2 })` is `"0.30"`.

### `formatCurrency(value, { decimals = 2, symbol = "₹", spaceAfterSymbol = false })`

`format()` with a currency symbol in front. A negative amount reads `-₹5,000.00`.

### `abbreviate(value, { decimals = 2, short = false, locale = "en" })`

Shortens using Indian scale units. Trailing zeros are trimmed, and a value that rounds up
into the next unit is promoted (`abbreviate(99999)` is `"1 lakh"`, never `"100 thousand"`).

| From | Unit (`en`) | `short` | `hi` |
| --- | --- | --- | --- |
| 1,000 | thousand | K | हज़ार |
| 1,00,000 | lakh | L | लाख |
| 1,00,00,000 | crore | Cr | करोड़ |
| 1,00,00,00,000 | arab | Ar | अरब |
| 1,00,00,00,00,000 | kharab | Kh | खरब |

Below 1,000 the number is returned as-is. `short` only changes the English units; Hindi has
no settled abbreviations, so it keeps the full words.

### `toWords(value, { locale = "en" })`

Spells the number out. A fractional part is read digit by digit after `point` / `दशमलव`,
and a negative value is prefixed with `minus` / `ऋण`. Arbitrarily large values work
(the integer part is handled as a `BigInt`).

English uses *lakh* and *crore* and keeps multiplying crores above 10<sup>7</sup>, so
10<sup>12</sup> reads `"one lakh crore"`. Hindi uses हज़ार, लाख, करोड़, अरब and खरब.

### `toRupeeWords(value, { locale = "en" })`

Cheque and invoice wording. Rounds to the nearest paisa first.

```
Rupees One Thousand Two Hundred Thirty Four and Fifty Paise Only
रुपये एक हज़ार दो सौ चौंतीस और पचास पैसे मात्र
```

The paise clause is dropped when the amount is whole, `Paisa` / `पैसा` is used for exactly
one, and a negative amount is prefixed with `Minus` / `ऋण`.

### `parse(input)`

The inverse of `format()`. Reads grouping commas, spaces, Devanagari digits, a
`₹` / `Rs.` / `INR` / `रुपये` prefix on either side of the sign, a trailing `/-`, and
`k` / `L` / `lakh` / `Cr` / `crore` / `arab` / `kharab` suffixes in either script,
case-insensitively. Suffixes are applied by shifting the decimal point, so
`parse("₹1.2 crore")` is exactly `12000000`. Returns `NaN` for anything else.

### `toDevanagariDigits(value)` / `fromDevanagariDigits(value)`

Convert digits between `0123456789` and `०१२३४५६७८९`, leaving every other character
(commas, `₹`, the decimal point) untouched — so you can feed either one the output of
`format()`.

### `groupIndian(digits)`

The grouping primitive, exported for anyone who already has a digit string:
`groupIndian("12345678")` is `"1,23,45,678"`.

## Why

Indian grouping is 2,2,3 rather than 3,3,3, and `Intl`/`toLocaleString` only gets there if
the host has the `en-IN` data and you accept whatever it decides about symbols and rounding.
Converting an amount to Hindi words is worse: Hindi has a separate irregular word for every
number from 1 to 99 (उनतालीस, सैंतालीस, उनसठ, सरसठ, अठहत्तर, निन्यानवे …), so the usual
"tens word plus units word" trick produces words that do not exist.

This package writes out the full 0–99 Hindi table, does its grouping and rounding on digit
strings, and never touches the host locale — the same input gives the same output on every
machine, which is what invoices, cheques and GST filings need.

## Support

If this saved you some time, you can support the work here:

- **Patreon:** https://www.patreon.com/cw/BABU_ISHU
- **PayPal:** https://www.paypal.com/ncp/payment/SECBQ62TRZZ6Y

## License

MIT
