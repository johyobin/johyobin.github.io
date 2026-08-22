# Adopt a self-owned Kedzie Atlas theme

The blog will replace Blowfish with an independent `kedzie-atlas` Hugo theme so Atlas Visual Language can govern the whole site rather than be layered over an opinionated third-party theme. During migration, Kedzie Atlas may use Blowfish only as a short-lived fallback for unimplemented templates; it must be removed after feature-parity verification because Blowfish currently reports a Hugo version compatibility warning.

## Consequences

- Kedzie Atlas owns the base layout, navigation, list and single-page templates, assets, and accessibility behavior.
- Existing reader capabilities, including search, code presentation, table of contents, Mermaid, Incident Labs, the simulator, and Technology Evolution Map, remain required.
- The styling toolchain is intentionally undecided until the actual Stitch output is reviewed; it may be local CSS or a locally compiled Tailwind build, but no client-side framework is required.
