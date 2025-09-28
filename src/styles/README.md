# Semantic Helpers

This folder contains `semantic-helpers.css` which maps short, descriptive class names to the Tailwind utility groups currently used across the main pages. The goal is to make quick global edits easier without changing the markup in many files.

How to use

- Edit `src/styles/semantic-helpers.css` to change spacing, typography or layout site-wide.
- Keep names short and descriptive (e.g. `.page-container`, `.hero-text`).
- After editing, rebuild dev server to see changes.

Planned next steps

- Expand mappings to other pages/components (CreativeWriting, AlbumCard, etc.).
- Optionally run a repo-wide replacement script once you're happy with the initial set of classes.
