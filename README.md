# Earth Information Jukebox

A browser-based sonification console for exploring Earth-system trends as sound. The React app uses Tone.js for local audio synthesis, Recharts for the annual series, and a Canvas frequency visualizer. No audio service or data API is required.

## Run locally

```sh
npm install
npm run dev
```

`npm run dev` starts the Vite frontend and the local Gemini API proxy. Open the URL printed by Vite. Use the signal and observation-area selectors to explore the demo data, choose a quick-listen preset, adjust master output, and press Play. Audio starts only after that user interaction.

## Gemini assistant

The top bar opens a Gemini chat and a Russian quick-start guide. The assistant receives the current metric, region, year, value, trend, and narrative as context. Its API key stays on the local server and is never bundled into browser code.

1. Create a Gemini API key in Google AI Studio.
2. Copy `.env.example` to `.env` with `cp .env.example .env`.
3. Put your key in `.env` as `GEMINI_API_KEY=...`. Do not commit `.env` or paste the key into chat.
4. Restart `npm run dev` and open **AI помощник** in the top bar.

`GEMINI_MODEL` and `API_PORT` can be changed in `.env`. Without a configured key, the dashboard and help guide remain available; chat shows a setup message.

## Export a PDF report

The top-bar **Export PDF Report** action creates a two-page A4 report in the browser with the current soundscape, trend chart, spectrum snapshot, regional climate and social context, generation time, and an app QR code. It does not stop Tone.js playback. The filename format is `Earth_Jukebox_Report_<Location>_<Year>.pdf`.

PDF rendering and QR generation use `jspdf`, `html2canvas`, and `qrcode`; these are included in the project dependencies. To install them separately in an existing checkout, run:

```sh
npm install jspdf html2canvas qrcode
```

## Sonification map

- Temperature changes note pitch.
- Sea level changes pulse tempo.
- Cloud cover changes note duration and reverb.
- Wildfire area changes distortion and intensity.
- Vegetation adds a harmonic voice and changes timbre.

The annual series cover 2000–2026 and are deterministic, NASA-inspired mock values for demonstration. They are simulated and are not official NASA observations.

## Human & social layer

Switch the data layer to **Human & social** for Uzbekistan population, median age, average salary, happiness rank, life expectancy, adult literacy, GDP per capita, internet access, and urbanization. The 2026 endpoints use the supplied summary; values for 2000–2025 are illustrative interpolations, not official historical statistics.

Population and internet access shape pulse tempo, age/GDP shape timbre or pitch, salary changes amplitude, life expectancy changes note duration, and happiness/literacy add harmony. The social layer is scoped to Uzbekistan because no comparable country series was supplied.
