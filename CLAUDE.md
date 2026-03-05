# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Man O'War Fleet Builder — a React SPA for building and managing fleet lists for the "Man O'War" tabletop game system. Supports multiple game rulesets and factions.

## Commands

- `npm start` — Dev server on http://localhost:3000
- `npm test` — Jest + React Testing Library in watch mode
- `npm run build` — Production build

## Architecture

**Stack:** React 18 (CRA), Redux Toolkit, React Router v6, react-intl for i18n. Plain JavaScript (no TypeScript).

**Routing** (`src/App.js`): Key routes are `/` (home/ruleset chooser), `/Builder/:ruleset/:factionId/:listId` (fleet builder), `/RuleSetChooser`.

**State Management** (`src/store.js` + `src/state/`): Redux Toolkit with slices for:
- `lists` — Fleet lists with units, persisted to localStorage under `mowb.lists`
- `factions` — Faction/nation data
- `units` — Unit data
- `errors` — Error tracking
- `rulesIndex` — Rules display state

**Data Loading:** Game data lives as static JSON in `public/games/{ruleset}/{faction}/`. Loaded at runtime via `src/utils/fetcher.js` which uses AbortController and appends `?v=${REACT_APP_VERSION}`. Faction metadata is in `src/assets/factions.json`.

**Component Structure:** Each component has its own directory under `src/components/` with colocated `.js`, `.css`, and `index.js` files. Uses PropTypes for props validation.

**i18n:** react-intl with translations in `src/i18n/` (en.json, pi.json). Language detected from localStorage (`lang` key), then `navigator.language`, defaulting to "en". Supported: en, pi, de, fr, es, it, pl.

**Styling:** CSS variables defined in `src/App.css` root scope (colors, fonts). Component styles colocated. Uses `classnames` library for conditional classes.
