# eReolen – e-bogsapp til mentalisme-akt

En PWA (mobil først) med 17 af H.C. Andersens eventyr. Den ser ud som en almindelig dansk biblioteks-e-bogsapp og bruges som rekvisit i en mentalisme-akt.

**Mode 1 (bygget): din egen telefon.** Mode 2 (tilskuerens telefon med live performer-side `/p`) kommer senere.

## Effekten (mode 1)

1. Giv tilskueren telefonen. Lad dem gå til **Læs/lyt**, åbne en bog og bladre til en tilfældig side.
2. Nederst på hver side står fodnoten **»Gamle ord forklaret«** med 8 ord. Tilskueren vælger ét ord i tankerne.
3. Bed tilskueren gå tilbage til **Læs/lyt** (eller **Min side → Lån**) og åbne den bog, hvis titel starter med samme bogstav som ordet.
4. Du kender nu ordet. Se titlen, spørg om den eller brug den skjulte peek (se nedenfor).
5. Kicker (valgfri): tilskueren åbner forordet i bogen. Dér står deres ord.

### De 8 ord, du skal huske

| Bogstav | Bog | Ord |
|---|---|---|
| B | Bedstemoder | **Bondestue** |
| D | Dyndkongens Datter | **Dragkiste** |
| F | Fyrtøjet | **Forvalter** |
| K | Klods-Hans | **Kakkelovn** |
| L | Lille Claus og store Claus | **Lirekasse** |
| N | Nattergalen | **Nattevægter** |
| R | Rejsekammeraten | **Rendesten** |
| T | Tommelise | **Tjenestepige** |

De samme 8 ord står på alle sider, men i en ny rækkefølge på hver side. Ingen to sider i samme bog har samme rækkefølge.

### Skjulte funktioner

| Gestus | Hvad sker der |
|---|---|
| **Dobbelttryk på den røde header** (logoet på Forside, titlen på andre sider) | Ordet til den senest åbnede bog vises i lille, svag skrift under logoet/titlen i 1,2 sek. |
| **Dobbelttryk på kortnummeret** på Min side | Ordet vises i stedet for »København« i 1,2 sek. |
| **Dobbelttryk på »x af y«** over slideren i læseren | Ordet vises i stedet for sidetallet i 1,2 sek. |
| **Langt tryk (0,7 sek.) på den røde header** | Slår forord-kickeren til/fra. Når den er slået til, vises en lille rød prik på »Min side«. |
| **Langt tryk (3 sek.) på »Indstillinger«** på Min side | Nulstiller alt: læsefremskridt, bogmærker, kicker og »senest åbnet«. Gør det før hvert show. |

Når kickeren er slået til, får forordet i hver af de 8 bøger et ekstra afsnit:
*»Til denne udgave har redaktionen udvalgt ét gammelt ord, som vi håber, du vil tænke på, mens du læser: »Forvalter«.«*

De 8 bøger er enten ulæste eller færdiglæste, så »Læs« / »Læs igen« altid åbner på forordet.

### Gode råd

- Læg appen på hjemmeskærmen (Safari → Del → Føj til hjemmeskærm). Så har den ingen adresselinje og virker offline.
- Åbn appen én gang med net, før du skal bruge den offline.
- Lånedatoer fornyes automatisk, så de altid ligger i fremtiden.

## Teknik

- Ren HTML/CSS/JS uden byggetrin. Hostes statisk på Vercel.
- Bygget som en app: faste faner (holdes i hukommelsen), undersider glider ind, læseren glider op. Dokumentet scroller aldrig – kun indholdet.
- Læseren deler teksten op, så hver side fylder præcis én skærm (afhænger af skriftstørrelse). Position og bogmærker gemmes som tegn-position, så de passer efter skift af skrift.
- Logo, faneikoner og læserens ikoner er klippet ud af skærmbilleder af den rigtige app (`icons/ui`).
- Design efter den rigtige eReolen-app: rød header, faner Forside/Søg/Læs/lyt/Min side/Mere, skrifttypen Source Sans 3 (lokalt i `fonts/`).
- Service worker (`sw.js`) cacher alt, så læsningen virker offline.
- Tilstand (fremskridt, bogmærker, indstillinger) gemmes kun i telefonens `localStorage`. Ingen login og ingen tracking.

### Data

| Fil | Indhold |
|---|---|
| `data/books.json` | Titler, sider og tekst (genereres) |
| `data/words.json` | 4 ordsæt × 8 ord med antal bogstaver og forklaring. `ownModeSet` = sættet til mode 1 |
| `data/pageSets.json` | For hver side: ordsæt (til mode 2) og rækkefølge af de 8 ord (genereres) |
| `content/*.txt` | Kilde: metadata, forord og eventyrtekst |

### Opdatér tekster og data

```bash
python3 scripts/fetch_texts.py      # henter eventyrteksterne fra andersenstories.com til content/
node scripts/build-data.mjs         # bygger books.json og pageSets.json, validerer ordsættene
```

`build-data.mjs` stopper med en fejl, hvis to ord i et sæt har samme forbogstav, eller hvis et ord ikke har en titel med samme forbogstav.

### Ruter

`/` Forside · `/soeg` Søg · `/liste/:kategori` liste · `/laes-lyt` Læs/lyt (alle 17 lån) · `/min-side` Min side · `/min-side/laan` Lån · `/mere` Mere · `/bog/:id` bogside · `/bog/:id/laes?side=N` læser

## Næste skridt (mode 2)

- `/p` performer-side beskyttet af hemmelig kode, med mørk skærm og store bogstaver.
- 4-cifret sessionskode, realtime via Upstash/Vercel KV (polling hvert sekund). Data slettes efter 24 timer.
- Performer ser bog → side → ordsæt live. Når der åbnes en ny bog, fremhæves ordet med samme forbogstav (metode A).
- Backup-knapper: vælg bogstav manuelt og se antal bogstaver i hvert ord.
- »Skriv i forord«-knap og evt. web push.

Teksterne er ophavsretsfri (H.C. Andersen døde i 1875). Forordene er skrevet til denne app.
