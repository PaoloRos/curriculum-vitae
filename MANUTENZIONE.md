# Guida alla manutenzione del sito

Questa guida descrive il flusso completo per aggiornare curriculum, traduzioni, fotografia, sito e PDF. I file dentro `dist/` sono sempre generati: non modificarli direttamente.

## 1. Preparazione iniziale

Serve una versione corrente di Node.js. Dalla cartella del progetto, esegui una sola volta:

```sh
npm install
npx playwright install chromium
```

## 2. Dove modificare i testi

I contenuti sono in tre file YAML:

- `src/content/cv/it.yml` — italiano;
- `src/content/cv/en.yml` — inglese;
- `src/content/cv/de.yml` — tedesco.

Ogni modifica sostanziale deve essere riportata in tutti e tre i file. Gli identificatori `id` delle sezioni e degli annessi devono rimanere uguali nelle tre lingue; i controlli automatici segnalano eventuali differenze.

I dati comuni sono in `src/content/site.yml`: nome, email, anno di nascita, data dell’ultimo aggiornamento, fotografia e indirizzo del sito.

## 3. Esempio di modifica

Una voce è strutturata così:

```yaml
- heading: Nome dell’esperienza
  meta: Organizzazione · 2026
  paragraphs:
    - Descrizione breve e verificabile.
  bullets:
    - Primo dettaglio.
    - Secondo dettaglio.
```

`meta`, `paragraphs`, `bullets` e `annex_ids` sono facoltativi, ma ogni voce deve contenere almeno un paragrafo o un punto elenco. Non usare HTML nel testo.

## 4. Aggiungere, rimuovere o riordinare sezioni e annessi

Per una nuova sezione, aggiungi lo stesso `id` nello stesso punto della lista `sections` di tutti e tre i file. Per riordinarla, sposta l’intero blocco in ogni lingua.

Per un nuovo annesso:

1. aggiungi il blocco alla lista `annexes` in tutte le lingue;
2. usa lo stesso `id` e lo stesso `number`;
3. collega una voce del CV aggiungendo quell’ID a `annex_ids`.

Esempio:

```yaml
annex_ids: [certificazione-linguistica]
```

Il collegamento viene nascosto automaticamente nei PDF.

## 5. Sostituire la fotografia

Non copiare direttamente nel sito una fotografia proveniente dal telefono o dal documento Pages: potrebbe contenere data, posizione o informazioni sul dispositivo.

La versione pubblica deve chiamarsi `public/photo-paolo-rossi.jpg`, avere dimensioni contenute ed essere ricodificata senza EXIF, GPS o XMP. Dopo la sostituzione esegui sempre `npm run check:privacy`.

## 6. Aggiornare la data

Dopo aver modificato il curriculum, esegui:

```sh
npm run update-date
```

Il comando aggiorna `last_updated` in `src/content/site.yml` usando la data corrente nel fuso orario Europe/Rome. Il sito e i PDF la mostreranno nel formato corretto per ciascuna lingua.

## 7. Anteprima durante le modifiche

Avvia il server di sviluppo:

```sh
npm run dev
```

Apri l’indirizzo indicato nel terminale, normalmente `http://localhost:4321/curriculum-vitae/`. Le pagine si aggiornano mentre salvi i file. Controlla almeno italiano, inglese, tedesco e una pagina degli annessi.

## 8. Verifica e rigenerazione

Esegui nell’ordine:

```sh
npm run update-date
npm run verify
npm run build
npm run preview
```

`npm run verify` controlla struttura delle traduzioni, riferimenti agli annessi, tipi, dati personali ammessi, accessibilità e layout a 320, 768 e 1440 pixel.

`npm run build` ricrea `dist/`, genera i tre PDF e verifica che contengano nome e data, non includano gli annessi e non superino due pagine.

`npm run preview` mostra esattamente i file di produzione. Verifica manualmente i pulsanti di download e apri tutti e tre i PDF.

## 9. Controllo finale

Prima di pubblicare, conferma che:

- i fatti siano identici nelle tre lingue;
- non compaiano indirizzo, CAP, telefono o data di nascita completa;
- la fotografia sia quella corretta;
- la data dell’ultimo aggiornamento sia corretta;
- i PDF siano leggibili e non contengano annessi;
- la pagina sia utilizzabile sia da telefono sia da desktop.

## 10. Pubblicazione manuale su GitHub Pages

Il progetto include `.github/workflows/deploy.yml`, ma non crea repository remoti e non esegue push autonomamente.

Quando sei soddisfatto del risultato:

1. usa su GitHub il repository pubblico `PaoloRos/curriculum-vitae`;
2. inizializza Git localmente e controlla con attenzione i file da pubblicare;
3. collega il repository remoto, crea il commit ed esegui personalmente il push su `main`;
4. in **Settings → Pages**, scegli **GitHub Actions** come sorgente;
5. attendi il completamento del workflow **Deploy CV site to GitHub Pages**.

Il sito sarà pubblicato in `https://paoloros.github.io/curriculum-vitae/`. Il sottopercorso è configurato in `astro.config.mjs`; non rimuovere `base: "/curriculum-vitae"` finché il nome del repository resta invariato.

Prima del primo `git add`, usa `git status --short --ignored` e verifica che `CV-italiano.pages`, `CV_2-italiano.md` e `CV_2-italiano-assets/` risultino ignorati.

Ogni push successivo su `main` eseguirà nuovamente controlli, build, generazione dei PDF e pubblicazione. Se un controllo fallisce, il sito esistente non viene sostituito.
