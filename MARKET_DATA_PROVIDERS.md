# Free market-data candidates

Verified 2026-10-04 against provider documentation. No provider account was created and no price API is connected yet.

| Provider | Free access | Important limitation |
| --- | --- | --- |
| Alpaca Basic | US stocks and ETFs; historical API 200 calls/min | Free real-time is IEX-only; historical latest 15 minutes restricted. Do not label IEX volume as consolidated volume. |
| Twelve Data Basic | 8 credits/min; 800/day; US equities/ETFs | 500 symbols x two time_series requests/day = 1000 credits, before ETFs. Basic is internal non-display usage. |
| Alpha Vantage | 25 requests/day | Too small for the desired universe; real-time/delayed entitlements are separate. |

Sources:

- https://docs.alpaca.markets/us/docs/about-market-data-api
- https://twelvedata.com/pricing
- https://support.twelvedata.com/en/articles/9935903-us-equities-market-data
- https://www.alphavantage.co/support/

For Twelve Data, consolidated historical/EOD data becomes available after midnight ET on the next trading day according to its US equities guide; this is not a guaranteed immediate post-close consolidated bar feed.

Recommendation: evaluate Alpaca first for private development. For a publicly accessible report service, verify external display and redistribution permissions with the vendor before ingestion or publishing. A free API key is not a public redistribution license. Provider signup eligibility, ETF coverage by instrument, corporate-action adjustment, timestamps and consolidated-volume availability must be validated before technical indicators.

Connection tests remain non-persistent. The site now supports simhocheol-only GitHub-token authorization and sealed-box encrypted storage into repository Actions Secrets. Alpaca credentials are saved as a single ALPACA_CREDENTIALS_JSON bundle. OpenAI is saved as OPENAI_API_KEY. The site never retrieves stored values; authenticated status contains only existence and update time. Automatic OpenAI report generation still requires a separate integration.
