# Plan 1 — Fondations, moteur de jeu et mode « un téléphone »

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer une PWA installable, belle et fluide, où plusieurs joueurs inscrits sur un même téléphone posé au centre jouent une partie complète d'Action ou Vérité (bouteille, défis système / perso / écrits, minuteur, points, récap).

**Architecture:** Front Vite + React organisé par fonctionnalité. Toute la logique de jeu vit dans `src/engine/`, un module TypeScript pur (aucun import React/DOM) piloté par un réducteur `reduce(state, action, rng)`, qui sera réutilisé tel quel côté serveur dans le Plan 2. L'état local est persisté via Zustand + localStorage sécurisé.

**Tech Stack:** Vite, React 19, TypeScript (strict), Tailwind CSS v4, Motion, React Router (data router), Zustand, vite-plugin-pwa, Vitest + Testing Library, Playwright, ESLint + Prettier, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-22-action-verite-v1-design.md`

**Plans suivants (hors périmètre ici) :** Plan 2 — Supabase, comptes, salons multi-téléphones (moteur côté serveur) ; Plan 3 — chat de salon ; Plan 4 — appels vidéo ; Plan 5 — récap enrichi, badges, écran Premium et droits `canUse`.

## Global Constraints

- Toute l'application est 18+ : porte d'âge déclarative à l'entrée, mémorisée sur l'appareil.
- Interface FR (par défaut) + EN ; contenu des défis en FR uniquement en V1.
- JS initial ≤ 200 Ko gzip ; premier affichage < 2,5 s en 4G moyenne ; mobile d'abord, utilisable sur ordinateur.
- Accessibilité : contrastes AA, zones tactiles ≥ 44 px, respect de `prefers-reduced-motion`.
- Design validé « Wax & Or » (spec §10) : 3 thèmes `nuit` | `ivoire` | `terre` (choix dans Profil), aucun dégradé, polices DM Serif Display (mots d'apparat) + Plus Jakarta Sans (tout le reste, chiffres tabulaires), auto-hébergées (`@fontsource`) pour le hors-ligne.
- Organisation : un composant par fichier, fichiers ≈ 200 lignes max, logique métier hors des composants, **aucun composant défini dans un autre**, rangement par fonctionnalité (arborescence du spec §9.2).
- Aucune donnée fictive affichée comme réelle (pas de faux joueurs, fausses stats).
- 8 catégories (spec §9.1) : `fun` Juste pour rire (1), `honest` Limite franchise (1–2), `romantic` Romantique (2), `closer` Rapproche-toi (2), `spicy` Osé (3), `night` Après la tombée de la nuit (3), `intimate` Très intime (4), `noreturn` Pas de retour en arrière (4). Gratuites : `fun`, `honest`, `romantic`.
- ≥ 20 vérités + ≥ 20 actions par catégorie, en français.
- Un tour = chaque joueur joue une fois ; la bouteille ne désigne pas un joueur ayant déjà joué dans le tour.
- Goulot = joueur qui relève le défi ; cul = joueur qui pose (si même joueur, voisin suivant).
- Mode un téléphone : pas de contestation ; la carte s'oriente vers le joueur concerné.
- Hébergement GitHub Pages sous `/action_ou_verit-_premium_check/` (base Vite + fallback `404.html`).
- Commits : messages conventionnels, terminés par les lignes d'attribution de la session.

## Review Focus

1. **Plus aucun défi système compatible** (catégories × limites du joueur × type épuisés) → jamais de plantage : on réautorise les défis déjà joués, puis s'il n'y en a toujours aucun, l'interface propose « J'écris maintenant » ou « Passer ». Tests : Task 6 (`drawDare` réutilisation + `null`), Task 12 (écran sans défi).
2. **Un joueur dont les limites excluent toutes les catégories choisies** → l'écran de préparation l'avertit avant de lancer ; en jeu, même repli que (1). Tests : Task 11 (avertissement), Task 6.
3. **Rechargement de la page en pleine partie** (y compris pendant la rotation) → la partie reprend ; une phase `spinning` réhydratée passe directement à `choosing` avec le même joueur désigné. Test : Task 7 (`SPIN_SETTLED` idempotent) et Task 12 (réhydratation).
4. **localStorage corrompu, ancien format ou bloqué (navigation privée)** → l'app démarre quand même avec des valeurs par défaut, jamais d'écran blanc. Tests : Task 4 (`safeStorage`, migration versionnée).
5. **Bornes de la table** : 2 à 12 joueurs, pseudos jusqu'à 24 caractères, doublons de pseudo, emoji composés → disposition lisible, angles corrects, pseudos en double refusés. Tests : Task 5 (géométrie n = 2…12), Task 10 (validation pseudo).

---

### Task 1: Socle du projet et outillage

**Files:**
- Delete (index git) : `action-verite` (lien de sous-module cassé)
- Create: `package.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `.prettierrc`, `index.html`, `src/main.tsx`, `src/app/App.tsx`, `src/styles/index.css`, `vitest.setup.ts`, `playwright.config.ts`, `.github/workflows/ci.yml`, `.gitignore`, `README.md`
- Test: `src/app/App.test.tsx`

**Interfaces:**
- Produces: alias `@/` → `src/` ; scripts npm `dev`, `build`, `preview`, `test`, `test:e2e`, `lint`, `typecheck`, `format` ; `base: '/action_ou_verit-_premium_check/'` dans Vite.

- [ ] **Step 1:** `git rm --cached action-verite` puis initialiser Vite (template `react-ts`) à la racine du dépôt ; installer tailwindcss v4 (`@tailwindcss/vite`), motion, react-router, zustand, vitest, @testing-library/react, @testing-library/jest-dom, jsdom, @playwright/test, eslint (config React + TS + jsx-a11y), prettier. TypeScript `strict: true`, `noUncheckedIndexedAccess: true`.
- [ ] **Step 2: Écrire le test qui échoue** — `App.test.tsx` : `render(<App />)` puis `expect(screen.getByRole('main')).toBeInTheDocument()`.
- [ ] **Step 3:** `npm test` → FAIL (App n'expose pas de `main`).
- [ ] **Step 4:** `App.tsx` rend un `<main>` minimal ; `index.html` en `lang="fr"`, `theme-color`, viewport `viewport-fit=cover`.
- [ ] **Step 5:** `npm test && npm run lint && npm run typecheck && npm run build` → tout passe.
- [ ] **Step 6:** CI `ci.yml` : sur push/PR → `npm ci`, lint, typecheck, test, build (Playwright ajouté en Task 14). README : lancer, tester, structure.
- [ ] **Step 7: Commit** `chore: scaffold Vite + React + TS app, remove broken submodule link`

### Task 2: Direction visuelle et tokens (validation du porteur du projet obligatoire)

**Files:**
- Create: `src/design-system/tokens.css` (bloc `@theme` Tailwind v4), `src/design-system/fonts.ts`, maquette `design/mockup-plan1.html` (hors build)

**Interfaces:**
- Produces: variables de thème utilisées partout — couleurs `--color-ink-{950,900,800,700}`, `--color-truth` (accent froid), `--color-dare` (accent chaud), `--color-text`, `--color-muted`, `--color-success`, `--color-danger` ; polices `--font-display`, `--font-body` ; rayons `--radius-{sm,md,lg,xl}` ; ombres/lueurs `--shadow-glow-truth`, `--shadow-glow-dare` ; durées `--ease-out-expo`, `--dur-{fast,base,slow}`.

- [ ] **Step 1:** Charger les skills `anthropic-skills:ui-ux-pro-max` et `anthropic-skills:awwwards` ; partir de la piste « Nuit de fête » (spec §10) : fond encre profond, accent froid Vérité / chaud Action, typo d'affichage expressive, bouteille travaillée au centre.
- [ ] **Step 2:** Produire une maquette statique de 3 écrans : Accueil, Table de jeu (cercle de 5 avatars + bouteille), Carte défi (Action et Vérité). Mobile 390×844.
- [ ] **Step 3:** Publier la maquette (Artifact) et **attendre la validation explicite du porteur du projet**. Itérer jusqu'à validation. Ne pas commencer la Task 3 avant.
- [ ] **Step 4:** Reporter la direction validée dans `tokens.css` ; vérifier les contrastes AA des paires texte/fond (script ou outil, résultat noté dans le commit).
- [ ] **Step 5: Commit** `feat(design): validated visual direction and design tokens`

### Task 3: Primitives du design system

**Files:**
- Create dans `src/design-system/` : `Button.tsx`, `IconButton.tsx`, `Card.tsx`, `Sheet.tsx`, `Avatar.tsx`, `TextField.tsx`, `Segmented.tsx`, `Toggle.tsx`, `Screen.tsx`, `index.ts`
- Test: `src/design-system/*.test.tsx`

**Interfaces:**
- Produces:
  - `Button({ variant: 'primary'|'truth'|'dare'|'ghost'|'danger', size?: 'md'|'lg', loading?, ...buttonProps })`
  - `IconButton({ label: string, icon: ReactNode, ...buttonProps })` — `label` devient `aria-label`
  - `Sheet({ open: boolean, onClose(): void, title: string, children })` — panneau du bas animé, focus piégé, fermeture Échap/arrière-plan
  - `Avatar({ emoji: string, name: string, size?: 'sm'|'md'|'lg', highlighted?: boolean })`
  - `TextField({ label: string, error?: string, ...inputProps })`
  - `Segmented<T extends string>({ value: T, options: { value: T, label: string }[], onChange(v: T): void, label: string })`
  - `Toggle({ checked: boolean, onChange(v: boolean): void, label: string })`
  - `Screen({ title?: string, back?: () => void, actions?: ReactNode, children })` — gère les zones sûres et le `<main>`

- [ ] **Step 1: Tests qui échouent** — `Button` désactivé quand `loading` et expose `aria-busy="true"` ; `IconButton` a un nom accessible = `label` ; `Sheet` ouvert a `role="dialog"`, `aria-modal="true"`, se ferme sur `Escape` (`onClose` appelé une fois) ; `TextField` relie l'erreur via `aria-describedby` ; `Segmented` expose `role="radiogroup"` et appelle `onChange('b')` au clic ; `Toggle` a `role="switch"` et `aria-checked`.
- [ ] **Step 2:** `npm test -- design-system` → FAIL.
- [ ] **Step 3:** Implémenter avec les tokens de Task 2 ; cibles tactiles ≥ 44 px ; animations Motion désactivées si `useReducedMotion()`.
- [ ] **Step 4:** `npm test -- design-system` → PASS.
- [ ] **Step 5: Commit** `feat(design-system): accessible primitives`

### Task 4: Stockage sûr, réglages et i18n

**Files:**
- Create: `src/lib/safeStorage.ts`, `src/features/settings/settingsStore.ts`, `src/i18n/fr.ts`, `src/i18n/en.ts`, `src/i18n/useT.ts`, `src/i18n/format.ts`
- Test: `src/lib/safeStorage.test.ts`, `src/features/settings/settingsStore.test.ts`, `src/i18n/format.test.ts`

**Interfaces:**
- Produces:
  - `safeStorage: StateStorage` (interface Zustand `persist`) — `getItem`/`setItem`/`removeItem` qui ne lèvent jamais ; JSON invalide → `null`.
  - `useSettingsStore` : `{ language: 'fr'|'en', theme: 'nuit'|'ivoire'|'terre', sound: boolean, haptics: boolean, ageConfirmedAt: string|null, setLanguage, setTheme, setSound, setHaptics, confirmAge(): void }` persisté sous la clé `av:settings` version `1`.
  - `fr` est la source de vérité ; `type Dictionary = typeof fr` ; `en: Dictionary` (le compilateur refuse une clé manquante).
  - `useT(): Dictionary` (langue courante) ; `format(template: string, vars: Record<string, string|number>): string` remplace `{name}`.

- [ ] **Step 1: Tests qui échouent** — `safeStorage.getItem` renvoie `null` quand `localStorage.getItem` lève ; `setItem` ne lève pas quand le quota est dépassé ; `useSettingsStore` réhydraté depuis une valeur corrompue (`"{oops"`) donne les défauts (`language: 'fr'`, `theme: 'nuit'`, `sound: true`, `haptics: true`, `ageConfirmedAt: null`) ; `format('Salut {name}', { name: 'Awa' }) === 'Salut Awa'` et une variable absente laisse `{name}` intact.
- [ ] **Step 2:** `npm test -- safeStorage settingsStore format` → FAIL.
- [ ] **Step 3:** Implémenter ; `persist` avec `version: 1` et `migrate` qui renvoie les défauts pour toute version inconnue.
- [ ] **Step 4:** Tests → PASS.
- [ ] **Step 5: Commit** `feat: safe persistence, settings store, typed i18n`

### Task 5: Moteur — types, hasard et géométrie de la table

**Files:**
- Create: `src/engine/types.ts`, `src/engine/rng.ts`, `src/engine/geometry.ts`, `src/engine/index.ts`
- Test: `src/engine/geometry.test.ts`, `src/engine/rng.test.ts`

**Interfaces:**
- Produces (dans `types.ts`) :
  - `type CategoryId = 'fun'|'honest'|'romantic'|'closer'|'spicy'|'night'|'intimate'|'noreturn'`
  - `type Intensity = 1|2|3|4` ; `type ChallengeKind = 'truth'|'dare'` ; `type PlayMode = 'nearby'|'remote'` ; `type DareSource = 'system'|'custom'|'both'`
  - `interface Dare { id: string; kind: ChallengeKind; category: CategoryId; intensity: Intensity; modes: PlayMode[]; text: string; authorId?: string }`
  - `interface PlayerLimits { excludedCategories: CategoryId[]; maxIntensity: Intensity }`
  - `interface Player { id: string; name: string; avatar: string; limits: PlayerLimits; customDares: Dare[] }` (l'ordre du tableau `players` = ordre des places autour de la table, dans le sens horaire)
  - `type Rng = () => number` (dans [0, 1))
- Produces (`rng.ts`) : `createSeededRng(seed: number): Rng` (mulberry32), `pickIndex(length: number, rng: Rng): number`.
- Produces (`geometry.ts`) :
  - `seatAngle(index: number, count: number): number` — degrés, 0 = haut de l'écran, sens horaire.
  - `computeSpin(currentRotation: number, targetAngle: number, extraTurns: number): number` — rotation finale > actuelle, `mod 360 === targetAngle`.
  - `askerIndexFor(answererIndex: number, count: number): number` — place la plus proche de l'angle opposé ; égalité → la suivante dans le sens horaire ; jamais `answererIndex`.
  - `cardRotationFor(seatAngleDeg: number): 0|90|180|270` — orientation lisible pour le joueur à cette place (joueur en bas → 0, en haut → 180), arrondie au quart de tour le plus proche.

- [ ] **Step 1: Tests qui échouent** —
  - `seatAngle(0,4)=0`, `seatAngle(1,4)=90`, `seatAngle(3,4)=270` ; pour n de 2 à 12, toutes les places sont distinctes et dans [0, 360).
  - `computeSpin(725, 90, 5)` : `r > 725`, `((r % 360) + 360) % 360 === 90`, `r - 725 >= 5*360`.
  - `askerIndexFor(0,2)=1`, `askerIndexFor(0,4)=2`, `askerIndexFor(0,3)=1` (égalité 120/240 → suivant horaire) ; pour n de 2 à 12 et chaque place, résultat ≠ place.
  - `cardRotationFor(180)=0`, `cardRotationFor(0)=180`, `cardRotationFor(90)=270`, `cardRotationFor(270)=90`, `cardRotationFor(200)=0`.
  - `createSeededRng(42)` produit deux fois la même suite ; `pickIndex(5, () => 0.999) === 4`.
- [ ] **Step 2:** `npm test -- engine` → FAIL.
- [ ] **Step 3:** Implémenter ; `src/engine/` n'importe ni React ni le DOM (règle ESLint `no-restricted-imports` sur ce dossier).
- [ ] **Step 4:** Tests → PASS.
- [ ] **Step 5: Commit** `feat(engine): core types, seeded rng, table geometry`

### Task 6: Moteur — tirage des défis

**Files:**
- Create: `src/engine/dares.ts`
- Test: `src/engine/dares.test.ts`

**Interfaces:**
- Consumes: types de Task 5.
- Produces:
  - `interface DrawFilter { kind: ChallengeKind; mode: PlayMode; categories: CategoryId[]; limits: PlayerLimits; usedIds: ReadonlySet<string> }`
  - `isAllowedFor(dare: Dare, filter: Omit<DrawFilter,'usedIds'>): boolean`
  - `drawDare(pool: readonly Dare[], filter: DrawFilter, rng: Rng): Dare | null` — filtre (type, mode, catégorie choisie et non exclue, intensité ≤ max, non utilisé) ; si vide, refait le filtre en ignorant `usedIds` ; si toujours vide → `null`.
  - `validateWrittenDare(text: string): { ok: true, text: string } | { ok: false, reason: 'tooShort'|'tooLong' }` — trim, 3 à 280 caractères.

- [ ] **Step 1: Tests qui échouent** — avec un petit pool de fixtures : exclut le mauvais type ; exclut `modes` sans le mode ; exclut une catégorie exclue par le joueur même si choisie ; exclut intensité > max ; n'exclut jamais un défi autorisé ; renvoie un défi déjà utilisé quand tous les autres sont utilisés ; renvoie `null` quand aucun défi n'est autorisé ; même graine → même défi ; `validateWrittenDare('  ok ')` → `tooShort` ; 281 caractères → `tooLong` ; `'  Chante  '` → `{ ok: true, text: 'Chante' }`.
- [ ] **Step 2:** `npm test -- engine/dares` → FAIL.
- [ ] **Step 3:** Implémenter.
- [ ] **Step 4:** Tests → PASS.
- [ ] **Step 5: Commit** `feat(engine): dare drawing with limits and fallback`

### Task 7: Moteur — machine à états, points et fin de partie

**Files:**
- Create: `src/engine/state.ts`, `src/engine/reduce.ts`, `src/engine/scoring.ts`, `src/engine/errors.ts`
- Test: `src/engine/reduce.test.ts`, `src/engine/scoring.test.ts`

**Interfaces:**
- Consumes: Tasks 5 et 6.
- Produces:
  - `interface GameSettings { mode: PlayMode; categories: CategoryId[]; source: DareSource; rounds: number /*1..20*/; timerSeconds: 0|30|60|90; maxSkips: number /*défaut 3*/; picker: 'bottle'|'random' }` — `picker` ne change que l'animation (même tirage côté moteur)
  - `type Phase = 'spinning'|'choosing'|'asking'|'challenge'|'finished'` (+ `'ready'` avant le premier lancer)
  - `interface Turn { answererId: string; askerId: string; kind: ChallengeKind|null; dare: Dare|null; noDareAvailable: boolean }`
  - `interface PlayerScore { done: number; skipped: number; points: number; truths: number; dares: number }`
  - `interface GameState { id: string; settings: GameSettings; players: Player[]; phase: Phase; round: number; playedThisRound: string[]; turn: Turn|null; bottleRotation: number; usedDareIds: string[]; scores: Record<string, PlayerScore>; history: { round: number; answererId: string; askerId: string; dare: Dare; outcome: 'done'|'skipped' }[] }`
  - `createGame(input: { id: string; settings: GameSettings; players: Player[] }): GameState` — phase `'ready'`, round 1 ; lève `GameRuleError('notEnoughPlayers')` si < 2, `'tooManyPlayers'` si > 12, `'noCategory'` si aucune catégorie.
  - `type GameAction = { type: 'SPIN' } | { type: 'SPIN_SETTLED' } | { type: 'CHOOSE_KIND'; kind: ChallengeKind } | { type: 'PICK_SYSTEM' } | { type: 'PICK_CUSTOM'; dareId: string } | { type: 'PICK_WRITTEN'; text: string } | { type: 'COMPLETE' } | { type: 'SKIP' } | { type: 'RESTART' }`
  - `reduce(state: GameState, action: GameAction, ctx: { rng: Rng; systemDares: readonly Dare[] }): GameState` — pure ; action invalide pour la phase → `GameRuleError(code)`.
  - `class GameRuleError extends Error { code: 'invalidPhase'|'noSkipsLeft'|'dareNotAllowed'|'writtenInvalid'|'notEnoughPlayers'|'tooManyPlayers'|'noCategory' }`
  - `pointsFor(kind: ChallengeKind, outcome: 'done'|'skipped'): number` — Vérité faite +1, Action faite +2, passe −1.
  - `skipsLeft(state: GameState, playerId: string): number`

- [ ] **Step 1: Tests qui échouent (transitions)** — avec `createSeededRng` et 3 joueurs :
  - `SPIN` depuis `ready` → `spinning`, `turn.answererId` ∉ `playedThisRound`, `turn.askerId === players[askerIndexFor(...)]`, `bottleRotation` conforme à `computeSpin` vers la place du répondant avec 5 à 7 tours entiers.
  - `SPIN_SETTLED` → `choosing` ; un deuxième `SPIN_SETTLED` en `choosing` laisse l'état inchangé (idempotent, pour la réhydratation).
  - `CHOOSE_KIND` → `asking` si `source` ≠ `'system'` ; si `source === 'system'`, tire directement et passe en `challenge`.
  - `PICK_SYSTEM` → `challenge` avec un défi conforme aux limites du répondant ; s'il n'y en a aucun → reste en `asking` avec `turn.noDareAvailable = true`.
  - `PICK_SYSTEM` avec `source === 'custom'` → `GameRuleError('dareNotAllowed')`.
  - `PICK_CUSTOM` d'un défi du poseur de bon type et dans les limites → `challenge` ; défi d'un autre joueur, de mauvais type ou hors limites → `dareNotAllowed`.
  - `PICK_WRITTEN` vide → `writtenInvalid` ; valide → défi `{ category: settings.categories[0], intensity: 1, modes: [settings.mode], authorId: askerId }`.
  - `COMPLETE` → points ajoutés, historique, joueur ajouté à `playedThisRound`, phase `ready` ; quand tous ont joué → `round + 1` et `playedThisRound` vidé ; après le dernier tour → `finished`.
  - `SKIP` → −1 point et `skipped + 1` ; quand `skipsLeft === 0` → `noSkipsLeft`.
  - `RESTART` depuis `finished` → mêmes joueurs et réglages, scores à zéro, round 1, `ready`.
  - Toute action hors de sa phase → `invalidPhase`.
- [ ] **Step 2:** `npm test -- engine/reduce engine/scoring` → FAIL.
- [ ] **Step 3:** Implémenter `reduce` comme un `switch` exhaustif (vérification `never`) ; aucune mutation de l'état d'entrée (test avec `Object.freeze` profond).
- [ ] **Step 4:** Tests → PASS, couverture `src/engine/` ≥ 95 % des lignes (`vitest --coverage`).
- [ ] **Step 5: Commit** `feat(engine): game state machine, scoring and end of game`

### Task 8: Contenu — 8 catégories de défis

**Files:**
- Create: `src/content/categories.ts`, `src/content/dares/{fun,honest,romantic,closer,spicy,night,intimate,noreturn}.json`, `src/content/systemDares.ts`
- Modify: `src/i18n/fr.ts`, `src/i18n/en.ts` (noms et descriptions des catégories)
- Test: `src/content/content.test.ts`

**Interfaces:**
- Produces:
  - `interface CategoryMeta { id: CategoryId; intensity: [Intensity, Intensity]; free: boolean; icon: string /* nom d'icône lucide */ }` ; `CATEGORIES: readonly CategoryMeta[]` dans l'ordre de la Global Constraint.
  - Chaque JSON : `{ id: string; kind: ChallengeKind; intensity: Intensity; modes: PlayMode[]; text: string }[]` ; ids `"<categorie>-t01"`, `"<categorie>-d01"`…
  - `systemDares: readonly Dare[]` (fusion avec `category`).

- [ ] **Step 1: Test qui échoue** — pour chaque catégorie : ≥ 20 `truth` et ≥ 20 `dare` ; ids uniques globalement ; textes uniques ; intensité dans la plage de la catégorie ; `modes` non vide ; texte entre 10 et 200 caractères ; chaque catégorie a au moins 5 défis jouables `remote`.
- [ ] **Step 2:** `npm test -- content` → FAIL.
- [ ] **Step 3:** Rédiger les ≈ 320 textes en français, tutoiement, ton complice et inclusif (pas de genre présumé : « ton/ta partenaire », « la personne à ta gauche »), suggestifs sans être explicites pour les catégories 3–4, aucun défi dangereux, illégal ou humiliant, aucun défi impliquant une personne extérieure au jeu sans son accord. Les défis physiques entre joueurs sont `['nearby']` uniquement.
- [ ] **Step 4:** Tests → PASS.
- [ ] **Step 5:** Exporter `design/defis-a-relire.md` (une section par catégorie) pour la relecture du porteur du projet.
- [ ] **Step 6: Commit** `feat(content): 8 categories of French truths and dares`

### Task 9: Coquille de l'app, routage et porte 18+

**Files:**
- Create: `src/app/router.tsx`, `src/app/RootLayout.tsx`, `src/app/BottomNav.tsx`, `src/app/RequireAge.tsx`, `src/features/onboarding/AgeGateScreen.tsx`, `src/features/home/HomeScreen.tsx`, `src/features/profile/ProfileScreen.tsx`, `src/features/dares/MyDaresScreen.tsx`, `public/404.html` (généré au build)
- Modify: `src/app/App.tsx`
- Test: `src/app/router.test.tsx`, `src/features/onboarding/AgeGateScreen.test.tsx`

**Interfaces:**
- Consumes: Tasks 3 et 4.
- Produces — routes (basename `import.meta.env.BASE_URL`) : `/bienvenue`, `/` (accueil), `/joueurs`, `/joueurs/:playerId`, `/partie/nouvelle`, `/partie`, `/partie/recap`, `/defis`, `/profil`. Barre du bas (Jouer · Joueurs · Mes défis · Profil) sur `/`, `/joueurs`, `/defis`, `/profil` uniquement. Le thème choisi est appliqué via `data-theme` sur `<html>`. Écrans lourds chargés en `lazy`.

- [ ] **Step 1: Tests qui échouent** — sans `ageConfirmedAt`, `/` redirige vers `/bienvenue` ; « J'ai 18 ans ou plus » appelle `confirmAge` et mène à `/` ; « J'ai moins de 18 ans » affiche un message de sortie, sans accès ; la barre du bas n'apparaît pas sur `/partie` ; le changement de langue dans Profil traduit l'accueil ; le choix du thème Ivoire pose `data-theme="ivoire"` sur `<html>`.
- [ ] **Step 2:** Tests → FAIL.
- [ ] **Step 3:** Implémenter ; l'accueil montre « Nouvelle partie », « Reprendre la partie » (seulement si une partie est en cours, cf. Task 12) et aucune statistique fictive. Étape de build qui copie `index.html` vers `404.html`.
- [ ] **Step 4:** Tests → PASS ; `npm run build` OK.
- [ ] **Step 5: Commit** `feat(app): routing, age gate, home, my dares and profile`

### Task 10: Joueurs inscrits sur le téléphone et leurs défis perso

**Files:**
- Create: `src/features/players/playersStore.ts`, `src/features/players/validation.ts`, `src/features/players/PlayersScreen.tsx`, `src/features/players/PlayerEditor.tsx`, `src/features/players/AvatarPicker.tsx`, `src/features/players/LimitsEditor.tsx`, `src/features/dares/CustomDareList.tsx`, `src/features/dares/CustomDareForm.tsx`
- Test: `src/features/players/playersStore.test.ts`, `src/features/players/validation.test.ts`, `src/features/dares/CustomDareForm.test.tsx`

**Interfaces:**
- Consumes: `Player`, `Dare`, `PlayerLimits` (Task 5), `validateWrittenDare` (Task 6), `CATEGORIES` (Task 8).
- Produces:
  - `usePlayersStore` persisté (`av:players`, version 1) : `{ players: Player[]; addPlayer(input: { name: string; avatar: string }): Player; updatePlayer(id: string, patch: Partial<Omit<Player,'id'>>): void; removePlayer(id: string): void; upsertCustomDare(playerId: string, dare: Omit<Dare,'id'|'authorId'> & { id?: string }): void; removeCustomDare(playerId: string, dareId: string): void }`
  - `validatePlayerName(name: string, existing: string[]): { ok: true, name: string } | { ok: false, reason: 'empty'|'tooLong'|'duplicate' }` — trim, 1 à 24 caractères, doublon insensible à la casse et aux accents.
  - Limites par défaut : `{ excludedCategories: [], maxIntensity: 4 }`.

- [ ] **Step 1: Tests qui échouent** — `validatePlayerName(' ', [])` → `empty` ; 25 caractères → `tooLong` ; `'Élodie'` contre `['elodie']` → `duplicate` ; `addPlayer` donne un id unique et les limites par défaut ; `upsertCustomDare` ajoute puis modifie le même id ; `removePlayer` supprime aussi ses défis ; le formulaire de défi perso refuse 2 caractères (message affiché) et enregistre type, catégorie, intensité dans la plage de la catégorie, modes.
- [ ] **Step 2:** Tests → FAIL.
- [ ] **Step 3:** Implémenter les écrans : liste des joueurs (vide → invitation à créer le premier joueur), éditeur (pseudo, avatar emoji, limites, onglet « Mes défis »). Suppression avec confirmation dans un `Sheet` (pas de `window.confirm`).
- [ ] **Step 4:** Tests → PASS.
- [ ] **Step 5: Commit** `feat(players): local roster with limits and custom dares`

### Task 11: Préparation de la partie

**Files:**
- Create: `src/features/game-setup/SetupScreen.tsx`, `src/features/game-setup/SeatOrder.tsx`, `src/features/game-setup/CategoryGrid.tsx`, `src/features/game-setup/SettingsPanel.tsx`, `src/features/game-setup/setupWarnings.ts`
- Test: `src/features/game-setup/setupWarnings.test.ts`, `src/features/game-setup/SetupScreen.test.tsx`

**Interfaces:**
- Consumes: `usePlayersStore` (Task 10), `CATEGORIES` (Task 8), `createGame`, `GameSettings` (Task 7), `useGameStore.start` (Task 12).
- Produces: `setupWarnings(players: Player[], categories: CategoryId[]): { playerId: string; code: 'noAllowedCategory' }[]`.

- [ ] **Step 1: Tests qui échouent** — `setupWarnings` signale un joueur dont les limites excluent (par catégorie ou intensité max) toutes les catégories choisies, et ne signale rien sinon ; l'écran désactive « Lancer » avec < 2 joueurs ou 0 catégorie ; l'avertissement s'affiche sans bloquer le lancement ; les réglages par défaut sont `rounds: 3`, `timerSeconds: 0`, `source: 'both'`, `maxSkips: 3`, `mode: 'nearby'`, `picker: 'bottle'` (proposer `'random'` par défaut au-delà de 8 joueurs).
- [ ] **Step 2:** Tests → FAIL.
- [ ] **Step 3:** Implémenter en 3 étapes sur un écran (joueurs présents + ordre des places par glisser-déposer accessible au clavier → catégories avec intensité visible → réglages) ; « Lancer » appelle `useGameStore.start(...)` et navigue vers `/partie`.
- [ ] **Step 4:** Tests → PASS.
- [ ] **Step 5: Commit** `feat(game-setup): players, seat order, categories and settings`

### Task 12: La table de jeu

**Files:**
- Create: `src/features/game/gameStore.ts`, `src/features/game/GameScreen.tsx`, `src/features/game/Table.tsx`, `src/features/game/Seat.tsx`, `src/features/game/Bottle.tsx`, `src/features/game/KindChooser.tsx`, `src/features/game/AskerPanel.tsx`, `src/features/game/ChallengeCard.tsx`, `src/features/game/CountdownRing.tsx`, `src/lib/feedback.ts`
- Test: `src/features/game/gameStore.test.ts`, `src/features/game/GameScreen.test.tsx`

**Interfaces:**
- Consumes: moteur (Tasks 5–7), `systemDares` (Task 8), `useSettingsStore` (Task 4).
- Produces:
  - `useGameStore` persisté (`av:game`, version 1) : `{ game: GameState|null; error: GameRuleError['code']|null; start(input: { settings: GameSettings; players: Player[] }): void; dispatch(action: GameAction): void; quit(): void }` — `dispatch` appelle `reduce` avec `Math.random` (ou `createSeededRng` si `?seed=` est présent hors production) et stocke `error` au lieu de lever.
  - `feedback.spinTick()`, `feedback.reveal()`, `feedback.success()` — sons WebAudio courts + `navigator.vibrate` gardés, respectant `sound`/`haptics`.

- [ ] **Step 1: Tests qui échouent** —
  - store réhydraté avec `phase: 'spinning'` → `GameScreen` envoie `SPIN_SETTLED` au montage et affiche le choix Action/Vérité pour le même répondant ;
  - `dispatch` d'une action invalide met `error` à `invalidPhase` sans lever ;
  - en `asking` avec `noDareAvailable`, l'écran affiche « Plus de défis pour ces réglages » avec « J'écris maintenant » et « Passer » ;
  - `AskerPanel` n'affiche « Un de mes défis » que si le poseur a des défis perso compatibles, et n'apparaît pas si `source === 'system'` ;
  - `ChallengeCard` reçoit la rotation `cardRotationFor(seatAngle(répondant))` ;
  - avec `timerSeconds: 30`, l'anneau de décompte s'affiche et annonce « Temps écoulé » à 0 sans changer la phase ;
  - « Passer » est désactivé quand `skipsLeft === 0`.
- [ ] **Step 2:** Tests → FAIL.
- [ ] **Step 3:** Implémenter : places réparties sur le cercle avec `seatAngle` ; table et bouteille en facettes : rendu 3D (three.js, chargé en `lazy` uniquement sur l'écran de jeu, hors budget JS initial) avec repli SVG en facettes si WebGL indisponible ou animations réduites ; bouteille animée avec Motion jusqu'à `bottleRotation` (≈ 4 s, courbe qui ralentit ; instantané si animations réduites) puis `SPIN_SETTLED` à la fin de l'animation ; avec `picker: 'random'`, un balayage lumineux de place en place remplace la bouteille ; répondant et poseur mis en évidence (couleurs Vérité/Action) ; carte défi orientée vers le répondant ; quitter la partie via un `Sheet` de confirmation.
- [ ] **Step 4:** Tests → PASS ; vérification manuelle sur 390×844 et 1280×800, avec 2, 5 et 12 joueurs (captures dans la PR).
- [ ] **Step 5: Commit** `feat(game): table, bottle, asker panel and challenge card`

### Task 13: Récap de fin et statistiques locales

**Files:**
- Create: `src/features/game/RecapScreen.tsx`, `src/features/game/awards.ts`, `src/features/players/statsStore.ts`
- Modify: `src/features/players/PlayerEditor.tsx` (affichage des stats réelles)
- Test: `src/features/game/awards.test.ts`, `src/features/players/statsStore.test.ts`

**Interfaces:**
- Consumes: `GameState`, `PlayerScore` (Task 7).
- Produces:
  - `computeAwards(state: GameState): { award: 'bravest'|'truthKing'|'escapeArtist'|'winner'; playerId: string }[]` — `winner` = plus de points ; `bravest` = plus d'actions faites ; `truthKing` = plus de vérités faites ; `escapeArtist` = plus de passes (seulement si ≥ 1) ; égalité → le premier dans l'ordre des places ; pas de titre si personne n'est éligible.
  - `useStatsStore` persisté (`av:stats`) : `recordGame(state: GameState): void` (une seule fois par `state.id`), `statsFor(playerId): { games: number; done: number; skipped: number }`.

- [ ] **Step 1: Tests qui échouent** — cas d'égalité, cas sans passe (pas de `escapeArtist`), `recordGame` appelé deux fois avec le même id ne compte qu'une partie.
- [ ] **Step 2:** Tests → FAIL.
- [ ] **Step 3:** Implémenter l'écran récap (classement animé, titres, « Rejouer » → `RESTART`, « Accueil » → `quit`) ; le passage en `finished` redirige vers `/partie/recap` et enregistre les stats.
- [ ] **Step 4:** Tests → PASS.
- [ ] **Step 5: Commit** `feat(game): end-of-game recap, awards and local stats`

### Task 14: PWA, budget de performance, parcours complet et déploiement

**Files:**
- Create: `public/icons/*` (générées depuis `design/logo.svg`), `scripts/check-bundle-size.mjs`, `tests/e2e/one-phone-game.spec.ts`, `.github/workflows/deploy.yml`
- Modify: `vite.config.ts` (vite-plugin-pwa), `.github/workflows/ci.yml`, `README.md`

**Interfaces:**
- Consumes: tout ce qui précède.

- [ ] **Step 1: Test e2e qui échoue** — `one-phone-game.spec.ts` (viewport mobile, `reducedMotion: 'reduce'`, `?seed=7`) : confirmer l'âge → créer 3 joueurs → l'un crée un défi perso Action → nouvelle partie, 1 tour, catégories `fun` + `honest` → pour chaque joueur : lancer, choisir, le poseur choisit système / un de ses défis / écrit un défi, « Fait » ou « Passer » → l'écran récap s'affiche avec un gagnant → recharger la page en pleine partie (dans un second test) reprend au même point.
- [ ] **Step 2:** `npm run test:e2e` → FAIL tant que le parcours n'est pas branché ; corriger jusqu'à PASS.
- [ ] **Step 3:** PWA : manifeste (`name: "Action ou Vérité"`, `short_name: "Action·Vérité"`, `lang: "fr"`, `display: "standalone"`, couleurs issues des tokens, `start_url`/`scope` = base), mise en cache des ressources (jouable hors ligne après première visite).
- [ ] **Step 4:** `check-bundle-size.mjs` : somme gzip des JS chargés par `index.html` ≤ 200 Ko, sinon code de sortie 1 ; ajouté à la CI avec Playwright.
- [ ] **Step 5:** `deploy.yml` : build et publication GitHub Pages sur push de `main`.
- [ ] **Step 6:** Vérifier : `npm run lint && npm run typecheck && npm test && npm run build && node scripts/check-bundle-size.mjs && npm run test:e2e` → tout passe ; Lighthouse mobile sur `npm run preview` : Performance ≥ 90, Accessibility ≥ 95 (rapport joint à la PR).
- [ ] **Step 7: Commit** `feat: installable PWA, bundle budget, e2e game flow and Pages deploy`
