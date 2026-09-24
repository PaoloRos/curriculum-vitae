# Paolo Rossi — sito personale e curriculum

Sito statico multilingue pubblicato come progetto GitHub Pages all’indirizzo `https://paoloros.github.io/curriculum-vitae/`. Contiene il curriculum in italiano, inglese e tedesco, sei annessi e tre PDF generati automaticamente dagli stessi contenuti.

## Comandi principali

```sh
npm install
npx playwright install chromium
npm run dev
```

L’anteprima di sviluppo è disponibile normalmente su `http://localhost:4321/curriculum-vitae/`.

- `npm run update-date`: imposta la data dell’ultimo aggiornamento a oggi.
- `npm run verify`: controlla contenuti, traduzioni, privacy, accessibilità e responsive.
- `npm run build`: genera il sito e i tre PDF nella cartella ignorata `dist/`, poi controlla automaticamente percorsi e collegamenti prodotti.
- `npm run preview`: mostra localmente il risultato di produzione.
- `npm run pdf:private`: genera, solo sul tuo computer, i tre PDF con il numero di telefono in `private/pdf/`.

Le istruzioni complete per modificare, verificare, rigenerare e pubblicare il sito sono in [MANUTENZIONE.md](MANUTENZIONE.md).

## Privacy

I documenti Pages e Markdown originari e la fotografia non ripulita sono esclusi da Git. Nel sito pubblico sono ammessi soltanto nome, fotografia ripulita, email, profilo GitHub, anno di nascita, città, nazionalità e profilo linguistico. Non aggiungere indirizzo, CAP, telefono o data di nascita completa.

L’unica eccezione è il numero di telefono, ammesso **solo** nei PDF generati in locale con `npm run pdf:private`. Il numero sta in `private/contact.yml` e i PDF in `private/pdf/`: l’intera cartella `private/` è ignorata da Git, non viene letta da Astro e non arriva mai in `dist/`, su GitHub o su GitHub Pages. Il PDF scaricabile dal sito resta senza numero. `npm run check` e `npm run build` segnalano un errore se il numero compare in un file pubblicabile.
