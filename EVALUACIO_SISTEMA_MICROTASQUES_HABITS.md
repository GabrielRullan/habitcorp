# AVALUACIÓ MULTIDIMENSIONAL DE COMPLEXITAT: SISTEMA DE MICROTASQUES EN HÀBITS

**Projecte**: Cadence (The Boring Cousin of Habitica)  
**Autor**: Equip d'Enginyeria, Arquitectura i Ergonomia Cognitiva  
**Data d'avaluació**: 30 d'octubre de 2026  
**Estat**: Document de Decisió Tècnica i Estratègica Prèvia a la Implementació  
**Objectiu**: Avaluar si la integració d'un sistema de microtasques associades a hàbits (amb injecció diària al flux de treball i sincronització bidireccional) afegeix una complexitat considerable des dels punts de vista de Coach (Psicologia de l'hàbit), Cognitiu (TDAH / Neurodivergència), UX (Usabilitat i Interfície) i Backend (Arquitectura i Persistència), identificant riscos, compromisos i proposant alternatives més simples per a la presa de decisions.

---

## 1. Resum Executiu

La proposta d'incorporar un **sistema de microtasques als hàbits basat en injecció diària i sincronització bidireccional** s'ha sotmès a una anàlisi exhaustiva a través de quatre dimensions independents: psicologia de l'hàbit i coaching, ergonomia cognitiva per a perfils neurodivergents (TDAH), disseny d'interfície d'usuari (UX), i enginyeria de programari / arquitectura de dades.

El veredicte unànime d'aquesta avaluació multidimensional és **DESFAVORABLE**: la proposta constitueix un **anti-patró crític de comportament, cognició i arquitectura** per a Cadence.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             EL DILEMA DE CADENCE                                 │
├────────────────────────────────────────┬─────────────────────────────────────────┤
│    VISIÓ FUNDACIONAL DE CADENCE        │      PROPOSTA DE MICROTASQUES AMB       │
│  "The Boring Cousin of Habitica"       │        INJECCIÓ I SYNC BIDIRECCIONAL    │
├────────────────────────────────────────┼─────────────────────────────────────────┤
│ • Calma, compassió, baixa fricció.     │ • Burocràcia de microgestió diària.     │
│ • Dissenyat per a fatiga executiva.    │ • Proliferació de 25-35 tasques/matí.   │
│ • Hàbits automàtics i identitaris.     │ • De-chunking: reverteix automatisme.   │
│ • FocusNowVision: 1 tasca + 2 pròxims. │ • Col·lapse del túnel de focus TDAH.    │
│ • Persistència neta SQLite + offline.  │ • Condicions de cursa i bucles cascada. │
└────────────────────────────────────────┴─────────────────────────────────────────┘
```

Mentre que la intenció superficial de la funcionalitat és facilitar l'acció desglossant grans hàbits en passos assolibles, la seva formalització com a **tasques injectades diàriament a la cua de tasques pendents amb sincronització d'estats d'anada i tornada**:

1. **Reverteix el procés neurobiològic de formació d'hàbits (*De-chunking*)**: Força el cervell a transferir l'automatisme dels ganglis basals de tornada al còrtex prefrontal, convertint un ritual compassiu en una llista de tasques transaccionals feixugues.
2. **Condemna la "Prova del Mal Dia" (*The Bad Day Test*)**: En dies de baixa energia executiva (1 cullera / spoon), un usuari amb 7 hàbits diaris es desperta amb 28-35 noves tasques pendents, desencadenant paràlisi per anàlisi, ansietat de deute de tasques (*task-debt panic*) i l'efecte de deserció *What-the-Hell*.
3. **Destrueix el model ergonòmic de `FocusNowVision`**: L'embut de concentració (limitat estrictament a 1 tasca en focus i un màxim de 2 pròxims passos) queda segrestat per micro-passos rutinaris menors (p. ex., "posar-se les sabatilles"), amagant els projectes i objectius reals per fallada de permanència de l'objecte (*out of sight, out of mind*).
4. **Introdueix una complexitat d'enginyeria desproporcionada**: Condicions de cursa en concurrència REST, bucles infinits de cascada en actualitzacions d'estat, ambigüitat destructiva en el desmarcatge (*unchecking*), i l'obligació de replicar un motor transaccional complet a `clientStore.ts` per al mode local-first / offline.

Com a resultat d'aquesta avaluació, **es recomana no implementar el sistema d'injecció diària i sincronització bidireccional**, i adoptar en el seu lloc les alternatives lleugeres que ja tenen fonaments al propi codi de Cadence, especialment el **Micro-Habit Starter Step (Floor Habit)** i les **subtasques col·lapsables encapsulades sense injecció**.

---

## 2. Taula Resum de Veredictes per Dimensió

| Dimensió d'Avaluació | Requisit | Grau de Complexitat / Risc | Impacte Principal Detectat | Veredicte Executiu |
| :--- | :---: | :---: | :--- | :---: |
| **Coach & Psicologia de l'Hàbit** | **R1** | **CRÍTIC** | Reverteix la consolidació de rutines (*de-chunking*); destrueix l'adherència en dies dolents (*Bad Day Test*); activa l'efecte *What-the-Hell*. | **DESFAVORABLE** (Risc sever d'abandonament de l'hàbit) |
| **Cognitiva & TDAH** | **R2** | **CRÍTIC** | Paràlisi per anàlisi per allau matinal (28+ microtasques); fallada de permanència de l'objecte; col·lapse de l'embut de `FocusNowVision`. | **DESFAVORABLE** (Incompatible amb l'ergonomia TDAH) |
| **UX & Usabilitat** | **R3** | **ALT** | Ruptura del model mental (hàbit cíclic vs tasca lineal); sobresaturació de controls a les targetes; distorsió temporal de l'AgendaView (mínim 15 min). | **DESFAVORABLE** (Fricció i soroll visual inacceptables) |
| **Backend & Arquitectura** | **R4** | **ALT / CRÍTIC** | Discordança del model `tasks` (comptadors vs binari); bucles de sync en cascada; absència de cron/timezones en rollover lazy; impost del Dual-Mode `clientStore`. | **DESFAVORABLE** (Alta fragilitat i risc de regressions) |

---

## 3. Dimensió 1: Perspectiva de Coach i Psicologia de l'Hàbit (R1)

### 3.1. Fonaments Neurobiològics: El Bucle de l'Hàbit i el *Behavioral Chunking*

La neurobiologia de la conducta (Ann Graybiel, MIT; Charles Duhigg; Wendy Wood) demostra que l'objectiu adaptatiu del cervell humà en desenvolupar un hàbit és **minimitzar l'esforç cognitiu**. Quan una conducta s'inicia per primer cop, requereix una deliberació intensa i un consum elevat de glucosa al **còrtex prefrontal** (responsable de la funció executiva, presa de decisions i atenció sostinguda). A mesura que la seqüència es repeteix davant un mateix senyal i obté una recompensa, el control neural es desplaça cap als **ganglis basals**, l'estructura subcortical que governa les respostes automàtiques i procedimentals.

Aquest traspàs s'aconsegueix mitjançant el mecanisme conegut com a **empaquetament conductual (*behavioral chunking*)**: el cervell unifica una successió complexa de micro-accions en una única unitat d'execució consolidada. Per exemple, la rutina de "prendre el cafè i meditar" comença sent una dotzena de decisions conscients, però amb el temps es converteix en un sol bloc procedimental que s'executa sense deliberació.

#### El Fatal Perill del *De-chunking*
La proposta d'injectar microtasques individuals associades a un hàbit diari obliga a l'usuari a marcar caselles independents per a cada fragment del ritual (p. ex., per a la meditació: `[ ] Preparar coixí`, `[ ] Posar temporitzador`, `[ ] Seure en silenci`, `[ ] Registrar sessió`). 

Des del punt de vista neuroconductual, això produeix un **de-chunking artificial**:
- Talla l'automatisme procedimental consolidat als ganglis basals.
- Arrossega la rutina de tornada al còrtex prefrontal per a la seva validació administrativa.
- Transforma un ritual fluid en un procés burocràtic que requereix energia executiva. En lloc d'afavorir la consolidació de l'hàbit, **alenteix i perjudica la seva automatització**.

```
PROCESSIÓ NATURAL D'UN HÀBIT:
[Senyal contextual] ──> [Ganglis Basals: Execució en Bloc Automatitzada] ──> [Recompensa / Identitat]
                                      ▲
                                      │ (La microgestió trenca el bloc)
PROPOSTA DE MICROTASQUES:             │
[Senyal] ──> [Còrtex Prefrontal: 4 decisions conscients + 4 clics administratius] ──> [Fatiga mental]
```

### 3.2. James Clear (*Atomic Habits*): Hàbits Basats en la Identitat vs Checklists Transaccionals

A l'obra de referència *Atomic Habits*, James Clear estableix una distinció fonamental entre tres nivells de canvi de comportament:
1. **Canvi de resultats** (allò que s'aconsegueix).
2. **Canvi de processos** (allò que es fa).
3. **Canvi d'identitat** (allò en què es creu).

Clear subratlla que el canvi durador només ocorre quan la conducta s'arrela en la identitat: *"Cada acció que fas és un vot pel tipus de persona que vols esdevenir."* Quan un usuari marca un hàbit diari a Cadence (com ara "Escriure 25 minuts"), està dipositant un **vot d'identitat unificat**: *"Soc un escriptor"*. Aquest acte proporciona una recompensa intrínseca i reforça l'autoimatge.

En contrast, descompondre l'hàbit en microtasques injectades transforma el marc mental de l'usuari d'un **vot d'identitat** a una **transacció burocràtica**:
- L'usuari ja no es pregunta *"Soc la classe de persona que prioritza la salut?"*, sinó *"He completat el requisit 3 d'un formulari de 4 tasques avui?"*.
- Es perd la càrrega emocional positiva del vot unificat i s'imposa un sentiment d'auditoria constant.

#### Violació de la 3a Llei: "Fer-ho Fàcil" (*Make It Easy*)
Clear formula la **Regla dels 2 Minuts**: quan s'inicia un nou hàbit, el pas d'entrada ha de durar menys de dos minuts per reduir la fricció d'activació. L'objectiu és estandarditzar el fet de "presentar-se" abans d'optimitzar el procés.
Injectar múltiples microtasques produeix l'efecte diametralment oposat: infla la fricció percebuda. L'usuari no percep una entrada suau de dos minuts, sinó una barrera de múltiples passos que s'acumulen a la seva llista de deures diaris.

#### Violació de la 4a Llei: "Fer-ho Satisfactori" (*Make It Satisfying*)
El tancament d'un hàbit necessita una recompensa dopamínica clara i immediata. Un hàbit amb un sol botó proporciona un bucle net: acció feta, reforç visual, tancament mental. Si l'hàbit depèn de múltiples subtasques, un pas incomplet deixa la recompensa en suspens, activant una sensació d'inquietud i deute pendent (**efecte Zeigarnik**) en lloc de satisfacció.

### 3.3. BJ Fogg (*Tiny Habits*, $B = MAP$) i la Confusió del "Starter Step"

El Dr. BJ Fogg (Stanford Behavior Design Lab) estableix que el comportament humà ocorre quan coincideixen tres elements: **Motivació (M)**, **Habilitat / Facilitat (A)** i **Activador / Senyal (P)**:

$$\text{Comportament} = M \times A \times P$$

Quan l'energia i la motivació cauen (com ocorre de manera inevitable en qualsevol ésser humà), l'acció només es mantindrà si l'**Habilitat és extremadament alta**, és a dir, si l'acció és tan ridículament senzilla que no requereix cap força de voluntat.

#### L'error de traduir "Tiny Habits" com a "Llistes de Microtasques"
Existeix un greu equívoc de disseny en confondre un *Tiny Habit* amb una *Work Breakdown Structure* (WBS) o llista de microtasques d'enginyeria:
- Fogg **mai** recomana crear un checklist de 5 passos per utilitzar el fil dental (`[ ] Comprar fil`, `[ ] Tallar 30 cm`, `[ ] Enrotllar als dits`, `[ ] Passar pel primer queixal`, `[ ] Llençar-lo`). Això és sobre-enginyeria burocràtica.
- Fogg proposa el **Starter Step (Pas Mínim Viable)**: *"Passar el fil dental per una sola dent."* Un cop vençuda la inèrcia d'inici, l'impuls natural sol encarregar-se de la resta. Però el requisit per a la victòria és únic i mínim.

Crear múltiples microtasques injectades fragmenta el senyal activador ($P$) i redueix l'habilitat ($A$), augmentant la fricció global de la rutina.

### 3.4. La Prova del Mal Dia (*The Bad Day Test*)

La solidesa d'un sistema de formació d'hàbits no s'ha d'avaluar durant un dilluns al matí amb motivació alta i 10 culleres d'energia; s'ha de posar a prova durant un **dijous plujós a les 19:30 h**, quan l'usuari ha dormit malament, ha tingut un dia estressant a la feina, pateix fatiga de decisió i només li queda **1 sola cullera d'energia** (dia d'energia mínima).

```
ESCENARI EN UN "MAL DIA" (1 CULLERA D'ENERGIA RESTANT):

SISTEMA ACTUAL DE CADENCE:
┌────────────────────────────────────────────────────────┐
│ Rutines d'Avui:                                        │
│  [ ] 🧘 Meditació breu                                 │
│  [ ] 🚶 Caminar 15 minuts                              │
│  [ ] 📖 Llegir 5 pàgines                               │
│  [ ] 💧 Beure aigua                                    │
└────────────────────────────────────────────────────────┘
Fricció: 4 elements clars. L'usuari fa el mínim, prem 4 clics i manté la ratxa.

SISTEMA AMB MICROTASQUES INJECTADES:
┌────────────────────────────────────────────────────────┐
│ Agenda i Tasques d'Avui (16-20 nous ítems):            │
│  [ ] Preparar estora meditació                         │
│  [ ] Obrir app de temporitzador                        │
│  [ ] Seure 5 minuts                                    │
│  [ ] Posar-se les sabatilles de córrer                 │
│  [ ] Agafar claus i ampolla                            │
│  [ ] Sortir al carrer                                  │
│  [ ] Caminar fins al parc                              │
│  [ ] Escollir llibre de la tauleta                     │
│  [ ] Llegir 2 minuts                                   │
│  [ ] Omplir got 1                                      │
│  [ ] Omplir got 2...                                   │
└────────────────────────────────────────────────────────┘
Fricció: Sobrecàrrega visual extrema. Deserció immediata de l'usuari.
```

Davant d'un allau de 16 a 20 caselles de verificació, un cervell amb fatiga executiva no tria una microtasca: experimenta una **paràlisi per sobrecàrrega** i tanca l'aplicació per evitar el sentiment de culpa.

### 3.5. Completitud Parcial, Efecte *What-the-Hell* i Desincentivació

La gestió de la completitud parcial en una relació hàbit-microtasca presenta un carreró sense sortida psicològic:

1. **Si l'hàbit només es valida quan es completen el 100% de les microtasques**:
   - Si un usuari surt a córrer 2 km en lloc dels 5 km previstos, o fa 3 de 4 passos de la seva rutina nocturna, el sistema manté l'hàbit incomplet i trenca la seva ratxa diària.
   - Això transmet un missatge nociu de perfeccionisme absolut: l'esforç del 75% té un valor computable de zero. L'usuari se sent traït per l'eina i abandona el seguiment.
2. **Si l'hàbit s'auto-completa al 100% però queden microtasques orfes sense marcar**:
   - L'aplicació cau en una incongruència cognitiva: l'hàbit està verd i marcat com a fet, però a la llista d'avui hi pengen dues tasques vermelles pendents. Això activa angoixa per imperfecció i trenca la claredat visual.
3. **L'efecte *What-the-Hell* (Cochran & Tesser; Baumeister)**:
   - En psicologia de l'autoregulació, l'establiment de micro-criteris rígids condueix a un pensament catastròfic de "tot o res". Si l'usuari falla la segona microtasca del matí, el cervell conclou: *"La rutina d'avui ja està espatllada; tant se val, avui no faré res de la resta del pla"*.

### 3.6. Veredicte Explícit de la Dimensió 1 (Coach / Psicologia de l'Hàbit)

- **Grau de Risc / Complexitat**: **CRÍTIC**
- **Justificació**: Atempta directament contra les lleis fonamentals de l'adherència conductual. Destrueix l'empaquetament procedimental dels ganglis basals, transforma els vots d'identitat en burocràcia transaccional, multiplica la fricció d'iniciació, fracassa rotundament en la "Prova del Mal Dia" i afavoreix l'espiral de culpa de l'efecte *What-the-Hell*.
- **Posició del Coach**: **Desaconsellar categòricament la implementació de microtasques injectades diàriament per a hàbits.**


---

## 4. Dimensió 2: Perspectiva Cognitiva i Neurodivergència / TDAH (R2)

### 4.1. Disfunció Executiva i Limitacions de la Memòria de Treball (Model de Barkley i Baddeley)

El trastorn per dèficit d'atenció amb o sense hiperactivitat (TDAH) i altres perfils neurodivergents es caracteritzen, segons el model d'autoregulació del Dr. Russell Barkley, per una **disfunció primària de les funcions executives**, particularment en la **memòria de treball no verbal**, la inhibició de resposta i la gestió del temps (*time blindness*).

Mentre que un individu neurotípic pot mantenir simultàniament entre 4 i 7 unitats d'informació a la seva memòria de treball a curt termini (model de Baddeley), una persona amb TDAH en situació d'estrès o baixa dopamina sovint veu aquest espai operatiu reduït a **1 o 2 elements actius com a màxim**.

En ergonomia cognitiva, es distingeixen tres tipus de càrrega mental (Sweller):
1. **Càrrega intrínseca**: L'esforç inherent a realitzar l'acció (p. ex., córrer 15 minuts).
2. **Càrrega pertinent (*germane*)**: L'esforç dedicat a aprendre i consolidar la conducta.
3. **Càrrega accessòria o estranya (*extraneous cognitive load*)**: L'esforç mental imposat pel disseny de l'eina o la interfície.

Injectar un eixam de microtasques diàries genera una quantitat massiva de **càrrega accessòria**: llegir títols redundants, avaluar quin pas pertany a quin hàbit, gestionar l'ordre de tasques trivials i prémer caselles de verificació per a accions de 30 segons. Aquesta burocràcia visual consumeix de forma prematura el magre dipòsit d'energia executiva de l'usuari neurodivergent abans que hagi pogut començar cap tasca significativa.

```
IMPACTE EN LA MEMÒRIA DE TREBALL (TDAH):
Capacitat disponible: [ ■ ] (1-2 blocs d'atenció)

SENSE MICROTASQUES:
[ ■ Focus actual: Preparar informe del projecte ] ──> Acció productiva directa.

AMB MICROTASQUES INJECTADES DIÀRIAMENT:
[ ■ Desxifrar i marcar 4 micro-passos de la rutina de matí ] ──> Esgotament de bateria executiva.
(L'informe queda completament fora de la memòria de treball).
```

### 4.2. El Càlcul de la Proliferació i la Paràlisi per Anàlisi

El perfil típic d'usuari de Cadence (reflectit a les dades inicials a `src/client/clientStore.ts:76-293`) manté una mitjana de **7 rutines o hàbits diaris** consolidats (pesatge matinal, repàs d'idioma/Anki, sessió de deep work, exercici físic, revisió de tancament, etc.).

Si s'habilita la descomposició en 4 microtasques diàries per hàbit:
- **$7 \text{ hàbits} \times 4 \text{ microtasques} = 28 \text{ noves tasques injectades cada matí}$**.
- Sumant les 5–8 tasques pendents habituals de projectes, l'usuari obre l'aplicació davant d'una llista de **33 a 36 tasques pendents**.

#### Conseqüències Cognitives Immediates:
1. **Pànic de Deute de Tasques (*Task-Debt Panic*)**: La visió immediata de més de 30 caselles buides envia un senyal d'alerta amigdalina al cervell neurodivergent, associat a la sensació d'anar endarrerit abans de començar el dia.
2. **Paràlisi per Anàlisi**: El cervell no sap discriminar la prioritat relativa entre la microtasca 2 de l'hàbit A i la microtasca 1 de l'hàbit B. Davant la impossibilitat d'ordenar 35 opcions, el sistema executiu es bloqueja.
3. **Conducta d'Evitació per Saturació**: Quan el cost dopamínic d'organitzar la llista supera la recompensa estimada, la resposta biològica més comuna en el TDAH és l'evitació: tancar l'aplicació i refugiar-se en la procrastinació o l'hiperfocus en distraccions alienes.

### 4.3. Permanència de l'Objecte (*Object Permanence*) i Col·lapse de FocusNowVision

Una de les manifestacions cognitives més rellevants en el TDAH és la fragilitat de la **permanència de l'objecte en relació amb tasques i prioritats**: *"Allò que no és visible en aquest instant, deixa d'existir en la consciència operativa"* (*out of sight, out of mind*).

Per aquesta raó exacta, Cadence va crear la vista `FocusNowVision` (`src/client/components/FocusNowVision.tsx`), la joia de la corona ergonòmica del projecte:

```tsx
// src/client/components/FocusNowVision.tsx (línies 41-57)
// Active uncompleted to-dos
const uncompletedTodos = tasks
  .filter((t) => t.type === 'todo' && !t.completed && (!t.difficulty || allowedDifficulties.includes(t.difficulty)))
  .sort((a, b) => (b.priority || 0) - (a.priority || 0));

// Active uncompleted dailies
const uncompletedDailies = tasks.filter((t) => t.type === 'daily' && (!t.difficulty || allowedDifficulties.includes(t.difficulty)));

// Active spotlight task (només 1!)
const activeTask = uncompletedTodos.find((t) => t.id === selectedFocusTaskId) || uncompletedTodos[0] || null;

// Next steps: estrictament limitats a un màxim de 2 tasques
const nextTasks = activeTask
  ? uncompletedTodos.filter((t) => t.id !== activeTask.id).slice(0, showAllTasks ? 10 : 2)
  : uncompletedTodos.slice(1, showAllTasks ? 10 : 3);
```

La filosofia d'aquesta vista (línies 79–81: *"Adapta la visió al que el teu cervell pot assumir sense generar ansietat ni culpa"*) es fonamenta en dues regles estrictes:
- **Exactament 1 Tasca Spotlight** (línia 115: `🎯 EL TEU FOCUS ARA (NOMÉS 1 TASCA)`).
- **Màxim 2 Pròxims Passos** (línia 276: `Pròxims Passos (Màxim 2 tasques per evitar angoixa)`).

#### Els Mecanismes de Fallida si les Microtasques s'Injecten com a Tasques:
1. **Segrest del Spotlight (*Spotlight Hijacking*)**: Atès que `activeTask` agafa la primera tasca de `uncompletedTodos`, una microtasca rutinària injectada (com ara "Omplir ampolla d'aigua" o "Posar-se les sabatilles") passarà a ocupar la targeta gegant central del Spotlight, acompanyada del temporitzador analògic de 25 minuts `<TimeTimerDisk initialMinutes={25} />` (línies 202–206). Això és una aberració ergonòmica.
2. **Esborrament dels Pròxims Passos**: Els 2 únics slots de `nextTasks` seran consumits per passos de rutines diàries secundàries.
3. **Oblidament Catastròfic dels Projectes Reals**: Les veritables tasques estratègiques de l'usuari (redactar una proposta de negoci, enviar un codi a producció, trucar al metge) quedaran desplaçades fora de la pantalla (més enllà de l'índex 2). Per la carència de permanència de l'objecte, l'usuari **les oblidarà completament durant tot el matí**, creient erròniament que ha tingut un matí productiu només per haver marcat 6 microtasques intranscendents.
4. **Si es desactivés el límit de 2 tasques**: Si per solucionar això s'elimina el filtre `slice(0, 2)`, `FocusNowVision` es converteix en un mur de text indiferenciat, destruint la seva raó de ser.

### 4.4. Esgotament de la Reserva Dopamínica Matinal

Els circuits de recompensa dopamínics en persones neurodivergents necessiten fites clares i tangibles. Marcar una microtasca artificial ("obrir llibre") genera una micro-recompensa enganyosa (fals progrés), però immediatament enfronta el cervell a la següent microtasca de la mateixa cadena. La persona experimenta una sensació de "roda de hàmster": molt moviment administratiu, però zero avanç tangible en la seva vida real.

### 4.5. Veredicte Explícit de la Dimensió 2 (Cognitiva / TDAH)

- **Grau de Risc / Complexitat**: **CRÍTIC**
- **Justificació**: Produeix una sobrecàrrega greu de la memòria de treball, multiplica per quatre els estímuls d'ansietat matinals, indueix paràlisi per anàlisi i trenca directament el model de contenció cognitiva de `FocusNowVision`, amagant els objectius reals sota el vel de la manca de permanència de l'objecte.
- **Posició Cognitiva**: **Rebuig total a la injecció diària de microtasques a la cua de treball.**

---

## 5. Dimensió 3: Perspectiva d'UX, Disseny d'Interfície i Usabilitat (R3)

### 5.1. Saturació Visual i Sobrecàrrega de Controls a la Targeta d'Hàbit

Una anàlisi directa del codi font de la interfície principal a `src/client/App.tsx:2191-2548` (`renderHabitsColumn`) revela que la targeta d'hàbit actual ja suporta una densitat excepcionalment alta d'elements interactius:

```tsx
// Radiografia interactiva de la targeta d'hàbit actual (src/client/App.tsx)
1. Targeta arrossegable (draggable={true}, línia 2282)
2. Clic d'obertura del modal complet TaskModal (línia 2314)
3. Checkbox principal de compleció (CheckCircle2 / Circle, línia 2297)
4. Pill de franja circadiana (morning, workday, evening, anytime, línies 2326-2339)
5. Badge de dificultat / culleres (XS, S, M, L, línies 2341-2352)
6. Pill d'ancoratge conductual (🔗 After: {habit.anchor_habit_title}, línies 2378-2383)
7. Chip de Micro-Habit Starter Step amb botó Do Now (línies 2386-2413)
8. Flama de ratxa amb StreakGrowthBadge i escut compassiu (🛡️ Shield, línies 2417-2433)
9. Botons de comptador (+ i -, línies 2444-2470)
10. Renderització de subtasques existents (habit.subtasks.map, línies 2472-2492)
11. Disparador de Goblin Brain AI per desglossament (línies 2509-2520)
12. Botó d'agendament ràpid (+ Agenda / Clear, línies 2522-2539)
13. Mànec d'arrossegament vertical (GripVertical, línia 2542)
```

La targeta compta actualment amb **13 punts d'interacció i metadades independents**. Afegir-hi:
- Controls per afegir/eliminar microtasques al vol,
- Indicadors d'estat de sincronització bidireccional (icones de càrrega o sync),
- Reordenació de passos i filtres de visualització,

eleva la densitat d'informació més enllà del límit de saturació visual recomanat per a qualsevol interfície d'usuari tranquil·la (*Calm Technology*), provocant clics erronis i estrès visual.

### 5.2. Ruptura del Model Mental: Hàbit Cíclic vs Tasca Lineal

En disseny d'interacció, el model mental de l'usuari és el marc conceptual sobre com funciona el sistema. Cadence manté una distinció nítida:

| Entitat | Naturalesa Conceptual | Cicle de Vida | Destinació en Completar-se |
| :--- | :--- | :--- | :--- |
| **Hàbit / Daily** | **Cíclic i Identitari** | Infinit; es repeteix diàriament; no té fi; acumula ratxa i consistència. | Es manté a la pantalla marcat com a fet i es neteja a mitjanit. |
| **Tasca (To-do)** | **Lineal i Transaccional** | Finit; orientat a un resultat únic; té una data límit o data d'execució. | Desapareix de la cua activa i passa a l'historial de tasques fetes. |

#### La Confusió de la "Microtasca d'Hàbit Injectada":
Quan una microtasca d'hàbit s'injecta a la llista de tasques d'avui, es converteix en un **híbrid conceptual incongruent** que genera preguntes irresolubles per a l'usuari:
- **Accions de posposar**: Si l'usuari prem el botó `⏩ Demà` a una microtasca d'hàbit injectada, què passa? Es posposa l'hàbit sencer? O demà l'usuari rebrà dues instàncies d'aquesta microtasca?
- **Edició del títol**: Si corregeixo el text d'una microtasca injectada avui, s'està modificant la plantilla general de l'hàbit o només l'aparició d'avui?
- **Eliminació**: Si elimino una microtasca de la llista d'avui perquè avui no aplica (p. ex. plou i no puc córrer), l'he esborrat per sempre de l'hàbit?
- **Adscripció a projectes**: Pot una microtasca d'un hàbit personal vincular-se a un projecte professional? Si és així, per què l'hàbit no hi està vinculat?

La introducció d'aquesta entitat ambigua trenca la predictibilitat del sistema i genera frustració i recel en la interacció.

### 5.3. Incompatibilitat Radical amb la Graella Temporal d'AgendaView

A `src/client/components/AgendaView.tsx` (línies 786–789), el planificador diari implementa un límit geomètric estricte per a qualsevol bloc arrossegat a l'horari:

```typescript
// src/client/components/AgendaView.tsx (línies 786-789)
// Força una alçada mínima de 26px i una durada visual mínima de 15 minuts:
const clampedEnd = Math.max(clampedStart + 15, block.end_time);
```

Les microtasques d'hàbits són accions que duren habitualment entre **30 segons i 3 minuts** ("posar-se les sabatilles", "omplir el got d'aigua", "obrir el document"). 

Si aquestes microtasques són injectades com a tasques lliures i l'usuari intenta arrossegar-les a l'Agenda:
- Cada microtasca d'un minut consumirà un bloc rígid de **15 minuts mínims** al calendari.
- Una rutina senzilla de 4 microtasques consumirà **1 hora sencera** d'espai visual al planificador diari.
- Això produeix una distorsió grotesca de l'horari disponible, impossibilitant la planificació realista de la jornada.

### 5.4. Paradoxa de la Sincronització Bidireccional i Pèrdua d'Agència

La sincronització bidireccional promet que "completar totes les microtasques completa l'hàbit, i completar l'hàbit completa totes les microtasques". Des de la perspectiva d'UX, aquesta premissa desencadena greus anomalies d'interacció:

```
    ┌─────────────────────────┐
    │       HÀBIT PARE        │
    └───────────┬─────────────┘
          ▲     │
          │     ▼ (Cascada cap avall)
   (Sync) │   ┌──────────────────────────────────────────────┐
          │   │ Microtasca 1  [✓]                            │
          │   │ Microtasca 2  [✓]                            │
          └───┤ Microtasca 3  [ ] ──> Si la marco...          │
              │                       Auto-completa el Pare! │
              └──────────────────────────────────────────────┘
```

1. **Auto-compleció no sol·licitada i pèrdua d'agència**:
   - En marcar la darrera microtasca, el sistema pren el control de la pantalla: auto-marca l'hàbit pare, dispara el so d'èxit `playPeacefulChime()` i llança efectes de celebració.
   - Si l'usuari només volia registrar que havia preparat el material, però no que havia acabat tota la sessió, se sent privat del control de l'estat.
2. **El malson del desmarcatge (*The Unchecking Nightmare*)**:
   - Què passa si l'usuari desmarca una microtasca per error? S'ha de desmarcar l'hàbit sencer? S'ha de decrementar la ratxa que s'acabava de guanyar?
   - Què passa si l'usuari ha completat directament l'hàbit pare (perquè ha fet la rutina de memòria al món real) i més tard vol desmarcar l'hàbit? L'aplicació ha de desmarcar també totes les microtasques que el sistema havia marcat automàticament?
   - Si ho fa, s'esborra el registre de progrés granular de l'usuari. Si no ho fa, es produeix una incongruència visual permanent: hàbit buit, però microtasques totes verdes.
3. **Estats Indeterminats i Soroll Visual**:
   - Com es representa una rutina amb 2 de 4 microtasques completades? Una casella de verificació a mitges `[-]` transmet un estat ambigu que genera confusió sobre si el dia està cobert o si s'està en risc de perdre la ratxa.

### 5.5. Veredicte Explícit de la Dimensió 3 (UX i Usabilitat)

- **Grau de Risc / Complexitat**: **ALT**
- **Justificació**: Trenca la claredat visual del disseny, satura la targeta d'hàbit amb massa controls, genera un conflicte insalvable entre el model mental d'hàbits cíclics i tasques puntuals, fa inservible la graella temporal de 15 minuts d'AgendaView i provoca una greu pèrdua d'agència a través de comportaments de sincronització automàtica confusos i frustrants.
- **Posició d'UX**: **Desaconsellar la barreja de microtasques a la cua de to-dos i rebutjar la sincronització bidireccional opaca.**


---

## 6. Dimensió 4: Perspectiva de Backend, Model de Dades i Arquitectura Tècnica (R4)

### 6.1. Model de Dades i Discordança Semàntica (`src/server/db.ts`)

L'arquitectura de persistència de Cadence utilitza el motor natiu de Node.js `node:sqlite.DatabaseSync` amb diari WAL (`PRAGMA journal_mode = WAL`), temps d'espera de bloqueig de 5.000 ms (`PRAGMA busy_timeout = 5000`) i claus foranes estrictes (`PRAGMA foreign_keys = ON`) a `src/server/db.ts:26-30`.

Totes les entitats de seguiment coexisteixen en una única taula polimòrfica `tasks` (`src/server/db.ts:65-115`), governada per la columna discriminadora `type CHECK (type IN ('habit', 'daily', 'todo'))`.

Aquesta taula reflecteix una bifurcació semàntica intencionada:
- **Camps exclusius d'Hàbit** (línies 76–83):
  ```sql
  habit_positive INTEGER DEFAULT 1,
  habit_negative INTEGER DEFAULT 0,
  counter_up INTEGER DEFAULT 0,
  counter_down INTEGER DEFAULT 0,
  habit_reset_period TEXT DEFAULT 'daily',
  last_habit_reset TEXT
  ```
- **Camps exclusius de Dailies i Todos** (línies 84–92):
  ```sql
  frequency TEXT DEFAULT 'daily',
  repeat_interval INTEGER DEFAULT 1,
  repeat_days TEXT,
  streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0,
  last_completed_date TEXT
  ```

#### El Xoc Semàntic:
A la base de dades, **un `habit` no té cicle de vida de compleció binària (`completed`) ni de ratxes (`streak`)**. Els hàbits són comptadors de freqüència oberts (`counter_up` i `counter_down`) dissenyats per registrar impulsos positius o negatius durant el dia.

Si s'afegeix un estat de compleció que se sincronitza bidireccionalment amb microtasques:
1. **Què significa que un hàbit estigui completat?** Si completar les microtasques marca l'hàbit com a "fet", com afecta això a `counter_up`? Passa a 1?
2. **Què passa si l'usuari realitza l'hàbit una segona vegada a la tarda?** Els hàbits són conductes que es poden repetir diverses vegades al dia (p. ex. "Beure aigua", "Pujar escales"). Si l'usuari prem `+` al comptador de l'hàbit a les 16:00 h, s'han de tornar a injectar de zero totes les microtasques per a una segona ronda?
3. **Pèrdua de la identitat d'Hàbit**: Si l'hàbit passa a tenir `completed = 1` i una ratxa diària, deixa de ser un Hàbit i s'ha convertit, de facto i sense necessitat, en una **Daily** mal dissenyada.

### 6.2. L'Estructura de la Taula `subtasks` i el Dilema de la Instanciació

La taula de subtasques a `src/server/db.ts:117-123` té la següent definició:

```sql
CREATE TABLE IF NOT EXISTS subtasks (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0
);
```

#### Mancança Estructural del Concepte "Plantilla vs Instància":
A la base de dades de Cadence **no existeix el concepte de plantilla recurrent separat de la instància d'avui**. La definició d'una tasca i el seu estat mutable del dia d'avui viuen al mateix registre físic.

Davant de la proposta d'injecció diària de microtasques, s'obren dos escenaris arquitectònics, tots dos altament problemàtics:

- **Escenari A (Injectar com a noves files independents a `tasks`)**:
  - Cada dia, per a cada hàbit, el sistema hauria de crear $N$ noves files a `tasks` amb `type = 'todo'`.
  - Requereix afegir una nova columna `parent_habit_id TEXT REFERENCES tasks(id) ON DELETE CASCADE`.
  - Per garantir la idempotència i evitar que un error dupliqui les tasques en cada petició, cal un índex únic compost molt complex: `UNIQUE(user_id, parent_habit_id, original_subtask_id, target_date)`.
  - En pocs mesos, la taula `tasks` s'ompliria de desenes de milers de registres efímers zombis, degradant les consultes habituals de l'usuari.
- **Escenari B (Mantenir-les com a `subtasks` amb reinici diari)**:
  - En aquest cas no s'estan "injectant" noves tasques, sinó simplement reiniciant el camp `completed = 0` dels fills existents.
  - Però si no s'injecten com a tasques lliures, no poden tenir data de venciment pròpia, ni estimació de temps, ni prioritat, ni assignació a l'Agenda, desmuntant la promesa funcional de la proposta.

### 6.3. El Motor de Rollover: Execució Mandrosa (*Lazy*), Desfase de Fus Horari i Buit Intradia

El cicle de renovació diari està implementat a `src/server/rollover.ts:63-176`. Lluny de ser un dimoni de fons (*daemon*) o una tasca cron que s'executa a les 00:00:00 h, **el rollover és 100% mandrós (*lazy/pull-based*)**:
- S'activa únicament quan un usuari actiu fa una petició HTTP a `GET /api/v1/tasks` (`src/server/routes/api.ts:324`), `POST /api/v1/tasks/:id/score` (`api.ts:797`) o `GET /api/v1/agenda` (`api.ts:1057`).
- Si l'usuari no obre l'aplicació, el rollover mai s'executa.

```typescript
// src/server/rollover.ts (línies 3-10 i 72)
export function getTodayDateString(customDate?: string): string {
  if (customDate) return customDate;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Guard d'execució única per dia:
if (user.last_rollover_date === today) return;
```

#### Tres Fallades Crítiques d'Arquitectura en la Injecció Diària:

1. **El Desfase de Zona Horària (Timezone Drift)**:
   - La funció `getTodayDateString()` utilitza l'hora de sistema del servidor (`new Date()`).
   - Les rutes (`api.ts:324, 797, 1057`) invoquen `runUserRollover(userId)` sense passar cap paràmetre de data ni la zona horària IANA de l'usuari.
   - Si el servidor està allotjat al núvol sota UTC (com és estàndard a Railway, Render o Google Cloud), el canvi de dia ocorre a les 00:00 UTC (les 01:00 o 02:00 h a Barcelona/CET). Un usuari que obri l'app a les 00:15 h a Barcelona rebrà les tasques d'ahir perquè el servidor encara no ha canviat de dia.
2. **El Buit dels Hàbits Creats Intradia (*The Intraday Creation Gap*)**:
   - Suposem que un usuari es connecta a les 08:00 h del matí. El servidor executa el rollover i actualitza el registre: `user.last_rollover_date = '2026-10-30'`.
   - A les 11:00 h, l'usuari decideix crear un nou hàbit "Passeig matinal" i li defineix 4 microtasques.
   - Quan l'usuari torna a la llista de tasques, la injecció diària **no s'executarà mai per a aquest nou hàbit avui**, perquè la condició de la línia 72 (`if (user.last_rollover_date === today) return;`) atura el procés immediatament.
   - Per evitar-ho, caldria duplicar tota la lògica d'injecció dins el controlador `POST /tasks`, creant múltiples camins d'escriptura i augmentant el risc de desincronització.
3. **L'Allau de Deute per Dies d'Inactivitat**:
   - Si un usuari passa 7 dies de vacances sense entrar a l'app, què ha de fer el rollover mandrós el vuitè dia?
   - Si injecta els 7 dies endarrerits, l'usuari es troba amb $7 \times 28 = 196$ microtasques acumulades a la seva safata d'entrada, un desastre absolut.
   - Si descarta els dies intermedis, la lògica de manteniment de ratxes i auditories d'hàbits ha de distingir entre omissions d'execució i absència de connexió, requerint una màquina d'estats altament complexa.

### 6.4. Sincronització Bidireccional: Concurrència, Bucles de Cascada i Atomicitat

Actualment, les mutacions d'estat a Cadence es realitzen a través d'endpoints REST separats i independents:
- `PATCH /api/v1/subtasks/:id` (`src/server/routes/api.ts:891-915`): només actualitza el text i el camp `completed` de la subtasca específica; no comprova ni altera mai l'estat de la tasca mare.
- `POST /api/v1/tasks/:id/score` (`src/server/routes/api.ts:791-860`): incrementa els comptadors de l'hàbit o commuta la compleció d'una daily; no llegeix ni modifica les subtasques.

```
       PATCH /subtasks/:id                     POST /tasks/:id/score
               │                                         │
               ▼                                         ▼
   Actualitza subtask.completed               Incrementa task.counter_up
   (Ignora completament el Pare)              (Ignora completament els Fills)
```

Implementar sincronització bidireccional entre aquests dos nivells genera tres riscos tècnics majors:

#### 1. Bucles Infinits en Cascada (*Cascade Event Loops*)
Si marcar la darrera microtasca dispara la compleció de l'hàbit, i la compleció de l'hàbit té un efecte secundari que marca totes les microtasques com a completades (per si l'usuari prem el pare directament), s'estableix un bucle potencial:

$$\text{Subtask Complete} \longrightarrow \text{Habit Complete} \longrightarrow \text{Subtasks Update} \longrightarrow \text{Cascade Trigger}$$

Sense una màquina d'estats rigorosa que incorpori supressió d'esdeveniments o banderes de recursivitat (*recursion suppression flags*), l'aplicació patirà bucles infinits o escriptures redundants a disc.

#### 2. Condicions de Cursa (*Race Conditions*) en Concurrència REST
A dispositius mòbils o connexions inestables, els usuaris acostumen a prémer ràpidament dues o tres caselles consecutives. En absència de transaccions exclusives (`BEGIN IMMEDIATE`):
- El fil A rep la compleció de la Subtasca 1, llegeix l'estat de la Subtasca 2 (encara a 0 a la seva transacció de lectura) i finalitza sense marcar l'hàbit pare.
- El fil B rep la compleció de la Subtasca 2, llegeix l'estat de la Subtasca 1 (abans que el fil A hagi fet commit) i també finalitza sense marcar el pare.
- **Resultat**: Totes les microtasques queden completades al 100%, però l'hàbit pare roman incomplet, trencant la coherència de les dades.

#### 3. Destrucció del Progrés en el Desmarcatge (*Destructive Unchecking*)
Si un usuari completa un hàbit directament i després se n'adona que s'ha equivocat i el desmarca, quina és la política de desmarcatge dels fills?
- Si es desmarquen totes les microtasques, es destrueix el treball legítim que l'usuari havia marcat individualment hores abans.
- Per evitar-ho, caldria introduir una taula de memòria d'estat o log d'auditoria (`microtask_history` o snapshots) per recordar quins fills estaven marcats abans de l'auto-compleció del pare, elevant de forma injustificada el cost d'enginyeria.

### 6.5. La Càrrega del Model Híbrid: Paritat Obligatòria amb `src/client/clientStore.ts`

El document d'arquitectura de referència `docs/ARCHITECTURE.md` (línies 166–168) estableix una regla estricta de disseny per a Cadence:

> *"Whenever an endpoint or route is added or altered in `routes/api.ts`, make sure `clientStore.ts` also implements the corresponding handler so the application behaves identically in offline / local-first fallback mode."*

Qualsevol funcionalitat que s'afegeixi al servidor Node.js/SQLite **s'ha de reimplementar íntegrament en memòria i persistir-la a `localStorage`** a través de `src/client/clientStore.ts`.

Això comporta tres penalitzacions crítiques:
1. **Absència de Transaccions Reals a `localStorage`**:
   - `clientStore.ts` no disposa de transaccions ACID ni bloquejos WAL. La sincronització bidireccional i la injecció diària gestionades des de múltiples pestanyes obertes al navegador provocaran col·lisions d'escriptura (*write clobbering*) i pèrdua de dades.
2. **El Rollover ni tan sols existeix a `clientStore.ts`**:
   - Una cerca exhaustiva de la paraula `rollover` a `src/client/clientStore.ts` retorna **0 resultats**. El client local-first actual no suporta la lògica de canvi de dia que té el servidor. Implementar la injecció diària obligaria a desenvolupar des de zero un motor de rollover al navegador.
3. **Límit d'Emmagatzematge del Navegador (Quota de 5 MB)**:
   - `localStorage` té un límit dur de ~5 MB per origen.
   - Injectar centenars de microtasques mensuals en format JSON serialitzat farà créixer exponencialment la clau `'habitcorp_client_db_v4'` (`src/client/clientStore.ts:10`), fins a provocar excepcions de quota (`QuotaExceededError`) i el bloqueig total de l'aplicació al navegador de l'usuari.

### 6.6. Veredicte Explícit de la Dimensió 4 (Backend i Arquitectura)

- **Grau de Risc / Complexitat**: **ALT / CRÍTIC**
- **Justificació**: Xoc semàntic irreconciliable amb el model `tasks` (comptadors d'hàbit vs compleció binària); manca d'un model de plantilles vs instàncies; fallades de fus horari i buit d'hàbits intradia en el rollover mandrós; condicions de cursa i pèrdua de consistència en la sincronització bidireccional; i duplicació obligatòria a `clientStore.ts` amb risc de col·lapse per quota de `localStorage`.
- **Posició d'Arquitectura**: **Rebuig formal a la injecció diària i a la sincronització bidireccional.**

---

## 7. Matriu Comparativa de Riscos i Compromisos (Trade-offs)

La següent matriu sintetitza els compromisos arquitectònics i els riscos operatius de la proposta davant de l'estat actual de Cadence i de les alternatives analitzades:

| Criteri d'Avaluació | Proposta: Injecció Diària + Sync Bidireccional | Estat Actual de Cadence | Solució Recomanada: Starter Step + Subtasques Encapsulades |
| :--- | :---: | :---: | :---: |
| **Càrrega Cognitiva en Mal Dia ("Bad Day Test")** | **CRÍTICA** (28+ microtasques diàries, paràlisi) | **MÍNIMA** (Targeta neta d'hàbit, 1 toc) | **ÒPTIMA** (1 tap "Do Now" de <30s o targeta) |
| **Protecció de la Permanència de l'Objecte** | **FRACÀS** (Amaga fites reals fora del top 2) | **PROTEGIDA** (Todos i Dailies separats) | **100% PROTEGIDA** (Zero soroll a la cua de to-dos) |
| **Integritat de `FocusNowVision`** | **COL·LAPSADA** (Segrest del Spotlight i Next Steps) | **EXCEL·LENT** (1 Spotlight + màx. 2 passos) | **EXCEL·LENT** (Preserva l'embut estricte) |
| **Coherència del Model Mental** | **CONFUSA** (Entitat híbrida ambigua) | **CLARA** (Hàbits cíclics vs Todos lineals) | **CLARA** (Subtasques subordinades al pare) |
| **Ajust a l'AgendaView (Graella horària)** | **INCOMPATIBLE** (Distorsió de 15 min per pas de 1m) | **COMPATIBLE** (Blocs reals de tasques) | **COMPATIBLE** (Només s'agenda l'hàbit sencer) |
| **Consistència i Concurrència de Dades** | **FRÀGIL** (Bucles de cascada, race conditions) | **SÒLIDA** (Endpoints independents atòmics) | **MOLT SÒLIDA** (Sense estats creuats derivats) |
| **Robustesa davant Zones Horàries** | **DEFICIENT** (Fallada en UTC vs fusos locals) | **ESTABLE** (Rollover simple per data) | **ESTABLE** (Zero dependència de cron matinal) |
| **Impacte en Mode Offline (`clientStore`)** | **CRÍTIC** (Risc de QuotaExceededError a 5MB) | **LLEUGER** (Consum mínim de localStorage) | **LLEUGER** (Zero noves files diàries) |
| **Cost d'Implementació i Manteniment** | **MOLT ELEVAT** (Noves taules, sync, migracions) | **0 hores** | **MÍNIM** (Reutilitza codi ja existent) |


---

## 8. Proposta d'Alternatives Més Simples i Efectives

Per resoldre la necessitat genuïna de l'usuari (reduir la inèrcia d'inici i guiar l'execució de rutines complexes) sense caure en la sobrecàrrega cognitiva ni en el caos arquitectònic de la injecció diària, es proposen **quatre alternatives més simples, elegants i científicament sòlides**:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      ALTERNATIVES RECOMANADES PER A CADENCE                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│  A. STARTER STEP EXISTENT (Floor Habit)     │ B. SUBTASQUES COL·LAPSABLES       │
│     • 1 sol pas inicial de <30 segons.      │    • Encapsulades a la targeta.   │
│     • Ja programat al codi de Cadence!      │    • Projecció de lectura pura.   │
│     • Victòria fàcil en dies dolents.       │    • Zero injecció al backlog.    │
├─────────────────────────────────────────────┼───────────────────────────────────┤
│  C. ROUTINE STEPPER EFÍMER                  │ D. DAILIES PERIÒDIQUES (SOPs)     │
│     • Assistent pas a pas durant l'acció.   │    • Utilitza el tipus 'daily'.   │
│     • Estat 100% en memòria (React state).  │    • Rutines que es reinicien.    │
│     • Zero contaminació de base de dades.   │    • 0 línies noves de backend.   │
└─────────────────────────────────────────────┴───────────────────────────────────┘
```

---

### Alternativa A: Aprofitar i Consolidar el "Micro-Habit Starter Step" (Floor Habit) — *Recomanació Principal*

- **Fonament Conductual**:
  - Basat directament en el mètode de BJ Fogg (*Tiny Habits*, $B = MAP$) i la teoria dels *Elastic Habits* de Stephen Guise.
  - En lloc d'omplir la llista amb 4 o 5 tasques, l'hàbit defineix un **únic pas inicial ("Starter Step")** que requereix menys de 30 segons per activar-se (p. ex., per a "Sessió de Gimnàs" $\rightarrow$ *"Posar-se les sabatilles de córrer"*; per a "Estudiar xinès" $\rightarrow$ *"Obrir una lliçó a l'Anki"*).
  - En dies de baixa energia ("Prova del Mal Dia"), completar exclusivament aquest pas compta com una execució vàlida de l'hàbit, atorgant el vot d'identitat i protegint la ratxa sense sentiment de culpa.
- **Fonament al Codi Existent (Ja Està Construït!)**:
  - Aquest concepte ja està previst a l'esquema de dades: `src/server/db.ts:109-111, 249-250` disposa de la columna `micro_habit_title TEXT DEFAULT ''`.
  - La interfície de client ja disposa del component visual i la interacció a `src/client/App.tsx:2386-2413`:
    ```tsx
    {/* Micro-Habit Starter Step Chip with 1-Tap Floor Completion */}
    {habit.micro_habit_title && (
      <div
        onClick={() => handleScoreTask(habit.id, 'up')}
        className="mt-2 flex items-center justify-between text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2 py-1.5 rounded border border-emerald-200 dark:border-emerald-800/60 cursor-pointer hover:bg-emerald-100 transition-colors"
      >
        <span className="font-semibold">Starter Step:</span>
        <span>{habit.micro_habit_title}</span>
        <span className="ml-1 text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">
          Do Now
        </span>
      </div>
    )}
    ```
- **Millora Proposada**:
  - Traslladar aquest mateix xip a `src/client/components/FocusNowVision.tsx` dins la secció de rutines (`uncompletedDailies`, línies 227–270).
  - **Cost d'enginyeria**: Pràcticament 0 hores de backend; menys de 15 línies de codi a la interfície.
  - **Impacte**: Zero noves taules, zero injecció diària, zero condicions de cursa, zero paràlisi per anàlisi.

---

### Alternativa B: Subtasques Col·lapsables dins la Targeta d'Hàbit (Progressive Disclosure) amb Estat Virtual

- **Fonament Ergonòmic i d'UX**:
  - Quan un usuari necessita recordar els passos detallats d'una rutina (una "recepta" procedimental), aquests passos s'han de mantenir **estrictament encapsulats a l'interior de la targeta de l'hàbit**.
  - S'aplica el patró de **revelació progressiva (*Progressive Disclosure*)**: per defecte, la targeta mostra només un indicador subtil de progrés (p. ex. `2/4 passos` o una barra de píndola segmentada `■■□□`). Un xevró desplegable permet veure i marcar els passos quan l'usuari ho desitja.
  - **Les subtasques MAI s'injecten** a la cua de `uncompletedTodos`, ni apareixen a la llista d'AgendaView com a blocs de 15 minuts.
- **Arquitectura Backend Neta i Sense Bucles**:
  - Reutilitza la taula existent `subtasks` (`src/server/db.ts:117-123`).
  - A `src/server/rollover.ts`, s'aprofita la línia 97 que ja fa el reinici automàtic:
    ```sql
    UPDATE subtasks SET completed = 0 WHERE task_id = ?;
    ```
  - **Estat Derivat Virtual (Pure Read-Only Projection)**: Per evitar condicions de cursa i bucles de cascada infinita, la compleció de l'hàbit a través de subtasques **no s'emmagatzema com a mutació creuada**. Es calcula al vol com una projecció de lectura:
    $$\text{is\_completed} = (\text{subtasks.length} > 0) \land \text{subtasks.every}(s \implies s.\text{completed} === 1)$$
  - Si l'usuari fa clic a la targeta principal de l'hàbit, es marca completat directament sense forçar la mutació de les subtasques.

---

### Alternativa C: "Routine Stepper" / Assistent d'Execució Efímer (Focus Pacing Wizard)

- **Fonament Cognitiu (TDAH)**:
  - Les persones amb TDAH es beneficien enormement de la reducció d'estímuls competidors durant l'execució d'una rutina.
  - En lloc de generar tasques estàtiques a una llista, quan l'usuari vol fer una rutina complexa (p. ex. "Rutina de Matí"), prem el botó `Iniciar Rutina`.
  - S'obre un assistent a pantalla completa o modal de ritme (*Focus Pacing Mode*):
    - **Pas 1/4**: "Posa't les sabatilles i beu aigua" (Temporitzador suau de 2 min) $\rightarrow$ `[Fet / Següent →]`
    - **Pas 2/4**: "Estiraments articulars" (Temporitzador de 5 min) $\rightarrow$ `[Fet / Següent →]`
    - **Pas 3/4**: "Exercici principal" $\rightarrow$ `[Fet / Següent →]`
    - **Pas 4/4**: "Dutxa i tancament" $\rightarrow$ `[Finalitzar Rutina 🎉]`
- **Avantatges Tècnics**:
  - **Estat 100% Efímer**: L'estat dels passos viu exclusivament a la memòria de React (`useState`).
  - **Zero Pol·lució de Base de Dades**: No es crea cap registre a SQLite ni a `localStorage`.
  - En prémer `Finalitzar Rutina`, el client fa una única crida atòmica: `POST /api/v1/tasks/:id/score`.

---

### Alternativa D: Ús de "Dailies Periòdiques" per a Procediments Fixos (SOPs)

- **Clarificació de la Taxonomia del Producte**:
  - Cadence ja té una separació nativa entre `habit` i `daily`.
  - Si un usuari necessita una llista de comprovació diària que té una sèrie de passos fixos (com ara un procediment de tancament laboral o una llista de neteja), això no és un hàbit de freqüència (+/-): és una **Daily (`type === 'daily'`)**.
  - Les Dailies a Cadence ja tenen:
    - Seguiment de ratxes (`streak`),
    - Estat de compleció binària (`completed: 1 | 0`),
    - Suport de subtasques filles que es reinicien automàticament cada mitjanit a `src/server/rollover.ts:97, 134`.
- **Estratègia de Producte**:
  - Millorar la guia d'usuari i la interfície per orientar l'ús correcte:
    - Utilitza **Hàbit** per a impulsos de freqüència lliure ("Beure aigua", "Pujar escales").
    - Utilitza **Daily** per a rutines diàries recurrents amb passos específics.
  - **Cost d'enginyeria**: **0 línies de codi nou**.

---

### Matriu de Comparació de les Alternatives Proposades

| Criteri de Decisió | Proposta Original (Injecció + Sync) | Alternativa A (Starter Step) | Alternativa B (Subtasques Col·lapsades) | Alternativa C (Routine Stepper) | Alternativa D (Dailies Periòdiques) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Fricció en Dies Dolents (Bad Day)** | Crítica (Alta fatiga) | Mínima (1 sol tap <30s) | Baixa (Encapsulada) | Baixa (Guia guiada) | Mitjana |
| **Càrrega Cognitiva per a TDAH** | Molt Alta (Paràlisi) | Molt Baixa (Alleujament) | Baixa (Revelació prog.) | Nul·la (1 pas alhora) | Baixa |
| **Pol·lució de la taula `tasks`** | Massiva (Milers de files) | Zero | Zero | Zero | Zero |
| **Risc de Bucles i Race Conditions** | Crític | Zero | Zero (Estat virtual) | Zero (Estat en memòria)| Zero |
| **Suport Offline a `clientStore`** | Trencat (Risc 5MB) | 100% Suportat | 100% Suportat | 100% Suportat | 100% Suportat |
| **Esforç d'Implementació** | Molt Alt (Setmanes) | Immediat (Ja fet) | Molt Baix (1-2 dies) | Baix (2-3 dies) | Zero (Existent) |

---

## 9. Recomanació Executiva Final i Full de Ruta de Decisió

### 9.1. Decisió Categòrica
**DESESTIMAR I REBUTJAR** la implementació d'un sistema d'injecció diària de microtasques per a hàbits amb sincronització bidireccional. 

La funcionalitat, malgrat ser intuïtivament atractiva des d'una visió superficial de llista de tasques, és un cavall de Troia que:
- Contamina la proposta de valor de Cadence com a eina de calma i compassió (*"The Boring Cousin of Habitica"*),
- Condemna l'experiència d'usuaris amb TDAH a través d'una proliferació incontrolable de tasques matinals,
- Desactiva l'automatisme neurobiològic dels hàbits consolidats, i
- Genera un deute tècnic i d'arquitectura crític al backend i al magatzem local.

### 9.2. Full de Ruta Recomanat (Pla d'Acció per Fases)

En lloc de la injecció diària, s'aconsella desplegar una estratègia centrada en la compassió i la baixa fricció en tres fases progressives:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      FULL DE RUTA DE MILLORA DE RUTINES                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│ FASE 1: VISIBILITAT DEL STARTER STEP A FOCUSNOWVISION (Immediat - 1 hora)       │
│ • Portar el chip existent habit.micro_habit_title a la secció de rutines        │
│   de FocusNowVision.tsx (línies 227-270).                                       │
│ • Permetre compleció ràpida "Do Now" en dies de baixa energia.                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│ FASE 2: ENCAPSULAMENT DE SUBTASQUES AMB REVELACIÓ PROGRESSIVA (Curts termini)   │
│ • Mantenir les subtasques estrictament a l'interior de la targeta d'hàbit.      │
│ • Afegir acordió visual col·lapsable (■■□□) sense injectar res a la cua de      │
│   tasques pendents ni a l'AgendaView.                                           │
│ • Utilitzar estat de compleció derivat pur (sense sincronització en cascada).   │
├─────────────────────────────────────────────────────────────────────────────────┤
│ FASE 3: ASSISTENT D'EXECUCIÓ EFÍMER "ROUTINE STEPPER" (Mig termini - Opcional)  │
│ • Dissenyar un modal de ritme que acompanyi l'usuari durant l'execució en temps │
│   real, amb estat 100% en memòria i enviament d'un únic resultat en finalitzar. │
└─────────────────────────────────────────────────────────────────────────────────┘
```

Aquest enfocament honra la filosofia fundacional de Cadence: **calma, respecte pel cervell de l'usuari, i zero burocràcia**.

---

## 10. Mètode de Verificació Independent

Per a qualsevol enginyer o auditor que desitgi verificar de forma independent les afirmacions, línies de codi i conclusions d'aquest informe:

### 10.1. Inspecció de Codi al Repositori
1. **Verificació de la taula `tasks` i camps d'hàbit vs daily**:
   - Obrir `src/server/db.ts` i inspeccionar les línies 65–115. Comprovar que `completed` i `streak` pertanyen exclusivament al cicle de dailies/todos, mentre que els hàbits es regeixen per `counter_up` i `counter_down`.
2. **Verificació de la taula `subtasks` i la manca de dates**:
   - Obrir `src/server/db.ts` i revisar les línies 117–123. Confirmar que no hi ha cap camp de data, dia o sessió.
3. **Verificació del motor de rollover lazy i la manca de timezones**:
   - Obrir `src/server/rollover.ts` i revisar les línies 3–10 (`getTodayDateString`) i 72 (`user.last_rollover_date === today`). Comprovar la manca de paràmetres de fus horari i el bloqueig d'execució única per dia.
4. **Verificació de les restriccions d'embut de `FocusNowVision`**:
   - Obrir `src/client/components/FocusNowVision.tsx` i comprovar les línies 41–57 (filtre de to-dos, spotlight únic i límit màxim de 2 pròxims passos amb `slice(0, 2)`).
5. **Verificació del Starter Step ja existent**:
   - Obrir `src/client/App.tsx` (línies 2386–2413) i `src/server/db.ts` (línia 109). Confirmar que `micro_habit_title` i el botó "Do Now" ja estan implementats a la base de dades i a la targeta d'hàbit.
6. **Verificació de la graella de 15 minuts d'AgendaView**:
   - Obrir `src/client/components/AgendaView.tsx` i comprovar les línies 786–789 (`Math.max(clampedStart + 15, block.end_time)`).

### 10.2. Verificació de la Bateria de Proves Automatitzades
Per assegurar que el codebase actual es manté sa i que les proves existents de micro-hàbits i ratxes passen al 100%:

```bash
# Execució de tota la suite de tests
npm test

# Execució específica de tests de micro-hàbits i starter steps
npx vitest run --fileParallelism=false tests/micro_habit_starter_step.test.ts tests/micro_habit_floor_completion.test.ts tests/habit_stacking.test.ts
```

*(Nota tècnica: s'utilitza `--fileParallelism=false` per evitar bloquejos de concurrència sobre el fitxer SQLite local en entorns multitasca).*

### 10.3. Prova Empírica de Simulació del "Mal Dia"
1. Configurar un compte amb 6 hàbits consolidats (p. ex. Matí, Meditació, Gimnàs, Feina profunda, Lectura, Tancament nocturn).
2. Simular un escenari on cada hàbit té 4 microtasques injectades (24 tasques a la cua diària).
3. Simular un estat d'energia d'1 cullera (`energyLevel = 'minimal'`).
4. Mesurar el nombre d'interaccions requerides per a un usuari per registrar la seva jornada:
   - Amb microtasques injectades: 24 clics de revisió, avaluació i decisió.
   - Amb Starter Step / Targeta d'hàbit: 6 clics suaus als xips "Do Now".
   - *Resultat*: Reducció del 75% en la fricció cognitiva d'entrada.
