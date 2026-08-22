# Kedzie Dev Atlas: Stitch Prompt Sequence

Use [DESIGN.md](../DESIGN.md) as the persistent visual-system input. Do not paste the whole document into every prompt.

This sequence follows Stitch's generate, compare variants, focused edit, then prototype workflow. Each prompt describes one screen or one targeted change. Do not ask Stitch to create a complete site, mobile behavior, content migration, and production Hugo code in one request.

## Input Setup

Attach:

- `DESIGN.md` as the visual-system contract.
- `harrypotter.jpg` only as an antique-cartography mood reference.
- Kubernetes, Argo CD, Docker, Jenkins, and Grafana assets only as landmark identifiers.

Optionally add the public repository and current site URL as content and reading-experience context. They do not replace the prompt below. Do not upload the Harry Potter image unless you have the right to use it as a reference; never request a reproduction of it.

## 1. Generate One Desktop Hero

Paste this as the first screen prompt:

```text
Create one desktop homepage hero named "Kedzie Dev Atlas" for a Korean DevOps/SRE publication.

User goal: a technical evaluator should immediately understand the blog's operating domains and be able to begin exploring them through a map. Follow the attached DESIGN.md for visual-system rules.

Make the hero a completed atlas composition, not a white canvas with logos. The map fills most of a 1440px-wide first viewport. A central island contains a Kubernetes Citadel. The upper-left sea contains an Argo CD marker. A lower coast contains Docker Harbor. Connect Docker Harbor, Kubernetes Citadel, GitOps Lighthouse, and the Argo CD marker with visible ink routes. Add an observatory, traffic gate, CI/CD workshop, cloud keep, waves, coastline, bridges, and a compass rose as supporting geography.

Use the attached technical logos only as small identifiers integrated into their matching landmark. Every landmark needs a readable Korean-first label; no logo may float alone.

Use this exact copy:
- title: Kedzie Dev Atlas
- subtitle: Kubernetes, GitOps, SRE 운영 기록을 지도로 탐색합니다.
- primary action: 지도 탐색
- secondary action: 대표 사례 보기

Show Argo CD as the selected landmark and include one compact annotation panel with a one-sentence description and three generic link rows labelled Notes, Incident Labs, and Cases. Do not invent article titles, dates, companies, or outcomes.

The header contains kedzie.dev and Cases, Incident Labs, Tech Map, Notes. This is the Atlas homepage, so Tech Map must not be shown as active. Do not design the rest of the homepage or mobile screen yet.

The attached antique-map image is only a reference for paper, ink density, coastlines, and wave texture. Do not copy any Harry Potter names, crests, buildings, symbols, or layout.
```

## 2. Compare Map Composition Variants

After the first screen exists, generate two or three variants. Change only map composition; preserve the visual system and copy.

```text
Create 3 variants of this selected desktop hero. Preserve its typography, palette, header, copy, and annotation-panel style. Change only the atlas composition:

1. central-island composition with sea on the upper-left;
2. long diagonal coastline from Docker Harbor to Argo CD sea marker;
3. compact archipelago with Kubernetes as the dominant central landmass.

In every variant, routes must make Docker Harbor → Kubernetes Citadel → GitOps Lighthouse → Argo CD visually readable. Reject empty space and floating logo stickers.
```

Pick the variant whose map remains legible at a glance before adding more content.

## 3. Repair the Current Weak Screen

Use this only on the current Stitch screen shown in the review screenshot:

```text
Edit only the atlas canvas in this screen. Preserve the header, title block, serif/sans typography, paper palette, and button placement.

Replace the mostly empty field and scattered icon stickers with a dense, coherent atlas: a central Kubernetes island, upper-left sea with waves and an Argo CD sea landmark, Docker Harbor on a lower coast, GitOps Lighthouse, CI/CD workshop, observatory, traffic gate, cloud keep, coastline, bridges, compass rose, and ink routes. Attach every technology logo to a landmark; remove freestanding logo boxes. Make at least two-thirds of the canvas meaningful map geography.

Keep Tech Map inactive because this is the Kedzie Dev Atlas homepage. Do not invent new posts, dates, incident titles, or portfolio claims. Do not change the lower content area in this edit.
```

## 4. Add the Remaining Landmark States

After a composition is selected, edit one interaction state at a time:

```text
Keep the selected hero composition unchanged. Add a visible selected state for Kubernetes Citadel and its compact paper annotation panel. The panel contains only: Kubernetes 성채, one Korean sentence about workload orchestration and cluster operation, and three link rows labelled Notes, Incident Labs, Cases. Do not change other landmarks, the header, copy, or map geometry.
```

Repeat for GitOps, Docker, CI/CD, Traffic, Observability, and Cloud Runtime. Keep Argo CD as the strongest sea signature, but do not turn it into a character illustration.

## 5. Generate Mobile From the Chosen Hero

```text
Create one mobile screen derived from the selected desktop Kedzie Dev Atlas hero. Preserve the same tokens, landmarks, and labels.

Show a simplified, legible map preview first, then a vertical list of the same landmarks. Selecting a list item opens a bottom-sheet annotation panel. Keep labels at readable size, make all targets touch-friendly, and do not rely on hover. Do not add desktop-only blank space or shrink every map label to fit.
```

## 6. Create Follow-on Screens and Prototype

Generate `Cases`, `Incident Labs`, and `Notes` as separate screens after the hero is approved. Use real repository content or clearly marked placeholders. Connect the selected home landmark to one collection screen in Stitch's prototype so the discovery flow can be reviewed before code export.

Treat HTML/CSS export as design handoff. The Hugo theme, content model, aliases, accessibility behavior, and final production code remain repository implementation work.
