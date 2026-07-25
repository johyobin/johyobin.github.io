# 기술 진화 지도: 초기 노드용 1차 출처

> 범위: `/tech-evolution-map/` 초기 36개 노드. 각 항목은 지도에서 제시할 수 있는 **한 가지 검증 가능한 주장**과, 그 주장을 소유한 표준·원 논문·공식 문서다. 역사적 해석(예: A가 B를 “직접” 낳음)은 별도 관계 데이터에서 좁고 신중하게 표현한다.

## 1. 네트워크와 웹의 기반 (1960s–1994)

| 노드 | 1차 출처 | 지도에 사용할 주장 |
| --- | --- | --- |
| 패킷 교환 | [Baran, *On Distributed Communications* (1964)](https://www.rand.org/pubs/research_memoranda/RM3420.html) | 분산 통신망을 위한 메시지 블록(패킷) 기반 설계를 제안했다. |
| 인터넷워크 / TCP-IP | [RFC 9293: TCP](https://www.rfc-editor.org/rfc/rfc9293.html) | TCP는 신뢰성 있는 바이트 스트림 전송과 흐름 제어를 정의하며, IP 위에서 동작한다. |
| DNS | [RFC 1034: Domain Names—Concepts and Facilities](https://www.rfc-editor.org/rfc/rfc1034.html) | DNS는 분산 데이터베이스로 도메인 이름 공간과 이름-주소 변환을 제공한다. |
| HTTP | [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html) | HTTP는 리소스와 요청 메서드 중심의 확장 가능한 애플리케이션 프로토콜 의미론을 정의한다. |
| World Wide Web | [CERN: *Information Management: A Proposal* (1989)](https://www.w3.org/History/1989/proposal.html) | 하이퍼텍스트로 분산된 정보와 링크를 연결하는 월드와이드웹을 제안했다. |
| HTML / URL | [RFC 1866: HTML 2.0](https://www.rfc-editor.org/rfc/rfc1866.html) | HTML은 하이퍼텍스트 문서의 교환 형식을 표준화하여 웹 문서 상호운용성을 만들었다. |

## 2. 웹 애플리케이션과 데이터 계층 (1995–2005)

| 노드 | 1차 출처 | 지도에 사용할 주장 |
| --- | --- | --- |
| 관계형 데이터 모델 | [E. F. Codd, *A Relational Model of Data* (1970)](https://dl.acm.org/doi/10.1145/362384.362685) | 데이터 독립성을 위해 관계와 관계 연산에 기반한 모델을 제안했다. |
| CGI와 동적 서버 처리 | [RFC 3875: CGI/1.1](https://www.rfc-editor.org/rfc/rfc3875.html) | CGI는 웹 서버가 요청 정보를 외부 프로그램에 전달하고 동적 응답을 반환하는 인터페이스를 정의한다. |
| JavaScript / 브라우저 실행 | [ECMA-262](https://ecma-international.org/publications-and-standards/standards/ecma-262/) | ECMAScript는 웹 브라우저를 포함한 호스트 환경에서 사용하는 스크립트 언어 표준이다. |
| CSS | [W3C CSS1 Recommendation](https://www.w3.org/TR/REC-CSS1/) | CSS는 문서 구조와 표현을 분리하는 스타일시트 언어를 정의한다. |
| REST / 웹 API | [Fielding, *Architectural Styles…* (2000)](https://www.ics.uci.edu/~fielding/pubs/dissertation/fielding_dissertation.pdf) | REST는 컴포넌트·커넥터·데이터 요소 제약으로 웹 규모의 분산 하이퍼미디어 시스템을 설명한다. |
| AJAX / 비동기 웹 | [W3C XMLHttpRequest](https://www.w3.org/TR/XMLHttpRequest/) | XMLHttpRequest는 사용자 에이전트가 전체 페이지 탐색 없이 HTTP 요청을 수행하도록 정의한다. |
| 모놀리스 | [Microsoft Learn: Common web application architectures](https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/common-web-application-architectures) | 모놀리스의 핵심 동작은 하나의 프로세스에서 실행되고 대체로 하나의 배포 단위로 배포된다. 논리 계층의 유무와는 별개다. |
| 계층형 애플리케이션 | [Microsoft Learn: N-tier architecture style](https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/n-tier) | N-tier는 논리 계층과 물리적으로 분리 가능한 티어로 구성하며, 전통적 3-tier는 표현·중간·데이터 티어를 둔다. |

## 3. 대규모 분산 시스템 (2006–2012)

| 노드 | 1차 출처 | 지도에 사용할 주장 |
| --- | --- | --- |
| 분산 파일 시스템 | [Google File System (SOSP 2003)](https://research.google/pubs/the-google-file-system/) | GFS는 대규모 데이터 집약 작업을 위해 장애가 잦은 범용 하드웨어 클러스터를 전제로 설계됐다. |
| MapReduce | [MapReduce (OSDI 2004)](https://research.google/pubs/mapreduce-simplified-data-processing-on-large-clusters/) | MapReduce 런타임은 분할·스케줄링·장애 처리·통신을 맡아 대규모 데이터 처리를 단순화한다. |
| Bigtable / NoSQL | [Bigtable (OSDI 2006)](https://research.google/pubs/bigtable-a-distributed-storage-system-for-structured-data/) | Bigtable은 페타바이트 규모 데이터와 수천 대 서버로 확장되는 분산 저장 시스템이다. |
| 분산 합의 | [Paxos Made Simple](https://lamport.azurewebsites.net/pubs/paxos-simple.pdf) | Paxos는 비동기 분산 시스템에서 합의 문제를 해결하기 위한 알고리즘을 설명한다. |
| 메시지 스트리밍 | [Kafka: a Distributed Messaging System](https://notes.stephenholiday.com/Kafka.pdf) | Kafka는 로그 처리용 분산 메시징 시스템으로, 높은 처리량의 지속 메시지 스트림을 목표로 한다. |
| 가상화 | [Xen and the Art of Virtualization (SOSP 2003)](https://www.cl.cam.ac.uk/research/srg/netos/papers/2003-xensosp.pdf) | Xen은 VMM을 통해 여러 운영체제가 단일 물리 자원을 공유하도록 하는 가상화를 제시했다. |

## 4. 클라우드와 배포 자동화 (2013–2017)

| 노드 | 1차 출처 | 지도에 사용할 주장 |
| --- | --- | --- |
| IaaS / 탄력적 클라우드 | [AWS: EC2 소개](https://aws.amazon.com/ec2/) | EC2는 필요에 따라 가상 서버 용량을 확보하고 사용량 기반으로 지불하는 컴퓨팅 서비스를 제공한다. |
| 구성 관리 | [Puppet: Declarative Language](https://www.puppet.com/docs/puppet/8/lang_summary.html) | Puppet 언어는 시스템의 원하는 상태를 선언하고 카탈로그로 적용하는 모델을 제공한다. |
| Infrastructure as Code | [Terraform: Infrastructure as Code](https://developer.hashicorp.com/terraform/intro) | Terraform은 구성 파일로 인프라를 정의하고 생성·변경·버전 관리를 지원한다. |
| 컨테이너 | [OCI Image Specification](https://github.com/opencontainers/image-spec/blob/main/spec.md) | OCI 이미지 명세는 컨테이너 이미지의 파일 시스템 번들 형식과 실행 구성을 정의한다. |
| CI/CD | [Continuous Delivery (Fowler / Humble)](https://martinfowler.com/bliki/ContinuousDelivery.html) | 지속적 전달은 소프트웨어를 언제든 운영 환경에 배포 가능한 상태로 유지하는 배포 규율이다. |
| 마이크로서비스 | [Microservices (Fowler / Lewis)](https://martinfowler.com/articles/microservices.html) | 마이크로서비스는 독립 배포 가능한 서비스들의 집합으로 애플리케이션을 구성하는 접근을 설명한다. |

## 5. 클라우드 네이티브·DevOps·SRE (2018–2022)

| 노드 | 1차 출처 | 지도에 사용할 주장 |
| --- | --- | --- |
| Kubernetes / 오케스트레이션 | [Kubernetes Documentation: Overview](https://kubernetes.io/docs/concepts/overview/) | Kubernetes는 컨테이너화된 워크로드와 서비스를 선언적으로 관리하기 위한 이식·확장 가능한 플랫폼이다. |
| 선언형 배포 / GitOps | [OpenGitOps Principles](https://opengitops.dev/) | GitOps는 선언적 시스템, Git의 버전·불변성, 자동 적용과 지속적 조정을 원칙으로 둔다. |
| Service Mesh | [Istio: What is Istio?](https://istio.io/latest/about/service-mesh/) | Istio는 서비스 간 통신에 보안·관측성·트래픽 제어를 제공하는 서비스 메시다. |
| 관측성 | [OpenTelemetry Specification](https://opentelemetry.io/docs/specs/otel/) | OpenTelemetry 명세는 traces, metrics, logs 등 관측성 신호의 생성·수집·내보내기 규약을 제공한다. |
| SRE / SLO | [Google SRE Book: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/) | SLO는 SLI로 측정하는 서비스 수준의 목표값 또는 범위이며, 사용자 관점의 측정을 출발점으로 삼는다. |
| Error Budget | [Google SRE Book: Embracing Risk](https://sre.google/sre-book/embracing-risk/) | 오류 예산은 신뢰성 목표와 출시 속도 사이의 의사결정에 쓰는 공동의 객관적 지표다. |

## 6. 플랫폼 엔지니어링과 AI 에이전트 (2023–현재)

| 노드 | 1차 출처 | 지도에 사용할 주장 |
| --- | --- | --- |
| Internal Developer Platform | [CNCF Platforms White Paper](https://tag-app-delivery.cncf.io/whitepapers/platforms/) | 플랫폼은 개발팀이 제품을 만들고 제공하는 데 필요한 역량을 자가 서비스 방식으로 제공하는 내부 제품으로 정의된다. |
| Software Supply Chain Security | [SLSA specification](https://slsa.dev/spec/v1.1/) | SLSA는 소프트웨어 산출물의 무결성과 출처를 점진적으로 보장하기 위한 프레임워크와 요구사항을 정의한다. |
| 정책 기반 운영 | [Open Policy Agent: Policy Language](https://www.openpolicyagent.org/docs/latest/policy-language/) | OPA는 정책을 Rego로 작성하고 애플리케이션·인프라 결정에서 정책 결정을 분리하도록 한다. |
| LLM 기반 에이전트 | [ReAct: Synergizing Reasoning and Acting](https://arxiv.org/abs/2210.03629) | ReAct는 언어 모델의 추론 흔적과 행동을 번갈아 생성해 외부 환경과 상호작용하는 방식을 제시한다. |
| 도구 호출 / 에이전트 실행 | [OpenAI: Function calling](https://platform.openai.com/docs/guides/function-calling) | 함수 호출은 모델이 외부 시스템의 데이터·기능에 연결할 수 있도록 도구 호출을 구조화한다. |
| 에이전트 운영·평가 | [OpenAI: Agent evals](https://platform.openai.com/docs/guides/agent-evals) | 에이전트 평가는 워크플로와 도구 사용을 테스트해 변경에 따른 품질 저하를 찾는 방법을 제공한다. |

## 사용 규칙

- 노드 카드의 출처는 위 URL을 그대로 사용하고, 본문은 표의 주장보다 넓게 일반화하지 않는다.
- **공식 문서가 제품의 현재 기능을 설명하는 경우**, 역사적 최초성의 근거로 쓰지 않는다. 최초성·연도는 원 논문/표준을 별도 확인한다.
- 시간적 선후관계만으로 `다음을 가능하게 함`을 단정하지 않는다. 관계 데이터는 공통 문제, 구체적 기술 제약, 실제 채택 근거를 함께 검토한다.
- 외부 링크는 빌드 전 URL 점검 대상으로 둔다. 사라진 원문은 DOI, RFC Editor, 표준기구, 공식 아카이브를 우선 대체한다.
