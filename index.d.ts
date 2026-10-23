export type Locale = "en" | "hi";

/** Anything the formatting functions accept as an amount. */
export type Numeric = number | string | bigint;

export interface FormatOptions {
    /** Round half away from zero to this many decimals and always print them. */
    decimals?: number;
}

export interface CurrencyOptions extends FormatOptions {
    /** Defaults to `"₹"`. */
    symbol?: string;
    /** Insert a space between the symbol and the digits. Defaults to `false`. */
    spaceAfterSymbol?: boolean;
}

export interface AbbreviateOptions {
    /** Defaults to `2`. Trailing zeros are trimmed. */
    decimals?: number;
    /** Use `K` / `L` / `Cr` / `Ar` / `Kh` instead of the full unit names. */
    short?: boolean;
    /** Defaults to `"en"`. */
    locale?: Locale;
}

export interface WordOptions {
    /** Defaults to `"en"`. */
    locale?: Locale;
}

/** Indian digit grouping: `format(12345678.9)` -> `"1,23,45,678.9"`. */
export function format(value: Numeric, options?: FormatOptions): string;

/** `formatCurrency(12345678.9)` -> `"₹1,23,45,678.90"`. */
export function formatCurrency(value: Numeric, options?: CurrencyOptions): string;

/** `abbreviate(1234567)` -> `"12.35 lakh"`. */
export function abbreviate(value: Numeric, options?: AbbreviateOptions): string;

/** `toWords(1234567)` -> `"twelve lakh thirty four thousand five hundred sixty seven"`. */
export function toWords(value: Numeric, options?: WordOptions): string;

/** `toRupeeWords(1234.5)` -> `"Rupees One Thousand Two Hundred Thirty Four and Fifty Paise Only"`. */
export function toRupeeWords(value: Numeric, options?: WordOptions): string;

/** The inverse of `format()`. Returns `NaN` for input it cannot read. */
export function parse(input: unknown): number;

/** `toDevanagariDigits(2024)` -> `"२०२४"`. */
export function toDevanagariDigits(value: Numeric): string;

/** `fromDevanagariDigits("२०२४")` -> `"2024"`. */
export function fromDevanagariDigits(value: Numeric): string;

/** Group a bare digit string the Indian way: `"12345678"` -> `"1,23,45,678"`. */
export function groupIndian(intDigits: string): string;
