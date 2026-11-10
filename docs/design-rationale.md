# Design rationale

This file is a living document, appended to at the end of each phase
(Requirement 25.2, 25.8). It records every place the build deviates from
the low-fidelity wireframe or from a literal reading of the brief, plus
the reasoning for it, in plain language a student can defend in a viva.
It will also grow a short "future work" section once later phases reach
the features that are deliberately deferred (`job_tasks`, suppliers,
payments, dark mode, a real vector logo).

## Phase 1 — Scaffold, tokens, layout shell, i18n, auth

**Logo handling (design §5.7).** `public/rjm-logo.jpg` is a raster JPG with
a black background and yellow "RJM FURNITURE" lettering — colours that
belong to neither the Dusk/Navy/Orange palette nor the accessible status
set. A JPG also has no transparent background, so placing it directly on a
white card would show a hard black rectangle that reads as a layout
mistake rather than a brand choice. `BrandLogo` instead places the image
inside a Midnight Navy rounded tile (`rounded-lg p-2`) at a fixed render
size (40 × 40 px in the sidebar and top bar, 64 × 64 px on the login card)
with `alt="RJM Furniture logo"`, so the black edge reads as intentional and
nothing shifts layout while the image loads. The same tile keeps the logo
legible in high-contrast mode, where the surrounding chrome turns pure
white. **Recommendation for after the deadline:** export an SVG or
transparent PNG of the wordmark and swap the file — only `BrandLogo`
touches the asset, so nothing else in the app changes. No alternative logo
was invented.

**Sidebar additions beyond Requirement 6.1's seven-item wireframe list
(design §20, "Sidebar navigation").** Two items were added to the sidebar
that the wireframe does not draw:

- **Customers**, as an indented sub-item of Job Orders rather than a new
  top-level entry. The data model needs a `customers` table because every
  job order references one, and those records need somewhere to live;
  nesting it under Job Orders keeps the wireframe's seven top-level items
  in their settled order instead of renumbering the list.
- **Feedback**, as item 9 after Users. The brief asks for a Feedback /
  Observations review page beyond the ten wireframe screens, and burying
  that page under Settings would make an indicator-22 deliverable hard for
  the professor to find during grading.

Users at position 8 is Requirement 6.3's own screen, not a deviation.

## Phase 2 onward

_Appended as each later phase closes out (tasks 2.18, 3.6, 4.6, 5.8, 6.10,
6.17)._
