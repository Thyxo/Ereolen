# eReolen – e-bogsapp til mentalisme-akt

En PWA (mobil først) med 9 af H.C. Andersens mest kendte eventyr. Den ser ud som en almindelig dansk biblioteks-e-bogsapp og bruges som rekvisit i en mentalisme-akt.

**Mode 1 (bygget): din egen telefon.** Mode 2 (tilskuerens telefon med live performer-side `/p`) kommer senere.

## Effekten (mode 1)

1. Giv tilskueren telefonen. Lad dem gå til **Læs/lyt**, åbne en bog og bladre til en tilfældig side.
2. Bed dem vælge **et langt ord på siden (mindst 10 bogstaver)** og huske det.
3. Bed dem gå tilbage og åbne den bog, hvis titel starter med samme bogstav som ordet.
4. Du kender nu ordet: se titlen, spørg om den, eller brug den skjulte peek (se nedenfor).
5. Kicker (valgfri): tilskueren åbner forordet i bogen. Dér står deres ord.

### Hemmeligheden

Teksterne er omskrevet, så **hver side indeholder præcis de samme 8 lange ord** (10+ bogstaver), flettet diskret ind i eventyret og i ny rækkefølge på hver side. **Alle andre ord har højst 9 bogstaver.** Uanset hvilken side og hvilket langt ord tilskueren vælger, er det ét af de 8.

`scripts/check-pages.mjs` kontrollerer det for hver eneste side, og `build-data.mjs` nægter at bygge, hvis en side bryder reglen.

### De 8 ord, du skal huske

| Bogstav | Bog | Ord (kan stå bøjet på siden) |
|---|---|---|
| F | Fyrtøjet | **Forunderlig** |
| G | Grantræet | **Glædestrålende** |
| K | Klods-Hans | **Kirkeklokke** |
| L | Lille Claus og store Claus | **Lommetørklæde** |
| N | Nattergalen | **Nattevægter** |
| P | Prinsessen paa Ærten | **Pengepung(en)** |
| S | Snedronningen | **Sommerfugl** |
| T | Tommelise | **Tjenestepige** |

*Ole Lukøje* har intet ord – den er god som første bog, tilskueren bladrer i.

### Skjulte funktioner

| Gestus | Hvad sker der |
|---|---|
| **Dobbelttryk på den røde header** (logoet på Forside, titlen på andre sider) | Ordet til den senest åbnede bog vises i lille, svag skrift under logoet/titlen i 1,2 sek. |
| **Dobbelttryk på kortnummeret** på Min side | Ordet vises i stedet for »København« i 1,2 sek. |
| **Dobbelttryk på »x af y«** over slideren i læseren | Ordet vises i stedet for sidetallet i 1,2 sek. |
| **Langt tryk (0,7 sek.) på den røde header** | Slår forord-kickeren til/fra. Når den er slået til, vises en lille rød prik på »Min side«. |
| **Langt tryk (3 sek.) på »Indstillinger«** på Min side | Nulstiller alt: læsefremskridt, bogmærker, kicker og »senest åbnet«. Gør det før hvert show. |

Når kickeren er slået til, får forordet i hver af de 8 bøger et ekstra afsnit:
*»I denne udgave er der ét ord, vi håber, du vil tænke på, mens du læser: »nattevægter«.«*

De 8 bøger er enten ulæste eller færdiglæste, så »Læs« / »Læs igen« altid åbner på forordet.

### Gode råd

- Læg appen på hjemmeskærmen (Safari → Del → Føj til hjemmeskærm). Så har den ingen adresselinje og virker offline.
- Åbn appen én gang med net, før du skal bruge den offline.
- Lånedatoer fornyes automatisk, så de altid ligger i fremtiden.

## Teknik

- Ren HTML/CSS/JS uden byggetrin. Hostes statisk på Vercel.
- Bygget som en app: faste faner (holdes i hukommelsen), undersider glider ind, læseren glider op. Dokumentet scroller aldrig – kun indholdet.
- Læseren viser én skrevet side pr. skærm (deles kun, hvis skriften gøres meget stor). Position og bogmærker gemmes som tegn-position, så de passer efter skift af skrift.
- Logo, faneikoner og læserens ikoner er klippet ud af skærmbilleder af den rigtige app (`icons/ui`).
- Design efter den rigtige eReolen-app: rød header, faner Forside/Søg/Læs/lyt/Min side/Mere, skrifttypen Source Sans 3 (lokalt i `fonts/`).
- Service worker (`sw.js`) cacher alt, så læsningen virker offline.
- Tilstand (fremskridt, bogmærker, indstillinger) gemmes kun i telefonens `localStorage`. Ingen login og ingen tracking.

### Data

| Fil | Indhold |
|---|---|
| `data/books.json` | Titler, sider og tekst (genereres) |
| `data/words.json` | De 8 ord med tilladte bøjningsformer og `minLong` (10) |
| `data/pageSets.json` | For hver side: hvilket ordsæt den hører til (genereres) |
| `content/*.txt` | Kilde: metadata, forord og de omskrevne sider (adskilt af `---`) |
| `content/original/` | De originale tekster fra andersenstories.com |
| `content/arkiv/` | De 8 eventyr, der er taget ud |

### Opdatér tekster og data

```bash
node scripts/check-pages.mjs        # tjekker at alle sider kun har de 8 lange ord
node scripts/build-data.mjs         # bygger books.json og pageSets.json (stopper ved fejl)
```

`build-data.mjs` stopper også, hvis to ord har samme forbogstav, eller hvis et ord ikke har en titel med samme forbogstav.

### Ruter

`/` Forside · `/soeg` Søg · `/liste/:kategori` liste · `/laes-lyt` Læs/lyt (alle lån) · `/min-side` Min side · `/min-side/laan` Lån · `/mere` Mere · `/bog/:id` bogside · `/bog/:id/laes?side=N` læser

## Næste skridt (mode 2)

- `/p` performer-side beskyttet af hemmelig kode, med mørk skærm og store bogstaver.
- 4-cifret sessionskode, realtime via Upstash/Vercel KV (polling hvert sekund). Data slettes efter 24 timer.
- Performer ser bog → side → ordsæt live. Når der åbnes en ny bog, fremhæves ordet med samme forbogstav (metode A).
- Backup-knapper: vælg bogstav manuelt og se antal bogstaver i hvert ord.
- »Skriv i forord«-knap og evt. web push.

Teksterne er ophavsretsfri (H.C. Andersen døde i 1875). Forordene er skrevet til denne app.
