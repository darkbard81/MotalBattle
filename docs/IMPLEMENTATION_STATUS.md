# Implementation Status

## 1. Current Phase
- 현재 단계: **Phase C-2 (전투/이동 피드백 강화)**
- 기준 날짜: **2026-03-22**
- 요약:
  - 코어 규칙(이동/밀림/전투/하자드), 드래그 상호작용, 최소 적 AI, 데이터 로더/스키마 검증, 다중 스테이지+대화 기본 루프가 동작한다.
  - objective 판정은 `defeat_all`, `survive_n_turns`, `reach_cell`, `protect_unit`를 지원하고, stage 결과에 따라 `onSuccess` / `onFail` 분기 전이가 가능하다.
  - debug scenario는 성공 분기와 실패 분기를 모두 포함하며, stage 실패 시 retry/title 또는 fail branch로 이어지는 플로우가 정리되었다.
  - `stage` / `scenario` / `dialog` / `unit catalog` JSON은 로더 시점에 schema 검증과 참조 검증을 거치며, `reach_cell` 샘플 스테이지가 추가되었다.
  - 전투 보드에서 아군 드래그 타이머는 타일 이동이 시작될 때만 켜지고, 아군/적군 타일 롱프레스 1.5초로 유닛 상세 오버레이를 열 수 있다.
  - 드래그 입력은 포인터 좌표와 플로팅 타일 위치를 분리해 처리하며, 플로팅 타일은 합법 경로를 한 칸씩만 따라간다. `block` 시에는 막힌 축만 잠그고, 해제는 막힌 타일 경계선 기준으로 즉시 판정한다.

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
- 전투/이동 피드백 1차 반영 완료
  - 아군 드래그 타이머가 `pointerdown` 즉시 시작되지 않고 실제 타일 이동부터 5초 카운트다운 시작
  - 아군/적군 타일 1.5초 롱프레스로 유닛 상세 오버레이 표시
- 전투/이동 피드백 2차 보강 완료
  - 포인터 좌표와 플로팅 타일 좌표를 분리하고, 실제 이동 판정을 항상 현재 플로팅 타일 기준으로 통일
  - 포인터가 멀리 이동해도 플로팅 타일은 인접한 다음 칸만 갱신하며, 프리뷰도 현재 합법 타일 범위 안으로 클램프
  - 대각선 `swap`은 포인터가 대각선 방향으로 충분히 기울기만 해도 러프하게 허용하되, 직교 게이트 둘 다 적/벽으로 막힌 경우는 금지
  - 같은 드래그 안에서 `swap` 직후 바로 같은 칸쌍으로 왕복 `swap`이 재발동하지 않도록, 실제 `swap` 축 기준의 re-arm 잠금 구간을 둔다
  - 보드 셀 입력은 코너 deadzone 외에도 상하좌우 경계 deadzone을 추가해, 가장자리 근처에서 셀 진입이 너무 민감하게 바뀌지 않도록 완화
  - `block` 발생 시 막힌 축만 잠그고, 다른 축 이동은 유지
  - `block` 해제는 셀 체류/코너 데드존과 무관하게 막힌 타일 경계선 기준으로 즉시 처리
  - `block` 표시 이펙트는 입력/이벤트 지연을 막기 위해 제거하고, 차단 피드백은 즉시 상태 메시지와 프리뷰 위치만으로 전달
- 검증 상태 (최신 기준)
  - 단위 테스트: **61 passed**
  - 테스트 명령: `env PATH=/home/deck/.nvm/versions/node/v20.19.5/bin:$PATH npm run test`
  - 빌드: **성공**
  - 빌드 명령: `env PATH=/home/deck/.nvm/versions/node/v20.19.5/bin:$PATH npm run build`

## 3. In Progress
- Phase C-2 잔여 작업: swap / sandwich / 피격 / 사망 연출의 우선순위와 타이밍 큐 정리

## 4. Not Started
- 대화 UI 고도화(로그/스킵/자동재생 등)
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
- 전투 보드 입력은 `같은 타일 1.5초 유지 = 상세`, `다른 타일로 이동 시작 = 5초 드래그 타이머 시작`으로 분기한다.

## 6. Open Questions
- 로드맵 순서상 다음 기본 복귀 지점을 `Phase C-1` 대화 UI로 둘지, 사용자 요청 기반으로 `Phase C-2` 세부 보강을 더 이어갈지
- 대화 UI 고도화를 Phase C-1에서 어디까지 MVP 범위로 둘지
- `stage-reach-cell`을 실제 debug scenario 흐름에 연결할지, 별도 테스트/샘플 자산으로 유지할지

## 7. Next Action
1. **로드맵 순서 복귀 시 `Phase C-1` 대화 UI MVP 범위 확정** (`log` / `skip` / `auto-play` 중 우선 구현 단위를 정하고 `UIScene`/registry 상태를 정리)
2. **사용자 요청 흐름을 더 잇는다면 `Phase C-2` 연출 우선순위 정리** (swap / block / hit / die 큐의 겹침과 타이밍 충돌을 줄이는 보강)
3. **모바일/포인터 기반 대화 입력 정리** (SPACE 외 입력 경로를 단순화하고 실수 입력을 줄이는 방향으로 보강)
