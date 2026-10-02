# Repository instructions

## Project

This is Paolo Rossi's multilingual Astro CV site. It publishes Italian, English,
and German pages plus public PDF versions through GitHub Pages.

Use `README.md` for the project overview. Use `MANUTENZIONE.md` when a task
touches CV content, translations, photos, privacy, PDFs, or deployment.

## Source layout

- `src/content/cv/{it,en,de}.yml`: localized CV and annex content.
- `src/content/site.yml`: shared identity, contact, date, photo, and site data.
- `src/components/`, `src/layouts/`, `src/pages/`: Astro UI and routes.
- `src/styles/global.css`: shared screen and print styling.
- `scripts/`: validation, privacy, build, and PDF utilities.
- `tests/site.spec.ts`: responsive and accessibility coverage.
- `dist/`, `.astro/`, `tmp/`, and reports: generated output; do not edit them.
- `private/`: ignored local data containing the telephone number and private
  PDFs. Treat everything in this directory as sensitive and never publish it.

## Editing rules

- Keep facts aligned across the three locale files. For a substantive CV
  change, update Italian, English, and German together unless the request is
  explicitly language-specific.
- Preserve section and annex `id` values, annex numbers, ordering, and
  references across all locales.
- Keep each locale in its own language. Preserve requested proper names and
  official organization names exactly.
- Do not add HTML to YAML content.
- Keep `github_url` and `github_username` synchronized when either changes.
- Run `npm run update-date` after changing CV content. Do not update the date
  for tooling, documentation, or style-only changes.
- Never place an address, postal code, telephone number, or full birth date in
  tracked files or public output. A telephone number is allowed only through
  the existing private-PDF workflow.
- Re-encode replacement profile photos without EXIF, GPS, or XMP metadata.
- Keep the `/curriculum-vitae` base path unless the repository name changes.
- Use npm and keep `package-lock.json` synchronized with dependency changes.

## Verification

Run the narrowest relevant checks, then expand when the change affects output:

- Content, configuration, or scripts: `npm run check`.
- UI, responsive behavior, or accessibility: `npm run verify`.
- Production site or public PDFs: `npm run build`.
- Photo changes: `npm run check:privacy` in addition to the relevant checks.
- Private-PDF behavior: `npm run pdf:private` only when the task requires it;
  never expose `private/contact.yml` or generated private PDFs.

Report which checks ran and any checks that could not run.

## Git workflow

- Inspect `git status` and the relevant diff before editing and before handing
  work back. Preserve unrelated user changes.
- Do not commit, push, open a pull request, delete branches, or rewrite history
  unless Paolo explicitly asks for that action. Confirm whether he wants Codex
  to publish the work or plans to publish it himself.
- Whenever ChatGPT creates a Git commit, include a `Co-authored-by` trailer
  naming ChatGPT and the model used.
- Never rewrite published history merely to rename or remove historical tool or
  assistant attribution.
