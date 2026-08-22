# kedzie-dev.github.io

This context describes the language used for the blog's portfolio and navigation experience.

## Language

**Kedzie Dev Atlas**:
The blog homepage experience that presents DevOps/SRE topics as a clickable map for finding related posts, labs, and portfolio cases.
_Avoid_: homepage map, tech map hero, wizard map

**Atlas Visual Language**:
The site-wide visual language derived from Kedzie Dev Atlas, used across the homepage, section lists, article pages, and supporting navigation.
_Avoid_: Kedzie Dev Atlas

**Night Chart**:
The dark appearance of the Atlas Visual Language for low-light reading. It presents the same content and navigation as the parchment appearance.
_Avoid_: separate dark site, alternate content mode

**Atlas Landmark**:
A clickable domain-level location inside Kedzie Dev Atlas, such as GitOps, Kubernetes, Traffic, or Observability, that groups related posts and labs.
_Avoid_: post marker, logo marker, school

**Content Collection**:
A canonical URL collection organized by content format, such as operational notes, incident labs, portfolio cases, or the Technology Evolution Map. A resource belongs to one collection even when multiple Atlas Landmarks link to it.
_Avoid_: map region, technology category

**Operational Note**:
A technical article that records a focused operational behavior, decision, or trade-off. Operational Notes are the canonical content of the `/notes/` Collection.
_Avoid_: Operational Case, map annotation

**Incident Lab**:
An interactive scenario that lets a reader inspect operational signals and decisions. Incident Labs are canonical resources in the `/labs/` Collection.
_Avoid_: Operational Case, technical article

**Operational Case**:
A standalone portfolio resource that presents an operational problem, the decision made, its verification criteria, and its outcomes. It may link to supporting Notes and Incident Labs but is not a copy of them.
_Avoid_: post card, portfolio section, technology tutorial

**Atlas Classification**:
The explicit assignment of one or more Atlas Landmarks to a content item. It lets one resource appear in several relevant map regions without duplicating the resource.
_Avoid_: automatic tag inference, copied map links

**Landmark Registry**:
The canonical catalog of Atlas Landmarks used to classify content and present map navigation. Content refers to its landmarks by identity; it does not redefine them.
_Avoid_: per-post map configuration, copied landmark metadata

**Technology Evolution Map**:
The existing `/tech-evolution-map/` experience that explains historical relationships between technologies; it is separate from Kedzie Dev Atlas.
_Avoid_: Kedzie Dev Atlas
