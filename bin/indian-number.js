#!/usr/bin/env node
import {
    abbreviate,
    format,
    formatCurrency,
    parse,
    toDevanagariDigits,
    toRupeeWords,
    toWords,
} from "../index.js";
import { createColors } from "../src/colors.js";

const HELP = `indian-number - format Indian numbers and spell amounts out in words

Usage
  npx indian-number <amount> [options]

Arguments
  <amount>            12345678.9, "1,23,45,678.90", "12.5 lakh", "Rs. 1.2 crore"

Options
  -d, --decimals <n>  decimals for the grouped and currency lines (default: 2)
  -s, --symbol <s>    currency symbol (default: the rupee sign)
      --json          print the same data as JSON
  -h, --help          show this help
  -v, --version       show the version

Examples
  npx indian-number 12345678.9
  npx indian-number "12.5 lakh" --decimals 0
  npx indian-number 1234.50 --json
`;

function parseArgs(argv) {
    const options = { decimals: 2, symbol: "₹", json: false, help: false, version: false };
    const positional = [];

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === "-h" || arg === "--help") options.help = true;
        else if (arg === "-v" || arg === "--version") options.version = true;
        else if (arg === "--json") options.json = true;
        else if (arg === "-d" || arg === "--decimals") options.decimals = Number(argv[++i]);
        else if (arg === "-s" || arg === "--symbol") options.symbol = String(argv[++i] ?? "");
        else if (arg.startsWith("--decimals=")) options.decimals = Number(arg.slice(11));
        else if (arg.startsWith("--symbol=")) options.symbol = arg.slice(9);
        else positional.push(arg);
    }

    return { options, positional };
}

async function readVersion() {
    const { readFile } = await import("node:fs/promises");
    const { fileURLToPath } = await import("node:url");
    const path = await import("node:path");
    const here = path.dirname(fileURLToPath(import.meta.url));
    const pkg = JSON.parse(await readFile(path.join(here, "..", "package.json"), "utf8"));
    return pkg.version;
}

function report(value, options) {
    return {
        input: value,
        formatted: format(value, { decimals: options.decimals }),
        currency: formatCurrency(value, { decimals: options.decimals, symbol: options.symbol }),
        abbreviated: abbreviate(value),
        abbreviatedShort: abbreviate(value, { short: true }),
        devanagari: toDevanagariDigits(format(value, { decimals: options.decimals })),
        words: { en: toWords(value), hi: toWords(value, { locale: "hi" }) },
        rupeeWords: { en: toRupeeWords(value), hi: toRupeeWords(value, { locale: "hi" }) },
    };
}

function render(data, colors) {
    const row = (label, text) => `  ${colors.dim(label.padEnd(12))} ${text}`;
    return [
        colors.bold(`indian-number  ${data.input}`),
        "",
        row("grouped", colors.cyan(data.formatted)),
        row("currency", colors.green(data.currency)),
        row("short", `${colors.yellow(data.abbreviated)}  (${data.abbreviatedShort})`),
        row("devanagari", data.devanagari),
        "",
        row("words en", data.words.en),
        row("words hi", data.words.hi),
        "",
        row("cheque en", data.rupeeWords.en),
        row("cheque hi", data.rupeeWords.hi),
        "",
    ].join("\n");
}

async function main() {
    const { options, positional } = parseArgs(process.argv.slice(2));
    const colors = createColors();

    if (options.version) {
        process.stdout.write(`${await readVersion()}\n`);
        return;
    }

    if (options.help || positional.length === 0) {
        process.stdout.write(HELP);
        process.exitCode = options.help ? 0 : 1;
        return;
    }

    const value = parse(positional.join(" "));
    if (Number.isNaN(value)) {
        process.stderr.write(`indian-number: could not read "${positional.join(" ")}" as a number\n`);
        process.exitCode = 1;
        return;
    }

    const data = report(value, options);
    process.stdout.write(options.json ? `${JSON.stringify(data, null, 2)}\n` : `${render(data, colors)}\n`);
}

main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
});
