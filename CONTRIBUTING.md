# Contributing

Chenne Mane welcomes improvements to gameplay, accessibility, teaching, and the
documentation of regional traditions.

## Development

Use Node.js 22 or newer and Python 3:

```sh
npm ci
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Open `http://127.0.0.1:4173`. Edit the files in `dist/` and refresh the page.
These are the original website files and are committed to Git. There is no build
step. Serve only `dist/`; keep documentation and development tools outside it.

The optional source export uses `scripts/public-files.json` as a file allowlist.
Update it when adding or renaming source files. Keep credentials and local
configuration out of that list.

## Pull requests

1. Open an issue for substantial changes to agree on the scope.
2. Keep each pull request focused. Describe the problem, the changed behavior,
   and how you verified it. Include screenshots for visible changes.
3. Run `npm run format` and `npm run check`.
4. For layout or input changes, check phone portrait and desktop layouts,
   keyboard operation, and reduced motion in a browser.

Keep game transitions deterministic, preserve all 56 shells, and keep the rules
engine independent of the DOM. Add a regression test for rules or lifecycle fixes.
Explain why any new dependency or remote service is needed.

## Rules and culture

The implemented game is one documented coastal family variant. When proposing a
rule change, describe the variant and provide a source or clearly identify an oral
account. Keep traditional rules distinct from digital settlement conventions.
See [game rules and sources](docs/rules.md).

## Assets and security

Include provenance and license details for new media. Disclose AI-generated artwork
and retain applicable attribution. Never commit credentials, private recordings,
or personal information. See [ASSETS.md](ASSETS.md) and [SECURITY.md](SECURITY.md).

Contributions use this repository's MIT license, except for assets that explicitly
retain a separate compatible license and attribution.
