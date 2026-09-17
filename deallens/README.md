# DealLens

An educational M&A acquisition-analysis prototype by Alexander Zaghloul. All example inputs are hypothetical, not AXA data or a real transaction. Built with AI assistance; calculations, assumptions and test cases are exposed for review.

## Run

Download this folder and open `index.html` in a desktop browser. No installation, account, API key or network connection is required. Keep `index.html`, `style.css`, `model.js` and `app.js` together.

## What it does

- Calculates equity purchase price, enterprise value and EV/EBITDA.
- Splits consideration into stock, existing cash and new debt.
- Bridges standalone earnings to recurring and year-one pro forma EPS.
- Calculates required realized pre-tax synergies for EPS neutrality.
- Recalculates a 5 × 5 premium/synergy sensitivity table.
- Exports and reloads assumptions as versioned JSON, exports an earnings-bridge CSV, and generates a plain-text deal memo.
- Rejects invalid numbers, zero denominators and funding above 100%.

## Test

With Node.js installed, run `node test.cjs`. Thirteen model checks cover hand-calculated baseline outputs, alternative funding structures, fees, downside earnings, invalid inputs, break-even and sensitivity consistency.

## Two-minute demonstration

1. Open the default example. Purchase equity is $300m, enterprise value is $345m; funding is $120m stock, $60m existing cash and $120m new debt.
2. Show recurring net income of $133.65m over 104.8m combined shares; year-one earnings deduct $5m in fees.
3. Click **Stress execution** to lower synergy realization and increase interest and fees. Explain which effects change recurring EPS and which affect year one only.
4. Use the premium/synergy grid to show why a single forecast can hide deal risk.
5. Export a deal memo and its assumptions. Explain why EPS accretion alone does not establish value creation.

## Model conventions

USD millions and million shares except per-share data. Full-year results, no close-date proration. Target debt/cash remain in place; target net income already reflects its existing financing costs. Financing percentages apply to purchase equity only. Fees are separately cash-funded and expensed without a tax benefit; their foregone interest is excluded. The entered marginal tax rate applies to incremental recurring adjustments. No automatic check of buyer cash capacity or debt covenants.

Incremental recurring adjustments = (realized synergies − new debt interest − foregone cash interest − incremental amortization) × (1 − tax rate).

EPS-neutral realized synergies = max(0, [standalone buyer EPS × new shares − target net income] / [1 − tax rate] + new interest + foregone interest + amortization). At 100% tax this output is unavailable. One-time fees are excluded from this break-even.

## Limitations and next research steps

This is a transparent teaching model, not investment advice or a production valuation platform. It does not calculate DCF value, full purchase-price allocation, goodwill, deferred taxes, regulatory outcomes, working capital, debt refinancing, integration phasing, or a balanced three-statement model. Validate financial statements and sources before substituting real inputs. A future extension could add a cash-flow valuation alongside accretion to evaluate price versus intrinsic value.

## Interview preparation

Read `model.js` and reproduce the default calculation by hand before presenting the project. Be precise about your role, the AI-assisted development process, the hypothetical inputs, and what you can explain independently. Do not describe this as a completed deal or client advisory engagement.
