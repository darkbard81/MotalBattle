# Implementation Status

## 1. Current Phase
- 현재 단계: **Phase B-1 (스테이지 목표 시스템 일반화)**
- 기준 날짜: **2026-03-17**
- 요약:
  - 코어 규칙(이동/밀림/전투/하자드), 드래그 상호작용, 최소 적 AI, 데이터 로더/스키마, 다중 스테이지+대화 기본 루프가 동작한다.
  - objective 판정기가 `defeat_all` 하드코딩에서 분리되었고, 스테이지 데이터 기반 objective 배열 평가가 가능하다.

## 2. Completed
- 프로젝트 기반(Phaser + Vite + TypeScript) 및 기본 Scene 구조 구축 완료
  - `BootScene`, `PreloadScene`, `TitleScene`, `GameScene`, `UIScene` 동작
- 코어 보드/유닛/규칙 레이어 구축 완료
  - `Board`, `Cell`, `BoardQuery`, `Unit`, `UnitState`
  - `MoveResolver`, `PushResolver`, `BattleResolver`, `HazardResolver`, `TurnResolver`
  - `DragInteractionResolver`로 드래그 중 `move/swap/block/none` 규칙 적용
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
- 시나리오 진행 기본 루프 구현 완료
  - `dialogue -> stage -> next step` 전환
  - 단계 완료 시 `Next Stage / Retry / Back To Title` 패널
  - 타이틀에서 시나리오 선택 후 시작
- 스테이지 objective 일반화 1차 완료
  - `ObjectiveManager` 기반 objective judge/manager 구조 적용
  - `defeat_all`, `survive_n_turns` 지원
  - stage schema/data에 `objectives[]`, `turnLimit` 확장
- 검증 상태 (최신 기준)
  - 단위 테스트: **40 passed**
  - 빌드: **성공**

## 3. In Progress
- 다중 스테이지 진행 UX(패널/문구/진행 피드백) 정리
- 시나리오 step 성공/실패 분기 구조 설계

## 4. Not Started
- 목표 달성/실패에 따른 시나리오 분기 처리 일반화
- 스킬 시스템(행동 타입/쿨다운/효과 규칙)
- 콘텐츠 제작 파이프라인(템플릿/밸런싱 루프)
- 대화 UI 고도화(로그/스킵/자동재생 등)

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

## 6. Open Questions
- `reach_cell`, `protect_unit` objective의 최소 데이터 스키마 형태
- 다중 스테이지 실패 조건(즉시 재시작 vs 분기 이동) 기본 정책
- 대화 UI에서 스킵/자동재생을 MVP 범위에 포함할지

## 7. Next Action
1. **시나리오 step 성공/실패 분기 필드(`onSuccess`/`onFail`) 스키마/로더 반영**
2. **objective 타입 추가 설계 (`reach_cell`, `protect_unit`) 및 judge 구현**
3. **다중 스테이지 UX 정리 1차 마감** (클리어/실패/재시도 흐름의 문구·행동 통일)
