# Implementation Status

## 1. Current Phase
- 현재 단계: **Phase B-3 (데이터 스키마 갱신)**
- 기준 날짜: **2026-03-20**
- 요약:
  - 코어 규칙(이동/밀림/전투/하자드), 드래그 상호작용, 최소 적 AI, 데이터 로더/스키마 검증, 다중 스테이지+대화 기본 루프가 동작한다.
  - objective 판정은 `defeat_all`, `survive_n_turns`, `reach_cell`, `protect_unit`를 지원하고, stage 결과에 따라 `onSuccess` / `onFail` 분기 전이가 가능하다.
  - debug scenario는 성공 분기와 실패 분기를 모두 포함하며, stage 실패 시 retry/title 또는 fail branch로 이어지는 플로우가 정리되었다.
  - `stage` / `scenario` / `dialog` / `unit catalog` JSON은 로더 시점에 schema 검증과 참조 검증을 거치며, `reach_cell` 샘플 스테이지가 추가되었다.

## 2. Completed
- 프로젝트 기반(Phaser + Vite + TypeScript) 및 기본 Scene 구조 구축 완료
  - `BootScene`, `PreloadScene`, `TitleScene`, `GameScene`, `UIScene` 동작
- 코어 보드/유닛/규칙 레이어 구축 완료
  - `Board`, `Cell`, `BoardQuery`, `Unit`, `UnitState`
  - `MoveResolver`, `PushResolver`, `BattleResolver`, `HazardResolver`, `TurnResolver`
  - `DragInteractionResolver`로 드래그 중 `move/swap/block/none` 규칙 적용
  - `block` 충돌 시 막힌 축만 유지하고 다른 축 드래그는 이어지는 프리뷰 동작 반영
- 핵심 규칙 결정 반영 완료
  - 아군 타일 진입 시 swap
  - 적/장애물/맵 밖 진입 시 block
  - 전투 후 하자드 후속 처리
- 최소 적 AI 구현 완료
  - 단독 공격 가능
  - 타깃 선택: 가까운 아군/방어력이 낮은 아군 중 확률 선택
- 데이터 외부화/로더/스키마 기반 구성 완료
  - stage/scenario/dialog/unit catalog 로딩 구조 연결
  - stage 메타(`title`, `description`, `objective`) 및 image area 반영
  - stage/scenario schema에 objective/branch 필드 반영
  - `Ajv2020` 기반 schema 검증을 debug 로더 경로에 연결
  - 누락 필드/잘못된 branch target을 사람이 읽기 쉬운 에러 메시지로 정리
- 시나리오 진행 루프 일반화 2차 완료
  - `dialogue -> stage -> next step` 기본 전환 유지
  - stage 결과 기반 `onSuccess` / `onFail` 분기 지원
  - stage 실패 시 fail branch 또는 `Retry / Back To Title` 패널 처리
- 스테이지 objective 일반화 2차 완료
  - `ObjectiveManager` 기반 objective judge dispatch 구조 적용
  - `defeat_all`, `survive_n_turns`, `reach_cell`, `protect_unit` 지원
  - `protect_unit` 실패가 scene 분기와 연결됨
- 디버그 콘텐츠/계획 문서 동기화 완료
  - `debug-scenario`에 success/fail branch 추가
  - `stage-02`에 `protect_unit` objective 반영
  - `stage-reach-cell` 샘플 스테이지 추가
  - `Phase_Plan_dev.md` 작성
- 검증 상태 (최신 기준)
  - 단위 테스트: **57 passed**
  - 테스트 명령: `env PATH=/home/deck/.nvm/versions/node/v20.19.5/bin:$PATH npm run test`
  - 빌드: **성공**
  - 빌드 명령: `env PATH=/home/deck/.nvm/versions/node/v20.19.5/bin:$PATH npm run build`

## 3. In Progress
- 없음

## 4. Not Started
- 대화 UI 고도화(로그/스킵/자동재생 등)
- 전투/이동 피드백 강화(연출 우선순위/큐 정리)
- 화면/해상도 품질 재점검
- 콘텐츠 제작 파이프라인(템플릿/밸런싱 루프)
- 스킬 시스템(행동 타입/쿨다운/효과 규칙)

## 4.1 Deferred Until Approval
- 상태 확장 규칙(`stunned`, `hasActed` 외 상태군) 확정 및 구현
- AI 규칙 데이터 외부화(`ai_profile`, 타깃 우선순위 규칙 세분화)

## 5. Fixed Decisions
- Grid를 게임 규칙의 source of truth로 유지한다.
- Phaser는 표현/입력 레이어로 사용한다.
- 규칙 엔진은 Phaser 없이 동작 가능해야 한다.
- 이동은 현재 직교 기반으로 처리한다.
- 아군 충돌은 swap, 적/장애물/맵 밖은 block 처리한다.
- 전투 판정은 이동 안정화 후 수행한다.
- 협공은 수평/수직 샌드위치 판정을 사용한다.
- 하자드는 전투 후 후속 효과로 적용한다.
- 드래그 종료(또는 제한 시간 종료) 시 현재 보드 상태를 확정한다.
- objective 평가는 objective별 judge dispatch(map) 구조를 사용한다.
- stage step 전이는 `onSuccess` / `onFail` 우선, dialogue step 전이는 `nextStepId`를 사용한다.
- `protect_unit`은 지정 유닛이 보드에서 사라지면 즉시 실패한다.
- JSON schema 검증은 로더 시점에 수행하고, schema 오류와 scenario branch 참조 오류를 함께 보고한다.

## 6. Open Questions
- 대화 UI 고도화를 Phase C-1에서 어디까지 MVP 범위로 둘지
- `stage-reach-cell`을 실제 debug scenario 흐름에 연결할지, 별도 테스트/샘플 자산으로 유지할지

## 7. Next Action
1. **대화 UI MVP 범위 확정 및 상태 구조 정리** (`log` / `skip` / `auto-play` 중 우선 구현 단위를 정하고 `UIScene`/registry 상태를 정리)
2. **대화 진행 UX 1차 구현** (현재 dialogue overlay에 `skip` 또는 `auto-play` 중 최소 1개를 실제 동작으로 연결)
3. **모바일/포인터 기반 대화 입력 정리** (SPACE 외 입력 경로를 단순화하고 실수 입력을 줄이는 방향으로 보강)
