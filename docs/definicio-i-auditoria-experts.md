# Document de Definició Funcional, Objectius i Auditoria Multidisciplinària
**Aplicació:** HabitCorp / Cadence ("The Boring Cousin of Habitica")  
**Data:** 29 d'Octubre de 2026  
**Autoria:** Equip d'Anàlisi de Producte, Expert en Coaching, Expert en TDAH i Dissenyador UX/UI

---

## 1. Document de Definició Funcional i Objectius

### 1.1. Visió del Producte
**HabitCorp** (també anomenat *Cadence*) neix com una resposta directa i madura al desgast provocat per les aplicacions de productivitat tradicionals i les eines sobre-gamificades (com *Habitica*). 

Mentre Habitica utilitza una gamificació infantilitzant i punitiva (punts de vida, mort de mascotes virtuals, pèrdua d'or, gremis que jutgen el rendiment), HabitCorp es posiciona com **"The Boring Cousin of Habitica"**: una eina calmada, professional, neta i profundament compassiva. El seu objectiu no és fer-te sentir culpable per tenir un mal dia, sinó oferir una estructura externa sòlida que acompanyi el cervell, especialment en perfils neurodivergents o amb fatiga crònica de productivitat.

---

### 1.2. Objectius i Problemàtiques que Vol Subsanar

| Problema Psicològic / Cognitiu | Com ho aborda l'enfocament d'HabitCorp |
| :--- | :--- |
| **Disfunció Executiva i Paràlisi d'Inici** | Dificultat per arrencar una tasca gran o difusa. S'ofereix desglossament automàtic en micro-passos i mode d'enfocament aïllat en una sola tasca. |
| **Ceguesa Temporal (*Time Blindness*)** | Incapacitat de percebre el pas del temps o calcular quant cap en un dia. S'integra una vista d'agenda que superposa calendaris reals amb blocs lliures disponibles (*Ghost Events*). |
| **Càrrega Cognitiva i Saturació Sensorial** | El soroll visual, els colors estridents i les llistes inacabables generen ansietat i bloqueig. L'estètica és en tons pastís suaus, amb mode Zen per amagar elements completats i filtres plegables. |
| **Espiral de Culpa i Abandó (*What-the-Hell Effect*)** | Quan un usuari falla un dia, les apps punitives trenquen la ratxa i provoquen abandó total per vergonya. HabitCorp ofereix pausa lliure de culpa (*Life Happened*) i triatge sense càstig. |
| **Fluctuació d'Energia (*Spoon Theory*)** | L'energia no és constant cada dia. El sistema permet categoritzar i filtrar tasques segons el cost d'energia/culleres i disposa d'un mode de bateria baixa. |
| **Volatilitat de la Memòria de Treball** | Les idees i tasques fugen si cal omplir formularis complexos. S'integra un calaix de captura ràpida (*Brain Dump*) accessible amb una drecera. |

---

### 1.3. Catàleg Funcional Actual de l'Aplicació

1. **Gestió de Tres Tipologies de Tasques**:
   - **Hàbits (*Habits*)**: Accions recurrents amb comptador positiu (`+`) o negatiu (`-`) per registrar repeticions al llarg del dia sense dates de venciment rígides.
   - **Diàries / Periòdiques (*Dailies*)**: Rutines que es reinicien diàriament o segons patrons de dies determinats (ex. cada dilluns i dijous), mantenint un registre de ratxa (*streak*).
   - **Tasques Úniques (*To-Dos*)**: Tasques puntuals amb suport per a dates límit (*due dates*), prioritats, projectes i llistes de comprovació (*checklists*).

2. **Agenda Integrada i Esdeveniments Fantasma (*Ghost Events*)**:
   - Connexió amb calendaris externs (Google Calendar, CalDAV, iCal).
   - Els esdeveniments externs es mostren com a referència temporal contextual per evitar solapaments.
   - Visualització de blocs d'espai buit disponibles per planificar tasques sense sobrecarregar la jornada.

3. **Eines d'Assistència Neurodivergent (TDAH & Executive Support)**:
   - **Assistent Goblin.tools**: Modal integrat per desglossar automàticament qualsevol tasca intimidant o complexa en 3 a 5 subtasques senzilles i accionables.
   - **Mode Spotlight (Enfocament Singular)**: Pantalla d'aïllament que mostra exclusivament una única tasca seleccionada, amb un cronòmetre associat i botó d'èxit ràpid per eliminar distraccions perifèriques.
   - **Filtre per Teoria de les Culleres (*Spoon Theory*)**:
     - *Trivial* = 1 cullera (blau cel)
     - *Fàcil* = 2 culleres (verd)
     - *Mitjà* = 3 culleres (groc ambre)
     - *Difícil* = 4 culleres (vermell suau)
     - Botó **Bateria Baixa (*Low Battery*)** que filtra a l'instant només les tasques de cost cognitiu mínim.
   - **Pausa Compassiva (*Life Happened Pause*)**: Botó que congela l'estat de les diàries durant 3 dies (o el temps necessari) sense penalitzacions, evitant la vergonya d'haver tingut un imprevist o una crisi de salut mental.
   - **Calaix de Captura Ràpida (*Brain Dump Drawer - Ctrl+K*)**: Calaix lliscant per bolcar qualsevol pensament o tasca emergent sense haver de categoritzar-la ni posar-li etiquetes a l'acte.
   - **Mode Zen (*Modo Zen*)**: Commutador que amaga a l'instant totes les tasques completades, rebaixa el contrast dels elements secundaris i neteja la pantalla de qualsevol soroll innecessari.
   - **Temporitzador Pomodoro Opcional**: Integrat a la interfície, ocult per defecte per evitar generar pressió temporal inconscient.

4. **Arquitectura d'Interfície (Proposta Barra Lateral)**:
   - Barra de navegació lateral esquerra col·lapsable a carril d'icones (`w-16` / `w-64`) per maximitzar l'espai de treball.
   - Calaix de filtres desplegable amb comptador de filtres actius per no ocupar espai vertical constant.
   - Suport multiidioma (Català, Castellà, Anglès).

---

## 2. Avaluació de l'Expert en Coaching de Productivitat i Canvi d'Hàbits

> **Perfil de l'Avaluador:** Coach certificat en canvi de conducta, especialitzat en formació d'hàbits basats en la ciència del comportament (models de James Clear, BJ Fogg i Peter Gollwitzer).

### 2.1. Diagnòstic General
L'aplicació demostra una excel·lent maduresa en rebutjar la dopamina tòxica dels videojocs. L'estil calmat i la inclusió de la pausa *Life Happened* és una de les millors aplicacions de la psicologia de la compassió (*self-compassion*) que he vist en programari de productivitat. No obstant això, des de la perspectiva de la consolidació d'hàbits a llarg termini, l'eina actual és més un **registrador passiu** que un **facilitador actiu de la conducta**.

### 2.2. Funcions Clau que Falten segons el Coaching

1. **Ancoratge d'Hàbits (*Habit Stacking* - BJ Fogg)**:
   - *El problema:* L'usuari veu una llista de diàries com a elements aïllats en el buit. La ciència del comportament demostra que un hàbit nou només arrela si s'ancora a un hàbit ja consolidat.
   - *Funció que falta:* Poder definir relacions de dependència: *"Després de [Prendre el cafè del matí (Hàbit Àncora)], faré [Revisar les prioritats del dia (Hàbit Nou)]"*. L'aplicació hauria de permetre encadenar hàbits en seqüència lògica.

2. **Intencions d'Implementació (*Implementation Intentions* - Peter Gollwitzer)**:
   - *El problema:* Una tasca que només diu *"Fer esport"* o *"Estudiar"* té un 70% més de probabilitat de fracàs.
   - *Funció que falta:* Una estructura guiada opcional *"Si... Aleshores..."* (*"Quan siguin les 18:00 i tanqui el portàtil, aleshores em posaré les sabatilles i caminaré 20 minuts"*). Això redueix la fatiga de decisió en el moment crític.

3. **Retrospectiva Guiada i Debriefing Setmanal Sense Judici**:
   - *El problema:* El coaching no consisteix a mirar si has fet o no una creu, sinó a entendre **què ha passat**. Si una tasca s'ha posposat 5 vegades, no serveix de res seguir-la movent a l'endemà.
   - *Funció que falta:* Un espai setmanal (ex. diumenge a la tarda o dilluns al matí) que pregunti amb calidesa:
     - *"Quin ha estat el teu major triomf aquesta setmana?"*
     - *"Quina tasca s'ha encallat constantment? La volem redimensionar, delegar o eliminar?"*

4. **Connexió amb el Propòsit ("El Perquè" / *Value Alignment*)**:
   - *El problema:* Les tasques desconnectades de valors personals esdevenen obligacions buides.
   - *Funció que falta:* Poder assignar a cada projecte o hàbit un "Propòsit" o "Valor" (ex. *Salut*, *Pau mental*, *Creixement professional*). En moments de baixa motivació, l'eina pot recordar subtilment aquest propòsit.

5. **Celebració Intrínseca i Reconeixement de Micro-victòries**:
   - *El problema:* En eliminar els punts i el so de videojoc d'Habitica, l'acció de completar una tasca que ha costat molt pot quedar excessivament freda.
   - *Funció que falta:* Un micro-reconeixement elegant i subtil (per exemple, un breu resum al final de la tarda: *"Avui has protegit la teva energia completant 3 tasques clau. Bon descans"*).

---

## 3. Avaluació de l'Expert en Neurodivergència i TDAH

> **Perfil de l'Avaluador:** Especialista clínic i consultor en TDAH en adults, funcionament executiu i regulació emocional neurodivergent.

### 3.1. Diagnòstic General
Aquesta aplicació té intuïcions brillants. El desglossament tipus Goblin.tools, el filtre de culleres (*Spoon Theory*) i el mode Spotlight ataquen directament els tres grans monstres del TDAH: la paràlisi per sobrecàrrega, la fatiga energètica i la pèrdua de focus per dispersió.

Tot i així, un cervell amb TDAH té dues característiques fisiològiques fonamentals que l'aplicació encara no resol prou bé: la **ceguesa temporal analògica** (el temps és un concepte abstracte si només són números) i la **dificultat amb les transicions entre tasques**.

### 3.2. Funcions Crítiques que Falten per al TDAH

1. **Temporitzador Visual Analògic (Tipus *Time Timer*)**:
   - *El problema:* Veure els números "25:00... 24:59" en un rellotge digital no activa la percepció del temps d'un adult amb TDAH; només genera angoixa o passa desapercebut.
   - *Funció que falta:* Un temporitzador visual circular de disc de color que es va buidant físicament com un pastís. L'ull humà percep quant temps queda de manera instantània sense processar nombres.

2. **Temps de Transició / Amortidor (*Buffer Time*)**:
   - *El problema:* El cervell amb TDAH no pot saltar a l'acte d'un focus a un altre en el minut zero. Si una reunió acaba a les 11:00 i es programa una tasca a les 11:00, la persona es bloquejarà o es frustrarà.
   - *Funció que falta:* Un mecanisme automàtic que insereixi blocs de "transició/descompressió" de 10-15 minuts entre blocs de tasques a l'agenda, protegint l'usuari de l'esgotament de canvi de context (*task switching cost*).

3. **Captura Ràpida per Veu (Àudio a Text)**:
   - *El problema:* Quan arriba una idea o s'ha d'apuntar una tasca, obrir el teclat, escriure i corregir faltes pot provocar que la idea s'evapori o que es deixi de fer per pura fricció motora.
   - *Funció que falta:* Un botó de micròfon al *Brain Dump* que transcrigui directament la parla a notes o tasques sense haver de tocar el teclat.

4. **Dicotomia Temporal "Ara vs Mai" (*Now vs Not Now*)**:
   - *El problema:* Per al TDAH, només existeixen dues zones temporals: "ARA" i "NO ÉS ARA". Si una pantalla mostra 20 tasques pendents per a la setmana, el cervell les processa totes com si fossin per a aquest mateix segon, provocant col·lapse immediat.
   - *Funció que falta:* Un filtre radical "Només Ara" que amagui completament el 100% del tauler i deixi a la pantalla única i exclusivament la tasca en curs o les 3 d'aquest matí. (El mode Spotlight actual és un bon inici, però ha de poder aplicar-se a tot el flux de treball).

5. **Detecció Proactiva de Bloqueig i Descongelador de Tasques**:
   - *El problema:* Si una tasca porta 4 dies oberta sense canvis, comença a generar culpa acumulada i l'usuari la defuig sistemàticament amb la mirada (*task blindness*).
   - *Funció que falta:* Un assistent compassiu que detecti que una tasca porta més de 72 hores sense tocar-se i proposi amb afecte: *"Aquesta tasca s'ha quedat encallada. Volem que Goblin la trenqui en passos més petits, la canviem a només 1 cullera o la guardem a la nevera per més endavant?"*.

---

## 4. Proposta Conceptual de l'Expert en UX/UI (Disseny a Cegues)

> **Metodologia:** L'expert en Disseny de Producte i UX/UI ha rebut **únicament** la llista de funcions requerides i els objectius cognitius i de TDAH, **sense haver vist cap captura de pantalla ni el codi de la web actual**. A continuació es detalla com resoldria la interfície des de zero.

```
+---------------------------------------------------------------------------------------------------+
|  [Logo Cadence]  | 🟢 Bateria: 3/5 Culleres |  🌤️ Clima: Matí enfocat  | 🔍 Cerca  [➕ Nova Tasca]   |
+---------------------------------------------------------------------------------------------------+
|  BARRA MINIMAL   |  ZONA CENTRAL: EL TEU PRESENT (NOW)                     |  AGENDA & CONTEXT    |
|  (Icones netes)  |  ----------------------------------------------------   |  ------------------  |
|                  |  🎯 EL MEU FOCUS ARA:                                    |  10:00 - 11:00       |
|  [🏠 Avui]       |  +---------------------------------------------------+  |  [Reunió Equip] (ext)|
|  [📥 Inbox]      |  | Preparar informe trimestral          [🥄🥄 2 cul.]|  |  ------------------  |
|  [📅 Setmana]    |  | [▶️ Iniciar Focus 25m (Disc visual)]  [✨ Goblin]  |  |  11:00 - 11:15       |
|  [🧘 Zen]        |  +---------------------------------------------------+  |  ☕ Pausa Transició  |
|  [⏸️ Pausa]      |                                                         |  ------------------  |
|                  |  📋 RUTINES D'AVUI (Dailies)                            |  11:15 - 12:00       |
|  [⚙️ Ajustos]    |  [x] Prendre medicació matí                             |  [Bloc Lliure: 45m]  |
|                  |  [ ] Caminar 15 minuts                                  |  (Arrossega tasca)   |
|                  |                                                         |                      |
|                  |  ⚡ PRÒXIM PAS SUGGERIT:                                 |  [Col·lapsar Agenda] |
|                  |  [ ] Respondre correu a Laura                           |                      |
+---------------------------------------------------------------------------------------------------+
```

### 4.1. Principis de Disseny Fonamentals
1. **L'Embut de Fricció (*Friction Funnel*)**:
   - La pantalla per defecte no pot ser un tauler complex ple de columnes i targetes. Ha de ser un **espai de calma mono-direccional**.
   - Tot allò que no calgui per a les properes 2 hores ha d'estar amagat o plegat per defecte.
2. **Creació de Tasques Progressiva (Zero-Friction Capture)**:
   - Mai obrir un formulari de 8 camps d'entrada al començament.
   - La creació bàsica és un sol camp de text ràpid: `Nom de la tasca` + `Culleres (1-4)`. Tota la resta (dates, projectes, recurrències) s'afegeix opcionalment o mitjançant llenguatge natural.
3. **Indicador Visual d'Energia al Capdamunt**:
   - En lloc de filtres manuals amagats, la capçalera mostra un mesurador clar: *"Com està la teva bateria avui?"*. L'usuari marca 1, 2, 3 o 4 culleres i tota la pantalla s'adapta immediatament per mostrar només el que és viable.

---

## 5. Comparativa Exhaustiva: Web Actual vs. Proposta UX Cega vs. Aportacions Experts

| Dimensió d'Anàlisi | Web Actual (HabitCorp en Producció) | Proposta UX a Cegues | Recomanació Coaching & TDAH | Veredicte & Oportunitat de Millora |
| :--- | :--- | :--- | :--- | :--- |
| **Arquitectura de Pantalla** | Model clàssic de 3 columnes en paral·lel (Hàbits, Diàries, Tasques) + Agenda a la dreta. | Model "Present / Now" centralitzat amb taulers secundaris sota demanda. | La visualització simultània de 3 llistes pot dispersar el TDAH; cal prioritzar la tasca activa. | **Excel·lent en visió global**, però cal potenciar la vista d'enfocament únic sense obligar a veure tot el backlog. |
| **Navegació i Menús** | Barra lateral plegable moderna (Proposta 2: Barra Lateral) amb carril d'icones (`w-16`). | Barra lateral ultra-compacta amb accés ràpid per icones netes. | La barra lateral actual és un gran encert respecte a les propostes anteriors flotants. | **Molt alineat**. La decisió d'adoptar la Proposta 2 ha estat correcta i professional. |
| **Captura de Tasques** | Modal complet (`TaskModal`) amb moltes opcions (Tipus, Títol, Projecte, Dates, Culleres, Checklists). | Micro-captura d'1 sol camp en línia + calaix ràpid. | Un modal dens genera fricció d'inici; per a un TDAH pot significar no apuntar la tasca. | **Punt feble actual**: Convé afegir creació ràpida en una línia directa sense passar pel gran modal. |
| **Gestió de l'Energia (Spoons)** | Selector de 4 colors/culleres + botó "Bateria Baixa" al calaix de filtres. | Selector d'estat d'ànim/energia destacat directament a la capçalera principal. | Excel·lent implementació a la web actual; ajuda a normalitzar que no cada dia rendim al 100%. | **Punt fort actual**. El sistema de culleres amb colors i icones funciona i està ben integrat. |
| **Percepció del Temps (Timer)** | Pomodoro clàssic amb minuts digitals ("25:00"), ocult per defecte. | Temporitzador analògic amb sector visual de degradació tipus *Time Timer*. | Els minuts digitals no ajuden a la ceguesa temporal; cal representació espacial/circular. | **Oportunitat de millora**: Afegir un mode gràfic de disc visual al Pomodoro actual. |
| **Amortiment i Transicions** | L'agenda mostra blocs continus sense espais protegits. | Blocs de descans de 10-15 minuts inserits automàticament entre tasques. | El cost de canvi de tasca (*switching cost*) col·lapsa la funció executiva si no hi ha pausa. | **Innovació recomanada**: Implementar opció de *buffer* automàtic a l'AgendaView. |
| **Desglossament de Tasques** | Eina Goblin.tools integrada que desglossa en passos amb un sol clic. | Assistent d'intel·ligència artificial o descomposició automàtica. | És una de les millors eines per desbloquejar la paràlisi per anàlisi. | **Punt molt fort de la web actual**. Està perfectament resolt i és d'altíssim valor. |
| **Espiral de Culpa i Pausa** | Botó "Life Happened" que pausa el deute de diàries durant 3 dies. | Mode "Standby / Recuperació" que congela mètriques sense avisos en vermell. | Fonamental per evitar el *what-the-hell effect* de James Clear. | **Punt molt fort de la web actual**. És una característica diferencial i pionera. |

---

## 6. Full de Ruta d'Accions Prioritzades (Roadmap)

### Fase 1: Canvis Immediats (Quick Wins de Baix Esforç)
1. **Temporitzador Visual al Pomodoro**: Substituir o complementar el comptador numèric `25:00` per un anell circular progressiu tipus *Time Timer* (SVG senzill) a `PomodoroTimer.tsx`.
2. **Entrada de Captura Ràpida d'1 Línia**: Afegir a dalt de les columnes un camp senzill `[+ Escriu una tasca i prem Enter]` que assigni per defecte 2 culleres, evitant obrir el gran `TaskModal` per a coses ràpides.
3. **Buffer de Transició Visual a l'Agenda**: Mostrar una petita separació de 10 minuts amb fons de ratlles suaus entre esdeveniments consecutius a `AgendaView.tsx`.

### Fase 2: Millores de Comportament i Coaching (Mig Termini)
1. **Model d'Ancoratge d'Hàbits (*Habit Stacking*)**: Afegir un camp opcional a les diàries: *"Fer després de: [Seleccionar un altre hàbit]"*, mostrant-los agrupats visualment en cadena.
2. **Assistent de Tasques Encallades**: Si una tasca té més de 3 dies d'antiguitat a To-Dos sense completar-se, mostrar una petita icona de bombeta que ofereixi enviar-la a Goblin.tools o posposar-la sense vergonya.
3. **Retrospectiva de Divendres / Diumenge**: Un petit resum setmanal de només lectura que destaqui la constància i les tasques resoltes amb èxit, sense judici sobre allò no fet.

### Fase 3: Millores Avançades (Llarg Termini)
1. **Captura per Veu al Brain Dump**: Integració de la Web Speech API per dictar notes i tasques ràpides directament des del mòbil o escriptori.
2. **Clima d'Energia Matinal**: Una pregunta breu en obrir l'app al matí (*"Quin nivell d'energia tens avui?"*) que activi automàticament el filtre de culleres corresponent.
