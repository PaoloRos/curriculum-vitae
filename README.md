# Paolo Rossi — sito personale e curriculum

Sito statico multilingue destinato a `https://paoloros.github.io`. Contiene il curriculum in italiano, inglese e tedesco, sette annessi e tre PDF generati automaticamente dagli stessi contenuti.

## Comandi principali

```sh
npm install
npx playwright install chromium
npm run dev
```

- `npm run update-date`: imposta la data dell’ultimo aggiornamento a oggi.
- `npm run verify`: controlla contenuti, traduzioni, privacy, accessibilità e responsive.
- `npm run build`: genera il sito e i tre PDF nella cartella ignorata `dist/`.
- `npm run preview`: mostra localmente il risultato di produzione.

Le istruzioni complete per modificare, verificare, rigenerare e pubblicare il sito sono in [MANUTENZIONE.md](MANUTENZIONE.md).

## Privacy

I documenti Pages e Markdown originari e la fotografia non ripulita sono esclusi da Git. Nel sito pubblico sono ammessi soltanto nome, fotografia ripulita, email, anno di nascita, città, nazionalità e profilo linguistico. Non aggiungere indirizzo, CAP, telefono o data di nascita completa.

