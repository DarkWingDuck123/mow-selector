# Man O'War Fleet Builder

An unofficial fleet builder web app for the Man O'War tabletop game by Games Workshop. Supports multiple factions, spell cards, crew management, fleet validation, and printable ship cards.

## Features

- Build and manage fleet lists across multiple factions
- Printable ship, spell, and crew cards
- Fleet validation against faction rules
- Multiple game rulesets (The Original Series and others)
- Black & white print mode

## Running Locally

```bash
npm install
npm start
```

The app runs at http://localhost:3000.

## Pushing and Deploying

### Push to GitHub

```bash
git push
```

This pushes to `origin/main` at https://github.com/DarkWingDuck123/mow-selector.git.

### Deploy to GitHub Pages

```bash
npm run deploy
```

This runs `npm run build` (production build into `build/`) and then publishes that directory to the `gh-pages` branch via the `gh-pages` package. The live site updates at the GitHub Pages URL within a minute or two.

## License

The source code is released under the [MIT License](LICENSE).

## Disclaimer

Man O'War is a trademark of Games Workshop Ltd. This is an unofficial fan project and is not affiliated with or endorsed by Games Workshop in any way. All game rules, faction names, unit names, and related content are the intellectual property of Games Workshop Ltd.
