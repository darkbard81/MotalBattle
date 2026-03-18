1. 로컬 명령 실행 규칙
- Flatpak VS Code 환경에서는 기본 `PATH`에 Node.js/NPM 경로가 없을 수 있음
- npm 스크립트 실행 시 아래 형식을 우선 사용
  - `env PATH=/home/deck/.nvm/versions/node/v20.19.5/bin:$PATH npm run <script>`
- 개별 바이너리 실행 시 아래 경로를 사용 가능
  - `/home/deck/.nvm/versions/node/v20.19.5/bin/node`
  - `/home/deck/.nvm/versions/node/v20.19.5/bin/npm`
- `PATH`를 설정할 때는 Node 경로를 앞에 추가하고, 기존 시스템 `PATH`는 뒤에 유지
- 이 저장소에서 Node.js 관련 명령을 실행할 때는 위 규칙을 기본값으로 참조

2. 구현 현황 문서 관리 규칙
- 구현 현황의 최종 기준 문서는 `docs/IMPLEMENTATION_STATUS.md` 이다
- 구현 작업을 수행한 뒤에는 반드시 `docs/IMPLEMENTATION_STATUS.md`를 현재 기준으로 갱신한다
- `RoadMap.md`는 계획 문서로 유지하고, 실제 구현 완료/진행/미시작 상태는 `docs/IMPLEMENTATION_STATUS.md`에 기록한다
- 다음 단계(`Next Action`)를 제안하거나 갱신하기 전에 반드시 `RoadMap.md`와 `docs/IMPLEMENTATION_STATUS.md`를 함께 검토한다
- `Next Action`은 로드맵의 핵심 컨셉, 단계 순서, 현재 구현 상태를 기준으로 정하고, 임의로 다른 방향으로 흘러가지 않도록 한다
- 로드맵과 다른 선택이 필요하면 먼저 그 차이를 명시하고, 사용자의 확인 없이 로드맵에서 벗어난 방향을 확정하지 않는다
- `docs/IMPLEMENTATION_STATUS.md`를 갱신할 때는 단순 항목 추가로 끝내지 말고 현재 구현 기준으로 전체 정합성을 다시 맞춘다
- 구현이 완료된 항목은 `Completed`로 올리고, 같은 항목이 `In Progress`나 `Not Started`에 남아 있지 않도록 정리한다
- 현재 단계가 로드맵 기준으로 이동했으면 `Current Phase`를 즉시 갱신하고, 기준 날짜도 실제 갱신 날짜로 맞춘다
- 테스트 수나 빌드 검증 결과를 기록할 때는 이전 수치를 누적하지 말고 최신 기준 값으로 교체한다
- `Deferred Until Approval`에 넣은 항목은 사용자의 승인 없이 `Next Action`으로 올리지 않는다
- `Next Action`은 1~3개 수준의 실제 다음 구현 단위만 남기고, 이미 완료된 작업이나 포괄적 표현은 제거한다
- 구현 상태 문서에는 최소한 다음 항목을 유지한다
  - Current Phase
  - Completed
  - In Progress
  - Not Started
  - Fixed Decisions
  - Open Questions
  - Next Action

3. 작업 계획 문서 관리 규칙
- `RoadMap.md`는 장기 계획 문서다. 단계 순서, 핵심 방향, 중장기 우선순위의 기준으로 유지한다.
- `Phase_Plan_dev.md`와 같은 작업 단위 계획 문서는 특정 구현 단위의 실행 계획 문서다.
- 작업 단위 계획 문서는 `RoadMap.md`를 대체하지 않으며, 장기 계획의 하위 실행 문서로만 사용한다.
- 구현 완료 후 현재 구현 사실의 단일 기준 문서는 항상 `docs/IMPLEMENTATION_STATUS.md`로 되돌린다.
- 작업 단위 계획 문서를 새로 만들거나 갱신할 때는 먼저 `RoadMap.md`와 `docs/IMPLEMENTATION_STATUS.md`를 함께 검토해 충돌 여부를 확인한다.
- 작업 단위 계획 문서가 로드맵과 다른 방향을 제안할 경우, 차이와 이유를 명시하고 사용자 확인 없이 확정하지 않는다.
- 작업 단위 계획 문서는 구현 전후 맥락을 남기기 위한 보조 문서이며, 완료 상태 관리나 진행률의 최종 기준으로 사용하지 않는다.

4. Current Phase / 검증 기록 규칙
- `Current Phase`는 마지막으로 실제 구현 완료된 로드맵 세부 항목 기준으로 갱신한다.
- 둘 이상의 세부 항목이 한 번에 걸친 경우에는 “주 구현 완료 기준”이 되는 가장 뒤 단계로 올린다.
- 단순 탐색, 문서 초안 작성, 계획만 수행한 경우에는 `Current Phase`를 올리지 않는다.
- 테스트/빌드 결과를 `docs/IMPLEMENTATION_STATUS.md`에 기록할 때는 최신 통과 결과만 남기고, 가능하면 사용한 명령도 함께 간단히 적는다.
- 구현으로 동작, 테스트 결과, 단계 상태가 바뀐 경우에만 `docs/IMPLEMENTATION_STATUS.md`를 갱신한다.

5. 로드맵 이탈 판단 규칙
- 사용자 확인이 필요한 “로드맵 이탈”은 핵심 컨셉 변경, 단계 순서 변경, 우선순위 변경, 범위 확장에 한정한다.
- 문구 정리, UI 표현 정리, 예외 처리 보강, 테스트 보강, 내부 리팩터링처럼 핵심 방향을 바꾸지 않는 세부 구현은 사용자 확인 없이 진행할 수 있다.
- `Next Action`은 기본적으로 1~3개를 유지하되, 서로 독립적으로 병렬 진행 가능한 실제 구현 단위가 명확할 때만 최대 4개까지 허용한다.
