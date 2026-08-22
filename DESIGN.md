---
version: "alpha"
name: "Kedzie Dev Atlas"
description: "A Korean DevOps/SRE publication with an operational-atlas visual identity."
colors:
  primary: "#211D16"
  on-primary: "#FFF9EB"
  paper: "#F4ECD5"
  paper-raised: "#FFF9EB"
  ink: "#211D16"
  ink-muted: "#665F52"
  line: "#B9AF96"
  sea: "#245A5D"
  sea-deep: "#123B42"
  brass: "#B97B08"
  brass-deep: "#815400"
  signal: "#9F2019"
typography:
  display:
    fontFamily: "Georgia, 'Times New Roman', serif"
    fontSize: "3.25rem"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "0px"
  heading:
    fontFamily: "Georgia, 'Times New Roman', serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0px"
  body-md:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "0px"
  label:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0.04em"
rounded:
  none: "0px"
  sm: "2px"
  md: "4px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  app-shell:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "{spacing.lg}"
  button-primary:
    backgroundColor: "{colors.brass}"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
    padding: "12px"
  button-primary-hover:
    backgroundColor: "{colors.brass-deep}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "12px"
  annotation-panel:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "{spacing.md}"
  landmark-water:
    backgroundColor: "{colors.sea}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
  landmark-route:
    backgroundColor: "{colors.sea-deep}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.none}"
  metadata:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.none}"
  divider:
    backgroundColor: "{colors.line}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
  incident-signal:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
---

## Overview

Kedzie Dev Atlas is a serious operational publication, not a fantasy game or a generic SaaS product. Its visual language combines an antique field atlas with the discipline of an engineering notebook: a warm paper ground, deliberate ink lines, restrained maritime color, and evidence-first reading.

Use the visual language across homepage, collections, articles, and supporting navigation. The homepage may use a map as navigation; long-form articles remain calm, reading-first documents.

Korean is the primary UI language. Keep technology and product names such as Kubernetes, Argo CD, Docker, Grafana, and Jenkins in English.

## Colors

- **Paper** is the default page ground. It may have a subtle grain, but never a noisy texture behind body text.
- **Ink** carries headings, body text, borders, and cartographic linework. Maintain strong contrast and avoid pure white canvases.
- **Sea** and **sea-deep** distinguish delivery, reconciliation, and route-oriented elements. Use them as a supporting domain color, not a full-page gradient.
- **Brass** is the primary interactive accent for selected navigation and primary actions. It is never decorative confetti.
- **Signal** is reserved for incidents, alerts, and critical state.
- **Line** is a quiet structural border. Prefer one-pixel dividers over shadows or floating containers.

## Typography

- Display and section headings use the serif display token with editorial weight, not theatrical fantasy lettering.
- Korean body copy uses the system sans-serif stack at a relaxed reading line height.
- Landmark labels, dates, tags, and technical metadata use the mono label token sparingly.
- Do not use negative letter spacing. Do not rely on an externally hosted font for readability.

## Layout

- Favor full-width bands with a constrained reading column; do not place page sections inside decorative cards.
- A map is a dense, legible navigation surface. Its land, sea, routes, and landmarks must occupy the composition rather than float in unused space.
- Keep the header thin. Keep key actions close to the content they operate on.
- On mobile, preserve the information hierarchy with a simplified map and a readable landmark list; do not shrink desktop labels into unreadable ornaments.

## Elevation & Depth

- Default elevation is flat paper with ink borders.
- Annotation panels may use one subtle paper lift and a light shadow, but no glassmorphism.
- Do not stack cards inside cards. Do not use glow, bokeh, or large blurred gradients as decoration.

## Shapes

- Corners are square to lightly rounded. Use `sm` for controls and labels, `md` for annotation panels.
- Buttons, tags, map labels, and metadata have stable dimensions. Their text must not change the layout.
- Map routes, coastlines, and compass details use ink-like lines, not rounded gradient strokes.

## Components

- **Header:** paper or transparent-paper treatment, ink wordmark, simple text navigation, and a brass active state only for the current screen.
- **Primary button:** brass fill, ink text, compact icon where useful. Secondary buttons are outlined paper controls.
- **Atlas Landmark:** a named architectural or geographic location with a readable Korean label. A technology logo may identify the landmark, but is never a freestanding sticker or the only label.
- **Annotation panel:** compact paper note containing landmark name, a one-sentence explanation, and related content links. It is triggered by click, keyboard focus, and tap; never hover alone.
- **Collection row:** an evidence-led entry with title, short summary, labels, and a quiet divider. Use it for Notes, Incident Labs, and Operational Cases instead of generic marketing cards.
- **Incident signal:** small and red. Reserve it for real incident or warning context.

## Do's and Don'ts

Do:

- Make the map useful as a discovery interface with visible routes and selectable named landmarks.
- Use real content supplied by the repository or prompt. Use placeholders only when clearly marked as placeholders.
- Use attached antique-map imagery only for broad cartographic mood, line density, paper grain, coastlines, and wave texture.
- Keep links, labels, selected states, and keyboard focus obvious.

Don't:

- Copy Harry Potter names, crests, house symbols, exact buildings, exact layouts, or distinctive map details.
- Make a blank white field with scattered technology logos.
- Invent blog posts, dates, incident histories, companies, or operational outcomes.
- Treat the homepage as a dashboard, a game interface, or a marketing landing page.
- Depend on hover-only UI, tiny labels, logo-only landmarks, purple gradients, or nested rounded cards.
