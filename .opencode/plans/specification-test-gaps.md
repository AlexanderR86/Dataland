# Specifications: Testlücken und parallele Bearbeitung

## Stand und Umfang

- Ausgangsbasis: `feature/specification-docs-tab` bei `c08c3b92e`.
- Umfang: bereits implementierte Specifications-Funktionen bis einschließlich Schritt 11b.
- Befunde stammen aus dem Lesen von Code und Assertions, nicht aus einer gemessenen Coverage-Quote.
- Schritt 0 ist erledigt: Dieses Arbeitsdokument wurde angelegt. Schritte 1–4 wurden noch nicht begonnen.
- UC-7 bleibt in diesem Durchlauf ausdrücklich offen. Drei Implementierungsagenten bearbeiten UC-1–UC-6.
- Die Statuspflege übernimmt ausschließlich der Koordinator.

## Verbindliche Regeln

- Zuerst `AGENTS.md`, `dataland-frontend/AGENTS.md`, `dataland-frontend/src/api-queries/AGENTS.md` und den Skill `create-cypress-test` lesen.
- Aktuellen Git-Stand mit der Ausgangsbasis vergleichen. Vorhandene Nutzeränderungen erhalten.
- Im Repo-Root bleiben. Ausschließlich relative Pfade in Shell-, Prüfungs- und Build-Befehlen; kein `cd`, keine absoluten Logpfade. Dateien mit Read, Grep, Glob und den Editierwerkzeugen bearbeiten.
- Tests über reale Komponenten und `cy.intercept` schreiben; Hooks nicht mocken. Stabile Selektoren und retryfähige Assertions nutzen, keine festen Wartezeiten.
- Generierte Clients, OpenAPI-Dateien und Frameworkkonfigurationen nicht von Hand ändern.
- Implementierungsagenten ändern ausschließlich die ihnen zugewiesenen Dateien. Keine Git-Schreiboperationen, keine Konfigurationsänderungen, keine Produktionscodeänderungen.
- Bei Produktfehlern oder notwendigem Zusatzumfang: Befund mit Reproduktion an den Koordinator melden, keine Tests abschwächen.
- Gemeinsame Mocks gehören ausschließlich dem Koordinator. Weitere Mockwünsche werden gemeldet; keine konkurrierenden Änderungen.
- Cypress-Ausführung zentral und nacheinander koordinieren. Keine parallelen Cypress-Prozesse im gemeinsamen Checkout. Umfangreiche Befehlsausgaben gemäß `AGENTS.md` an `command-summarizer` delegieren.

## Use Cases

| ID | Verhalten | Priorität | Bearbeitung | Status |
| --- | --- | --- | --- | --- |
| UC-1 | Feldlinks mit echter Frameworkkonfiguration | Hoch | Agent A | Erledigt; gezielter Cypress-Lauf bestanden |
| UC-2 | Wechsel zwischen zwei dokumentierten Frameworks | Hoch | Agent A | Erledigt; verzögerte PCAF-Antwort und Frameworkwechsel geprüft |
| UC-3 | Basistyp- und Schemafehler mit Wiederherstellung | Mittel | Agent C | Erledigt; Retry- und Teilfehlerfälle bestanden |
| UC-4 | Expliziter Feldpfad bei mehrfacher Typ-ID | Mittel | Agent A (UI), Agent B (Util) | Erledigt; UI- und Utilfälle bestanden |
| UC-5 | Frameworkliste für Feldlinks nicht verfügbar | Mittel | Agent A | Erledigt; leer, Fehler, verzögert und Freigabe geprüft |
| UC-6 | Abhängige Detailanfragen und Ladezustände | Mittel | Agent C | Erledigt; abhängige Anfragen und Ladezustände bestanden |
| UC-7 | Nutzerweg aus My Datasets bis zur Dokumentation | Mittel | Koordinator | Erledigt; E2E-Journey 4/4 bestanden |

### UC-1: Feldlinks mit echter Frameworkkonfiguration

- Testdatei: `dataland-frontend/tests/component/components/resources/dataTable/MultiLayerDataTableSpecificationLinks.cy.ts`.
- Kontext: `dataland-frontend/src/frameworks/pcaf/ViewConfig.ts`, `dataland-frontend/src/components/resources/specifications/SpecificationDataTable.vue` und `dataland-frontend/src/components/resources/frameworkDataSearch/frameworkPanel/MultiLayerDataTableFrameworkPanel.vue`.
- Vorhanden: künstliche Tabellenkonfiguration mit passender Typ-ID, richtigem Link, neuem Tab und bedienbaren Abschnitten.
- Ziel: Eine unveränderte echte View-Konfiguration zusammen mit einem realistischen Schema und passenden Datasetdaten verwenden. Bestehende Framework-Testfixtures nach Möglichkeit wiederverwenden.
- Akzeptanz: Ein bekanntes Feld erhält Framework-ID und exakten Schema-Pfad; ein nicht dokumentiertes Feld erhält kein Icon; Datasetwerte bleiben sichtbar. Die tatsächliche Einbindung des Wrappers im Frameworkpanel möglichst mitprüfen, statt ausschließlich dessen isoliertes Verhalten zu duplizieren.

### UC-2: Wechsel zwischen dokumentierten Frameworks

- Testdatei: `dataland-frontend/tests/component/components/resources/dataTable/MultiLayerDataTableSpecificationLinks.cy.ts`.
- Kontext: `dataland-frontend/src/utils/specifications/useSpecificationFieldLinks.ts`.
- Vorhanden: PCAF → LKSG entfernt Links und fragt kein unbekanntes Schema ab.
- Akzeptanz: Zwischen zwei dokumentierten Frameworks wechseln; zweite Schemaantwort kontrolliert zurückhalten. Währenddessen keine alten Links anzeigen. Nach Freigabe müssen Framework-ID und Pfad zum zweiten Framework gehören. Verspätete Antworten des ersten Frameworks dürfen keine alten Links zurückbringen. Datasetwerte bleiben verfügbar.

### UC-3: Basistyp- und Schemafehler mit Wiederherstellung

- Testdatei: `dataland-frontend/tests/component/components/resources/specifications/SpecificationDataPointDetail.cy.ts`.
- Kontext: `dataland-frontend/src/components/resources/specifications/SpecificationBaseTypeDetail.vue`.
- Vorhanden: erfolgreicher Schema-/Beispielabruf, Datenpunkttyp-Retry und Anzeige eines Basistypfehlers.
- Akzeptanz: `resolved-schema` schlägt fehl; Schema-Panel öffnen, Fehler und Retry prüfen, Antwort korrigieren, Schema erscheint. Fehlender Feldpfad zeigt den vorgesehenen Hinweis. Separat Basistypfehler durch Retry beheben. Die übergeordnete Datenpunktdokumentation bleibt bei Teilfehlern sichtbar.

### UC-4: Expliziter Feldpfad bei mehrfacher Typ-ID

- Utiltest: `dataland-frontend/tests/component/components/resources/specifications/SpecificationLinkUtils.cy.ts` (Agent B).
- UI-Test: `dataland-frontend/tests/component/components/resources/dataTable/MultiLayerDataTableSpecificationLinks.cy.ts` (Agent A).
- Kontext: `dataland-frontend/src/utils/specifications/SpecificationLinkUtils.ts` und `dataland-frontend/src/components/resources/dataTable/conversion/MultiLayerDataTableFieldConverter.ts`.
- Vorhanden: Util löst einen expliziten Pfad auf; UI lässt Links bei mehrdeutiger ID ohne Pfad weg.
- Akzeptanz UI: Bei zwei Vorkommen derselben Typ-ID führt ein gültiger expliziter `fieldPath` exakt zum gewünschten Vorkommen. Ein falscher expliziter Pfad bleibt ohne Icon.
- Akzeptanz Util: Bestehende Assertions nicht duplizieren. Ergänzen, dass ein expliziter Pfad mit anderer Typ-ID nicht akzeptiert wird und ein falscher expliziter Pfad auch bei ansonsten eindeutiger Typ-ID keinen Fallback erzeugt. Den irreführenden Testtitel zu unterschiedlichen Pfadtiefen durch echte Fälle mit unterschiedlichen Tiefen absichern.

### UC-5: Frameworkliste für Feldlinks nicht verfügbar

- Testdatei: `dataland-frontend/tests/component/components/resources/dataTable/MultiLayerDataTableSpecificationLinks.cy.ts`.
- Vorhanden: Entsprechende Zustände sind für Frameworklinks in My Datasets geprüft, nicht für den Feldlink-Wrapper.
- Akzeptanz: Leere, fehlgeschlagene und kontrolliert verzögerte Frameworkliste prüfen. Tabelle bleibt sichtbar und bedienbar; ohne passenden Listeneintrag erfolgt keine Schemaanfrage und es gibt kein Icon. Nach erfolgreicher Freigabe einer passenden Liste wird das Schema geladen und der Link erscheint.

### UC-6: Abhängige Detailanfragen und Ladezustände

- Testdatei: `dataland-frontend/tests/component/components/resources/specifications/SpecificationDataPointDetail.cy.ts`.
- Vorhanden: Nacheinander ausgeführte `cy.wait` sowie ausbleibende Basistypanfrage nach Datenpunkttypfehler.
- Akzeptanz: Datenpunkttypantwort kontrolliert zurückhalten; Ladezustand und bis dahin ausbleibende Basistypanfrage nachweisen. Erst nach Freigabe muss die Folgeanfrage mit der gelieferten Basistyp-ID erfolgen. Basistypantwort ebenfalls kontrollieren und dessen Ladezustand sowie anschließende Dokumentation prüfen.

### UC-7: Nutzerweg aus My Datasets (zurückgestellt)

- Spätere Testdatei: `dataland-frontend/tests/e2e/specs/user-experience/SpecificationsJourney.ts`.
- Vorhanden: Einstieg über Specifications-Tab, Suche nach Name/ID und Reload.
- Ziel: Mit echten Services von einem eigenen Dataset über Frameworklink beziehungsweise Feldlink zur richtigen Dokumentation navigieren. Feldlinkziel im selben Cypress-Tab prüfen, wenn nötig, und zusätzlich `target="_blank"` nachweisen.
- Voraussetzung: Laufende lokale Dienste, Login und geeignetes eigenes Dataset. Keine ungefragte Prepopulation oder Datenbank-Resets.
- Dieser Use Case ist nicht Teil der drei parallelen Implementierungsaufträge und darf nicht als abgeschlossen markiert werden.

## Schritt 1: Vorbereitung durch den Koordinator

1. Regeln, Skill, Git-Stand und aktuelle Tests lesen; Basisabweichungen berücksichtigen.
2. Ausschließlich der Koordinator erweitert bei Bedarf `dataland-frontend/tests/component/testUtils/SpecificationMocks.ts`.
3. Ein zweites dokumentiertes Framework mit eigener ID und eigenen Schema-Pfaden vorbereiten; für Wechseltests kann eine gemeinsame Typ-ID an unterschiedlichen Pfaden vorkommen. Bestehende Exporte erhalten.
4. Realistische Daten für UC-1 aus vorhandenen Frameworkfixtures nutzen. Fehler und verzögerte Antworten im jeweiligen Test steuern; keine unnötigen globalen Mocks ergänzen.
5. Benötigte Schema-, Basistyp- und Mehrdeutigkeitsmocks bereitstellen, soweit nicht bereits vorhanden. Danach Mockdatei für die drei Agenten einfrieren.

## Schritt 2: Drei Agenten parallel starten

Drei `general`-Subagenten in einer Nachricht starten. Jeder erhält dieses Dokument, seine Use Cases, die exklusiven Schreibrechte und die relevanten Skill-/AGENTS-Regeln ausdrücklich im Auftrag. Keine eigene Modellkonfiguration anlegen.

| Agent | Auftrag | Exklusive Schreibrechte |
| --- | --- | --- |
| A | UC-1, UC-2, UC-4 UI, UC-5 | `dataland-frontend/tests/component/components/resources/dataTable/MultiLayerDataTableSpecificationLinks.cy.ts` |
| B | UC-4 Util und die dort beschriebenen Pfadtiefen-/Negativfälle | `dataland-frontend/tests/component/components/resources/specifications/SpecificationLinkUtils.cy.ts` |
| C | UC-3, UC-6 | `dataland-frontend/tests/component/components/resources/specifications/SpecificationDataPointDetail.cy.ts` |

Die Agenten implementieren und liefern: bearbeitete Fälle, Dateien, zusätzliche Mockwünsche, offene Befunde und Testempfehlungen. Tests werden anschließend zentral ausgeführt, damit gemeinsame Cypress-Artefakte nicht kollidieren. Agent B hat bewusst den kleineren, klar abgegrenzten Utilauftrag.

## Schritt 3: Zentrale Verifikation und Review

Gezielte Specs einmal gemeinsam ausführen:

```bash
npm --prefix ./dataland-frontend run testcomponent -- --spec "tests/component/components/resources/dataTable/MultiLayerDataTableSpecificationLinks.cy.ts,tests/component/components/resources/specifications/SpecificationLinkUtils.cy.ts,tests/component/components/resources/specifications/SpecificationDataPointDetail.cy.ts"
```

Statische Checks (alle vom Repo-Root):

```bash
npm --prefix ./dataland-frontend run typecheck
npm --prefix ./dataland-frontend run lintci
npm --prefix ./dataland-frontend run formatci
npm --prefix ./dataland-frontend run checkdependencies
npm --prefix ./dataland-frontend run checkcypresscompilation
git diff --check
```

- Umfangreiche Befehle über `command-summarizer`, mit denselben relativen Pfadregeln.
- Anschließend `review`-Agent mit lesendem Auftrag über den vollständigen Diff. Konkrete Befunde beheben und nur betroffene Checks wiederholen.
- Koordinator aktualisiert die UC-Status anhand tatsächlich nachgewiesener Ergebnisse; Testzahlen und verbleibende Lücken festhalten. Keine historischen Erfolge als neue Läufe ausgeben.

## Schritt 4: Thematische Commits und Fork-Push

Nur ausführen, wenn der neue Sitzungsauftrag Commit und Push ausdrücklich autorisiert.

- Vor Commit: `git status --short`, `git diff`, `git log --oneline -10` prüfen.
- Themen getrennt committen (Linkintegrationstests, Utiltests, Detailtests; Mockänderungen passend zuordnen). Je Commit eigener Aufruf, nur beabsichtigte Dateien stagen.
- Dieses Planungsdokument darf mit seinem Ergebnisstand aufgenommen werden. Den bereits unversionierten Ordner `.opencode/skills/agentic_coding_training/` nicht pauschal hinzufügen.
- Direkt vor Push `git remote get-url fork` prüfen: erwartet wird `https://github.com/AlexanderR86/Dataland`.
- Ausschließlich auf `fork/feature/specification-docs-tab` pushen, niemals auf `origin`; kein Force-Push.
- Remote-Commit verifizieren, abschließend `git status --short` und `git diff --stat` berichten.

## Ergebnisprotokoll (vom Koordinator zu ergänzen)

- Schritt 1: Erledigt; SFDR-Mock mit abweichenden Feldpfaden ergänzt, PCAF-Mock an die echte PCAF-ViewConfig angepasst.
- Schritt 2: Erledigt; drei general-Agenten parallel mit exklusiven Dateibereichen gestartet.
- Schritt 3: Erledigt; gezielte 3 Specs / 28 Tests bestanden; typecheck, lintci, formatci, checkdependencies, checkcypresscompilation und `git diff --check` erfolgreich; Review ohne offene Findings.
- Schritt 4: Commits und Push ausdrücklich autorisiert; Umsetzung läuft.
- UC-7: Erledigt. Zwei neue E2E-Tests in `dataland-frontend/tests/e2e/specs/user-experience/SpecificationsJourney.ts` (eigenes per API hochgeladenes PCAF-Dataset des Admins: Frameworklink ohne Zeilenklick; VIEW, Feldlink mit `target="_blank"`/`rel`, Ziel im selben Tab). Lauf gegen die lokale Umgebung: 4 passing, 0 failing; typecheck, lintci, formatci, checkdependencies, checkcypresscompilation, `git diff --check` erfolgreich.

### Verifikation dieses Durchlaufs

- Gezielter Cypress-Aufruf (Repo-Root): `npm --prefix ./dataland-frontend run testcomponent -- --spec "tests/component/components/resources/dataTable/MultiLayerDataTableSpecificationLinks.cy.ts,tests/component/components/resources/specifications/SpecificationLinkUtils.cy.ts,tests/component/components/resources/specifications/SpecificationDataPointDetail.cy.ts"` — 3 Specs, 28 Tests bestanden, 0 fehlgeschlagen, 0 pending, 0 skipped.
- Statische Checks (alle erfolgreich): `typecheck`, `lintci`, `formatci`, `checkdependencies`, `checkcypresscompilation`, `git diff --check`.
- Review: anfänglicher inkonsistenter `usedBy`-Mock korrigiert; zweites Review ohne offene Findings.
- Außerplanmäßiger erster Cypress-Aufruf ohne `--spec` startete 115 Specs (692/693 Tests bestanden); die verbleibende UC-2-Testtiming-Ursache wurde korrigiert und die drei vorgesehenen Specs anschließend gezielt grün ausgeführt.
