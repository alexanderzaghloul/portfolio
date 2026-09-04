# Gematrix

A personal exploration of Hebrew gematria, Jewish heritage, and technology by **Alexander Zaghloul**.

Gematrix started with my Jewish heritage and a question: what happens when I explore an old tradition through something else I love—technology? The explorer makes each letter's numerical contribution visible, connects words with equal totals, and includes a separate English letter-value experiment for my Excel application.

[Open Gematrix](https://gematrix.azaghlou.chatgpt.site) · [GitHub source](https://github.com/alexanderzaghloul/portfolio/tree/main/gematrix) · [LinkedIn](https://www.linkedin.com/in/alexander-zaghloul)

The hosted demo is public and requires no sign-in. The source below can also be run locally.

## Features

- Live Hebrew and English calculations with a letter-by-letter breakdown.
- A ring showing each letter's share of the total.
- A Hebrew keyboard and example words.
- Curated connections, including אהבה (love) and אחד (one), both 13.
- A responsive layout and an explanation of each calculation method.

## Run locally

The static site runs entirely in the browser. Serve the directory containing `index.html` from any static web server. In the Sites source checkout this is `dist/`; in the GitHub portfolio it is `gematrix/`.

For example, run `python3 -m http.server 8000` inside that directory and open `http://localhost:8000`. A local server is needed for JavaScript module imports. No API keys, package installation, accounts, or data services are required. Fonts use Google Fonts with local serif and sans-serif fallbacks.

## Calculations

- Hebrew uses standard gematria, including ordinary values for final letter forms.
- English uses the separate A1–Z26 ordinal system.
- Unicode normalization supports Hebrew presentation forms and strips vowel marks from calculations. English accented Latin letters use their decomposed base letters.
- Letters outside the selected alphabet are excluded with a visible notice.
- The connection list is curated, not a dictionary or an exhaustive search.
- EXCEL = 49 in English. The illustrative Hebrew spelling אקסל = 191. These methods and spelling choices are explained in the interface.

The calculation engine is isolated in `engine.mjs`; the interface lives in `index.html`, `styles.css`, and `app.js`. The project uses HTML, CSS, and JavaScript modules.

Background reading: https://www.chabad.org/library/article_cdo/aid/5541252/jewish/What-Is-Gematria.htm
