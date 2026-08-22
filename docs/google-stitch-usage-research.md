# Google Stitch 사용 방식 조사

조사일: 2026-08-22

## 결론

Stitch는 한 번의 긴 명세로 완성된 웹사이트를 구현하는 도구보다, **화면을 만들고, 변형을 비교하고, 선택한 화면을 대화로 편집하는 디자인 캔버스**에 가깝다. 초기 입력은 맥락을 주는 재료이고, `DESIGN.md`는 페이지 요구사항 문서가 아니라 재사용할 **시각 시스템 규약**이다. 따라서 Atlas 작업은 다음 세 종류를 분리해야 한다.

1. `DESIGN.md`: 토큰, 타이포그래피, 컴포넌트 규칙, 금지 사항.
2. 화면 프롬프트: 이번에 만들 단 하나의 화면, 사용자 목표, 구성, 검증 기준.
3. 콘텐츠/구현 계약: Hugo URL, front matter, Landmark와 글의 연결, 구현 제약. 이는 Stitch 입력의 중심이 아니라 저장소 문서에 둔다.

현재 334행 `DESIGN.md`는 1, 2, 3을 모두 포함한다. Stitch의 공개 `DESIGN.md` 규격과 맞추려면 디자인 시스템과 화면 프롬프트를 분리하는 편이 낫다.

## 시작 화면의 입력 해석

2026-08-22에 확인한 Stitch의 “내 디자인으로 시작하기” UI에는 `DESIGN.md`, 파일(코드·이미지·글·로고), 공개 GitHub 저장소, 웹사이트 URL, 추가 안내 입력이 있다. 이 정확한 입력 우선순위는 공개 공식 문서에서 찾지 못했다. 아래 용도는 UI와 공개 제품 설명에 근거한 실무 해석이며, 보장된 동작 계약은 아니다.

| 입력 | 권장 역할 | Atlas에서의 사용 |
| --- | --- | --- |
| `DESIGN.md` | 재사용할 디자인 규칙 | 색·서체·간격·테두리·라벨·패널 규칙만 둔다. 화면의 전체 IA나 URL은 넣지 않는다. |
| 이미지·로고 | 시각 참조 또는 특정 자산 | 지도 이미지는 질감/밀도 참고, 기술 로고는 해당 랜드마크의 식별 자산으로 제한한다. |
| 코드 | 이미 존재하는 구체적 UI 패턴 | Hugo 스냅샷이나 Stitch가 내보낸 HTML을 다음 반복의 기준 화면으로 쓸 때만 추가한다. |
| 공개 저장소 | 콘텐츠·구현 맥락 | 현재 블로그의 문체와 실제 콘텐츠를 확인시키는 보조 자료다. 저장소 URL만으로 화면 요구사항을 대신하지 않는다. |
| 웹사이트 URL | 기존 브랜드/레이아웃 참조 | `kedzie-dev.github.io`의 현재 정보 밀도와 읽기 화면을 참고시키되, 새 Atlas 홈을 복제하라는 뜻은 아니라고 적는다. |
| 추가 안내 | 지금 생성할 화면의 목표 | 한 화면의 목적, 독자, 핵심 구성, 성공 기준을 짧게 적는다. |

Google은 Stitch 캔버스에 이미지, 텍스트, 코드 등을 맥락으로 넣을 수 있다고 설명하지만, 위 입력별 우선순위나 병합 규칙은 공개하지 않았다. 따라서 서로 충돌하는 지시는 넣지 말고, 화면 프롬프트에서 `DESIGN.md`가 시각 규칙의 기준임을 한 줄로 명시한다.[^vibe]

## 권장 생성 루프

1. **디자인 시스템을 먼저 고정한다.** `DESIGN.md`에 기계 판독 가능한 토큰과 그 사용 이유를 둔다. Google의 공개 규격은 YAML front matter의 토큰과 Markdown rationale의 두 층을 정의하며, 토큰을 규범값으로 본다.[^designmd]
2. **첫 생성은 데스크톱 Atlas hero 한 화면만 요청한다.** ‘홈 전체’, 모바일, 사례 목록, Hugo 구현을 동시에 요구하지 않는다. 대상 독자, 탐색 목적, 지도 구도, 첫 화면에서 확인할 성공 조건만 적는다.
3. **구도 변형을 2~3개 비교한다.** Stitch SDK는 화면의 layout, color scheme, images, font, text content 축을 골라 1~5개 variant를 만들 수 있다. 지도의 육지/바다/항로 구성은 이 단계에서 고른다.[^sdk]
4. **선택한 화면을 한 가지 축씩 편집한다.** 예: ‘Kubernetes 성채를 지도 중심으로 키우고 Docker 항구와 Argo CD 해역을 항로로 연결한다.’ 이어서 ‘선택 상태 annotation panel만 추가한다.’ 전체 재설계를 매번 요구하지 않는다.
5. **모바일은 선택된 데스크톱 화면에서 별도 생성한다.** 지도 축소본과 landmark 목록이라는 모바일 정보 구조를 요청한다.
6. **Cases/Labs/Notes는 별도 화면으로 만든다.** 이후 Stitch의 prototype 연결 기능으로 홈 landmark → 상세 화면 흐름을 확인한다.[^vibe]
7. **코드는 디자인 handoff로 취급한다.** Stitch가 CSS/HTML 및 Figma로 내보낼 수 있지만, Hugo 템플릿·콘텐츠 모델·접근성·빌드 호환성을 보장하는 프로덕션 구현물은 아니다.[^launch][^sdk]

## `DESIGN.md`에 맞는 내용

공개 초안 규격의 권장 구조는 다음과 같다.[^designmd]

```text
YAML front matter: name, colors, typography, rounded, spacing, components

## Overview
## Colors
## Typography
## Layout
## Elevation & Depth
## Shapes
## Components
## Do's and Don'ts
```

Atlas용 파일에는 아래처럼 **화면과 독립적인** 사항을 넣는다.

- 잉크, 양피지, 해역, brass, red의 정확한 색 토큰과 용도
- 제목/본문/라벨의 서체, 크기, 행간
- 얇은 선, 낮은 radius, 지도 annotation panel, landmark label, link/button의 규칙
- `hover` 전용 정보 금지, 작은 글자·중첩 카드·보라 그라데이션 금지
- 한국어 UI와 기술 고유명사의 표기 원칙

반대로 Landmark별 링크, URL, 게시물 목록, Hugo/Blowfish/Tailwind 선택, 8개 장소의 상세 설명은 screen prompt 또는 migration 문서에 둔다. 설계 시스템을 자주 바꾸지 않고, 화면 프롬프트만 반복하기 쉬워진다.

규격은 아직 `alpha`이며 변경될 수 있다. CI 도입 전이라도 `npx @google/design.md lint DESIGN.md`로 토큰 참조, 색 대비, 섹션 구조를 확인할 수 있다.[^designmd]

## 프롬프트 작성 원칙

- 첫 문장에 화면 이름과 사용자의 목표를 둔다. Google은 wireframe만 설명하기보다 사업 목표, 사용자가 느껴야 할 감정, 영감 사례로 시작할 수 있다고 안내한다.[^vibe]
- 첨부 이미지는 ‘무엇을 복사할지’보다 ‘무엇을 참고하고 무엇을 피할지’를 명시한다. 예: `harrypotter.jpg는 노후 지도 인쇄물의 잉크 밀도·해안선·파도 질감만 참고한다.`
- 로고마다 한 개의 역할만 준다. 예: `Argo CD 로고는 해역 landmark의 식별 표식이다.` 한 프롬프트에서 로고에 캐릭터, 건물, 상징, 항로의 의미를 모두 억지로 부여하지 않는다.
- 가상의 게시물 제목, 날짜, 사례를 만들지 말고, 실제 텍스트가 필요하면 저장소에서 추출한 작은 콘텐츠 목록을 제공한다.
- 화면을 선택한 뒤에는 ‘전체 화면을 다시 만들라’보다 바꿀 대상·바꾸지 않을 대상·성공 기준을 명확히 한 편집 프롬프트를 쓴다.
- 테마·헤더 등 여러 화면에서 같아야 할 요소는 한 화면을 기준 화면으로 정한 뒤, 해당 화면을 명시해 후속 화면에 적용한다. 이는 Stitch 커뮤니티에서 제시된 실무 팁이며 제품 동작 보장은 아니다.[^community]

## 자산과 권리 경계

- 업로드하는 이미지·로고·저장소에는 업로드 및 사용 권리가 있어야 한다. Google 약관도 업로드 콘텐츠에 필요한 권리가 있어야 한다고 명시한다.[^terms]
- Google의 생성형 AI 정책은 타인의 지식재산권을 침해하는 사용을 금지한다.[^policy]
- 따라서 `harrypotter.jpg`는 특정 작품의 지도 재현 지시가 아니라, 일반적인 antique-cartography의 분위기 참고로만 쓴다. 작품 고유의 지명, 문장, 기숙사 상징, 고유 건물 배치, 식별 가능한 세부를 요구하거나 결과에 남기지 않는다.
- 기술 로고는 해당 상표/브랜드 가이드의 사용 조건도 별도로 확인한다. Stitch에 업로드한다고 사용 권한이 생기지 않는다.

## 출처

[^vibe]: Google Labs, [Introducing “vibe design” with Stitch](https://blog.google/innovation-and-ai/models-and-research/google-labs/stitch-ai-ui-design/) (2026-03-18). 캔버스 context, DESIGN.md, prototype, 음성/반복 설계 설명.
[^launch]: Google Developers Blog, [From idea to app: Introducing Stitch](https://developers.googleblog.com/en/stitch-a-new-way-to-design-uis/) (2025-05-20). 자연어·이미지 입력, variant, Figma 및 front-end code export.
[^designmd]: Google Labs Code, [DESIGN.md specification](https://github.com/google-labs-code/design.md). YAML tokens + rationale 구조, canonical sections, lint, alpha 상태. Google의 공개 OSS 규격이며 제품 동작의 영구 보증은 아니다.
[^sdk]: Google Labs Code, [Stitch SDK README](https://github.com/google-labs-code/stitch-sdk/blob/main/README.md). screen generate/edit/variants, variant axes, HTML/image retrieval. 저장소는 Google Labs Code가 관리하지만 README는 공식 지원 제품이 아님을 고지한다.
[^community]: Google AI Developers Forum, [Stitch Prompt Guide](https://discuss.ai.google.dev/t/stitch-prompt-guide/83844/149) (2026-07-14). 테마 고정, multi-select, 기준 화면 참조에 관한 커뮤니티 실무 안내.
[^terms]: Google, [Terms of Service](https://policies.google.com/terms?hl=en-US), “Permission to use your content” 및 “Respect others”.
[^policy]: Google, [Generative AI Prohibited Use Policy](https://policies.google.com/terms/generative-ai/use-policy?hl=en-US), 타인의 privacy 및 intellectual property rights 침해 금지.
