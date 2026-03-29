# Implementation Status

## 1. Current Phase
- 현재 단계: **Phase C-1 (대화 UI 품질 개선)**
- 기준 날짜: **2026-03-27**
- 요약:
  - 코어 규칙(이동/밀림/전투/하자드), 드래그 상호작용, 최소 적 AI, 데이터 로더/스키마 검증, 다중 스테이지+대화 기본 루프가 동작한다.
  - objective 판정은 `defeat_all`, `survive_n_turns`, `reach_cell`, `protect_unit`를 지원하고, stage 결과에 따라 `onSuccess` / `onFail` 분기 전이가 가능하다.
  - debug scenario는 성공 분기와 실패 분기를 모두 포함하며, stage 실패 시 retry/title 또는 fail branch로 이어지는 플로우가 정리되었다.
  - `stage` / `scenario` / `dialog` / `unit catalog` JSON은 로더 시점에 schema 검증과 참조 검증을 거치며, `reach_cell` 샘플 스테이지가 추가되었다.
  - 대화 UI는 `Next / Skip / Log / Auto` 버튼을 제공하고, 현재 dialogue step 범위의 누적 로그를 오버레이에서 바로 열어 볼 수 있다.
  - `Skip`은 현재 dialogue step의 남은 문장만 로그에 반영한 뒤 다음 step으로 진행하며, `auto-play`는 1.8초 고정 대기시간으로 진행되고 사용자 입력 시 즉시 해제된다.
  - 대화 진행용 포인터 입력은 전역 클릭 대신 dialogue 패널 안의 전용 탭 영역과 버튼으로만 받도록 정리해, 모바일에서 실수 탭으로 문장이 넘어가는 문제를 줄였다.
  - 전투 보드에서 아군 드래그 타이머는 타일 선택 즉시 켜지고, 적군 타일만 1.5초 롱프레스로 유닛 상세 오버레이를 열 수 있다.
  - 전투 연출 애니메이션은 현재 버그/타이밍 재정립 이슈로 비활성화되어 있고, 대상 목록만 유지한다.
  - 드래그 입력은 포인터 좌표와 플로팅 타일 위치를 분리해 처리하며, 플로팅 타일은 합법 경로를 한 칸씩만 따라간다. `block` 시에는 막힌 축만 잠그고, 해제는 막힌 타일 경계선 기준으로 즉시 판정한다.
  - Phase C-2 1차 착수로 전투 연출 정책 상수(`duration/priority/board input lock`)를 분리하고, AnimationQueue에 우선순위 삽입 및 타입별 입력 잠금 처리를 반영했다.
  - Phase C-2 설계 문서(`docs/PHASE_C2_COMBAT_ANIMATION_REDESIGN.md`)에 트리거 인덱스, 재활성화 단계, 수용 기준 초안을 정리했다.

## 2. Completed
- 개발 보조 tooling 정리 완료
  - `AGENTS.md`에 `codex_mini` MCP 서버를 tool 중심 서버로 사용하는 규칙 추가
  - `scripts/codex_mini_mcp.sh` 래퍼 스크립트 추가
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
  - 아군 타일 선택(`pointerdown`) 즉시 5초 드래그 카운트다운 시작
  - 적군 타일 1.5초 롱프레스로 유닛 상세 오버레이 표시
- 전투/이동 피드백 2차 보강 완료
  - 포인터 좌표와 플로팅 타일 좌표를 분리하고, 실제 이동 판정을 항상 현재 플로팅 타일 기준으로 통일
  - 포인터가 멀리 이동해도 플로팅 타일은 인접한 다음 칸만 갱신하며, 프리뷰도 현재 합법 타일 범위 안으로 클램프
  - 대각선 `swap`은 대각선 아군 쪽으로 분명히 기울기만 해도 더 잘 붙도록 최소 진입량과 축 비율 기준을 완화하되, 직교 게이트 둘 다 적/벽으로 막힌 경우는 금지
  - 같은 드래그 안에서 `swap` 직후 바로 같은 칸쌍으로 왕복 `swap`이 재발동하지 않도록, 실제 `swap` 축 기준의 re-arm 잠금 구간을 둔다
  - 보드 셀 입력은 코너 deadzone 외에도 상하좌우 경계 deadzone을 추가해, 가장자리 근처에서 셀 진입이 너무 민감하게 바뀌지 않도록 완화
  - `block` 발생 시 막힌 축만 잠그고, 다른 축 이동은 유지
  - `block` 해제는 셀 체류/코너 데드존과 무관하게 막힌 타일 경계선 기준으로 즉시 처리
  - `block` 표시 이펙트는 입력/이벤트 지연을 막기 위해 제거하고, 차단 피드백은 즉시 상태 메시지와 프리뷰 위치만으로 전달
  - `swap`, `assist`, `hit`, `flash`, `die` 연출 코드는 유지하지만 현재는 비활성화 상태로 두고, 우선순위/지속시간 버그 정리 전까지 재생하지 않는다
- 대화 UI 품질 개선 MVP 1차 반영 완료
  - dialogue overlay에 `Next`, `Skip`, `Show Log` 버튼 추가
  - 현재 dialogue step 범위의 화자/문장 이력을 별도 로그 패널에서 확인 가능
  - `Skip`은 현재 dialogue step의 남은 문장을 로그에 반영한 뒤 다음 step으로 진행
  - 키보드(`SPACE` / `ENTER`)와 클릭 입력은 유지하고, 버튼 입력을 추가로 병행 지원
- 대화 UI 품질 개선 MVP 2차 반영 완료
  - dialogue overlay에 `Auto` 토글 버튼 추가
  - `auto-play`는 1.8초 고정 대기시간으로 다음 문장을 진행
  - 수동 입력(`SPACE` / `ENTER` / click / 버튼`)이 들어오면 `auto-play`는 즉시 해제
- 대화 UI 품질 개선 MVP 3차 반영 완료
  - 전역 `click to continue`를 제거하고, dialogue 패널 내부 탭 영역과 명시적 버튼만 진행 입력으로 사용
  - 버튼 클릭과 진행 클릭의 입력 충돌을 줄이기 위해 dialogue 전용 포인터 경로로 정리
  - 안내 문구를 현재 입력 규칙(`SPACE / ENTER / text panel tap / buttons`)에 맞게 갱신
- 검증 상태 (최신 기준)
  - 단위 테스트: **65 passed**
  - 테스트 명령: `env PATH=/home/deck/.nvm/versions/node/v20.19.5/bin:$PATH npm run test`
  - 빌드: **성공**
  - 빌드 명령: `env PATH=/home/deck/.nvm/versions/node/v20.19.5/bin:$PATH npm run build`

## 3. In Progress
- Phase C-2 전투 연출 재정립 1차 진행 중
  - `AnimationQueue` 우선순위 기반 삽입(대기 큐) 적용
  - 타입별 입력 잠금 정책(`die/assist/hit` 잠금, `swap/flash/block` 비잠금) 적용
  - 재활성화 전용 설계 문서 초안(`docs/PHASE_C2_COMBAT_ANIMATION_REDESIGN.md`) 작성

## 4. Not Started
- 대화 UI 고도화(타이핑 연출/모바일 세부 UX)
- 화면/해상도 품질 재점검
- 콘텐츠 제작 파이프라인(템플릿/밸런싱 루프)
- 스킬 시스템(행동 타입/쿨다운/효과 규칙)

## 4.1 Deferred Until Approval
- 상태 확장 규칙(`stunned`, `hasActed` 외 상태군) 확정 및 구현
- AI 규칙 데이터 외부화(`ai_profile`, 타깃 우선순위 규칙 세분화)

## 4.2 Bug Backlog
- 전투 연출 애니메이션 재정립 필요
  - 현재 `swap`, `assist`, `hit`, `flash`, `die` 목록만 유지하고 실제 재생은 비활성화
  - 이유: 지속시간 편차와 큐 우선순위가 커서 입력/전투 피드백 타이밍이 어색하게 겹침
  - 재개 시 검토 대상: 지속시간 재설계, 큐 우선순위, 입력 잠금 범위, hazard 전용 연출 분리

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
- 전투 보드 입력은 `적군 타일 1.5초 유지 = 상세`, `아군 타일 선택 즉시 = 5초 드래그 타이머 시작`으로 분기한다.
- 전투 연출 애니메이션은 재정립 전까지 비활성화하고, 관련 목록과 코드 경로만 유지한다.
- 대화 UI MVP는 `log + skip + auto-play + 버튼 입력`까지 우선 적용하고, 타이핑 연출은 후속 단계로 분리한다.
- `auto-play`는 1.8초 고정 대기시간으로 진행하고, 수동 입력이 들어오면 즉시 해제한다.
- 대화 로그 범위는 현재 `dialogue step` 기준으로 유지하고, step 전환 / retry / branch 이동 시 초기화한다.
- 대화 포인터 진행 입력은 전역 클릭 대신 dialogue 패널 안의 탭 영역과 버튼으로만 받는다.
- 대화 문장은 타이핑 연출 없이 즉시 전체 표시한다.

## 6. Open Questions
- `assist` 연출(현재 1000ms)의 체감 지연을 줄이기 위해 기본 지속시간을 700~850ms로 낮출지 여부
- hazard 피드백을 `flash` 공용 처리로 유지할지, hazard 전용 타입으로 분리할지 여부
- 전투 연출 재활성화를 바로 기본값으로 열지, feature flag 단계 적용 후 열지 여부

## 7. Next Action
1. **`Phase C-2` 전투 연출 재활성화 1차 검증** (`BATTLE_ANIMATIONS_ENABLED` 로컬 활성화 후 단일 hit / assist / hazard+die 연쇄 시나리오를 순회 점검)
2. **`assist`/`hit` 체감 시간 튜닝** (정책 기본값 유지 여부를 플레이 체감 기준으로 확정하고 필요 시 수치 조정)
3. **`Phase C-3` 화면/해상도 점검 준비** (전투/대화 UI 앵커와 패널 폭을 2560x1440 기준으로 점검 목록화)
