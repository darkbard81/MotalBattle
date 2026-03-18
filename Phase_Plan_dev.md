# Phase_Plan_dev.md 초안: Phase B-2 분기/실패 경로 정식화

## Summary
- 현재 저장소는 `core = rules`, `phaser = presentation`, `data = JSON` 구조를 실제로 따르고 있고, 테스트/빌드는 최신 기준으로 정상이다.
- 다음 구현 우선순위는 로드맵 기준대로 **Phase B-2 시나리오 분기 일반화**로 고정한다.
- 이번 단계의 핵심은 `onSuccess` / `onFail` 필드 추가 자체가 아니라, **스테이지 실패를 포함하는 단일 전이 계약**을 먼저 만드는 것이다.
- `reach_cell`, `protect_unit` objective는 이 전이 계약 위에 얹는다. 특히 `protect_unit`의 실질적 가치는 실패 경로가 있어야만 나온다.

## Key Changes
- 시나리오 전이 모델을 선형 `nextStepId` 중심에서 결과 기반으로 확장한다.
  - `ScenarioStep`에 `nextStepId`를 유지하되, stage step에서는 `onSuccess`, `onFail`을 추가한다.
  - dialogue step은 계속 `nextStepId`를 기본 전이로 사용한다.
  - 전이 해석 규칙은 다음으로 고정한다.
    - dialogue 완료: `nextStepId`
    - stage 성공: `onSuccess` 우선, 없으면 `nextStepId`
    - stage 실패: `onFail` 우선, 없으면 실패 플로우 패널 유지
- 전이 해석 API를 `src/core/data/ScenarioLoader.ts`에서 명시적 결과 입력 방식으로 바꾼다.
  - 기존 단순 다음-step 조회 함수는 `result: "default" | "success" | "fail"`를 받는 형태로 정리한다.
  - 잘못된 step id 또는 존재하지 않는 대상 step id는 현재와 동일하게 예외를 던진다.
- 시나리오 스키마를 `src/data/schemas/scenario.schema.json`에서 갱신한다.
  - stage step: `stageId` 필수, `onSuccess`/`onFail`/`nextStepId` 허용
  - dialogue step: `dialogId` 또는 `lines` 필수, `nextStepId` 허용
  - branch target은 문자열 id만 받는다. 배열/조건식/확률 분기는 이번 단계 범위에서 제외한다.
- `GameScene`의 stage 종료 처리를 성공 전용에서 성공/실패 양방향으로 바꾼다.
  - `checkStageCompletion()`는 `"success"`와 `"fail"`을 모두 처리한다.
  - 성공 시 다음 행동은 `onSuccess` 기준으로 전이한다.
  - 실패 시 다음 행동은 `onFail`이 있으면 해당 step으로 이동하고, 없으면 `Retry / Back To Title` 중심 패널을 띄운다.
  - 현재 UX 정리 항목은 이 단계에서 최소 범위만 수행한다. 문구/버튼 행동을 성공/실패 모두 일관화한다.
- objective 확장은 실패 경로 연동까지 포함해 같이 마감한다.
  - `src/core/rules/ObjectiveManager.ts`에 `reach_cell`, `protect_unit`를 추가한다.
  - `reach_cell` 기본 정책: 지정 좌표에 지정 팀 유닛이 도달하면 성공.
  - `protect_unit` 기본 정책: 지정 유닛이 보드에서 사라지면 즉시 실패.
  - `protect_unit`에 별도 턴 조건은 넣지 않는다. 필요하면 stage의 다른 objective(`survive_n_turns`)와 조합한다.
- stage schema를 `src/data/schemas/stage.schema.json`에서 objective 확장에 맞춰 갱신한다.
  - `reach_cell`: `type`, `x`, `y`, `team` 필수
  - `protect_unit`: `type`, `unitId` 필수
- 디버그 콘텐츠를 최소 1회 갱신한다.
  - debug scenario에 성공 분기 1개, 실패 분기 1개를 넣어 실제 흐름을 검증한다.
  - 샘플 stage 중 하나는 `reach_cell` 또는 `protect_unit`을 사용하도록 바꿔 새 objective를 실제 경로에서 소비하게 한다.
- 구현 후 `docs/IMPLEMENTATION_STATUS.md`를 현재 기준으로 재정렬한다.
  - `Current Phase`는 **Phase B-2**
  - `Completed`, `In Progress`, `Not Started`, `Open Questions`, `Next Action`을 최신 상태로 전면 정리
  - 테스트 수와 빌드 결과는 최신 값으로 교체

## Public Interfaces / Types
- `ScenarioStep`
  - 추가: `onSuccess?: string`, `onFail?: string`
  - 유지: `nextStepId?: string`
- scenario transition resolver
  - 입력에 step 결과 구분값 추가
- `StageObjective`
  - 추가: `reach_cell`, `protect_unit`
- stage objective schema
  - `reach_cell { type, x, y, team }`
  - `protect_unit { type, unitId }`

## Test Plan
- loader 테스트
  - dialogue step의 `nextStepId` 전이
  - stage step의 `onSuccess` 전이
  - stage step의 `onFail` 전이
  - branch target 누락 시 예외
- objective 테스트
  - `reach_cell` 성공/진행 중
  - `protect_unit` 진행 중/즉시 실패
  - `protect_unit + survive_n_turns` 조합 시 fail 우선
- scene/flow 테스트 또는 최소 통합 검증
  - stage 성공 시 success branch 이동
  - stage 실패 시 fail branch 이동
  - `onFail` 없는 실패 스테이지에서 Retry 패널 표시
- 최종 검증
  - `env PATH=/home/deck/.nvm/versions/node/v20.19.5/bin:$PATH npm test`
  - `env PATH=/home/deck/.nvm/versions/node/v20.19.5/bin:$PATH npm run build`

## Assumptions
- 이번 단계는 조건부 분기, 다중 분기 우선순위, 확률 분기를 다루지 않는다.
- stage 성공/실패 외의 상태값은 추가하지 않는다.
- `protect_unit`의 보호 대상은 단일 `unitId` 기준이다.
- `reach_cell`은 “해당 칸 점유”만 본다. 경유 여부나 유지 턴 수는 다루지 않는다.
- `Phase_Plan_dev.md`에는 이 계획을 그대로 기록하고, 구현 완료 후에는 별도로 `docs/IMPLEMENTATION_STATUS.md`를 갱신한다.
