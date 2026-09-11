# Canada Payment KPI Workbench

A local-first finance operations prototype for turning provider-payment exports into a measurable KPI review and an actionable exception queue.

**All repository data is synthetic. No real employer, supplier, customer, claim, voucher or production data is included.** The interface and workflows are a portfolio demonstration by Alexander Zaghloul.

## Run the demo

Download `index.html` and open it in a current desktop version of Microsoft Edge or Chrome. No installation, account, server or internet connection is required.

The generated demo starts with 1,680 synthetic active payment records. You can also open **Data & validation** and load `sample_provider_payments.csv` to exercise the import workflow.

## What it does

- Parses a quoted enterprise CSV entirely in the browser.
- Validates required columns, dates, amounts, exclusions and reconciliation.
- Calculates paid mean, median and nearest-rank P90 in calendar days.
- Evaluates valid paid and unpaid records against an adjustable timing threshold.
- Filters by entry month and program, and ranks exception concentration.
- Separates unpaid overdue records, source-data reviews and historical late payments.
- Adds action owners, causes, statuses, next steps and review dates without rewriting KPI evidence.
- Saves actions locally and exports source-bound backups using a SHA-256 fingerprint when supported and a deterministic local fallback otherwise.
- Exports monthly, program, exception and audit files.
- Rejects invalid replacements while keeping the previous dataset usable.

## Why I built it

Recurring KPI work often ends with a spreadsheet and no clear path from a late record to a responsible owner. This prototype joins consistent measurement, source validation and follow-up in one working surface. It also makes assumptions visible: the time threshold, calendar-day definition, status exclusions and source-date proxy must be approved before operational adoption.

## Architecture

- `engine.js`: CSV parser, date/amount validation, KPI classification and statistics.
- `app.js`: state, filters, charts, exception queue, actions, imports and exports.
- `shell.html` + `styles.css`: accessible responsive interface.
- `build.cjs`: embeds a selected baseline into one offline HTML file.
- `test.cjs`: engine boundaries, invalid input, signed currency, quoted CSVs and sample reconciliation.
- `test-ui.cjs`: simulated browser-state checks for filters, exports, actions, backups and import recovery.
- `sample_provider_payments.csv`: deterministic synthetic data only.

## Verify or rebuild

Node.js 18 or newer is needed for development. The finished HTML needs only a browser.

```sh
node test.cjs
node build.cjs sample_provider_payments.csv 2026-09-10
# Creates dist/payment-kpi-workbench.html
node test-ui.cjs
```

## Measurement notes

The demonstration recognizes the Canada business unit code `CA01`, excludes `Canceled` and `Closed`, uses `AcctgDate` as a configurable system-entry proxy, and calculates UTC calendar-day differences through a chosen as-of date. Counts represent source payment rows, not unique claims. Signed amounts are retained in cents. Review records leave the assessment denominator. Repeated identical active rows remain visible and are reported rather than silently removed.

This is a portfolio prototype. Production use would require approved business definitions, access controls, shared persistence, integration ownership and testing against the organization's systems and policies.
