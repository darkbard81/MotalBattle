# Phase C-2 전투 연출 재정립 설계 (초안 v1)

기준일: 2026-03-27  
연계 로드맵: `RoadMap.md` Phase C-2  
현황 기준: `docs/IMPLEMENTATION_STATUS.md` Next Action #1

## 1. 목적
- 비활성화된 전투 연출(`swap`, `assist`, `hit`, `flash`, `die`)을 재활성화하기 위한
  타이밍/우선순위/입력 잠금 정책을 확정한다.
- 규칙 판정(Grid)을 건드리지 않고 Phaser 표현 레이어에서만 재정립한다.

## 2. 현재 코드 기준 트리거 인덱스

### 2.1 이벤트 enqueue 진입점
- `onSwap` -> `swap` enqueue: `src/phaser/scenes/GameScene.ts`
- `onBattleEvents` -> `assist`, `hit`, `flash(hazard)`, `die` enqueue: `src/phaser/scenes/GameScene.ts`

### 2.2 실행 큐
- 단일 큐: `src/phaser/animation/AnimationQueue.ts`
- 정책 상수: `src/phaser/animation/animationPolicy.ts`

### 2.3 실제 연출 실행 함수
- `playSwapAnimation`, `playAssistAttackAnimation`, `playHitAnimation`, `playDieAnimation`
  (`src/phaser/scenes/GameScene.ts`)

## 3. 정책 초안

| type   | duration(ms) | priority | board input lock |
|--------|--------------:|---------:|------------------|
| die    | 220           | 100      | true             |
| assist | 1000          | 80       | true             |
| hit    | 180           | 70       | true             |
| swap   | 180           | 40       | false            |
| flash  | 120           | 30       | false            |
| block  | 100           | 20       | false            |
| noop   | 0             | 0        | false            |

### 정책 의도
1. 결과 인지가 중요한 `die/hit/assist`는 우선순위를 높이고 입력 잠금을 허용.
2. 입력 체감 저하를 줄이기 위해 `swap/flash/block`은 비잠금 처리.
3. 동일 프레임 다중 이벤트는 우선순위 높은 이벤트부터 순차 처리.

## 4. 재활성화 단계 제안

### Stage 1 (기술 검증)
- `BATTLE_ANIMATIONS_ENABLED = true`를 로컬에서만 켜고 아래 시나리오 확인
  - 단일 hit
  - sandwich assist
  - hazard flash + die 연쇄

### Stage 2 (UX 보정)
- assist 1000ms 체감이 길면 700~850ms로 축소 검토
- die 연출 중 status/message 갱신 시점과 시각 피드백의 괴리 여부 점검

### Stage 3 (기본 활성화)
- 기본값 활성화 후, 큐 폭주 또는 입력 지연 발생 시 정책 수치 재조정

## 5. 오픈 포인트
1. `assist`를 비잠금으로 전환할지 여부
2. hazard는 `flash` 단일 처리 vs 전용 타입 분리
3. 우선순위 역전이 필요한 예외(튜토리얼 연출) 허용 범위

## 6. 수용 기준(초안)
- 연속 10턴 플레이 동안 큐 정체로 입력이 멈추는 체감이 없어야 한다.
- `die`가 `hit`보다 뒤늦게 보이는 역전 사례가 없어야 한다.
- 전투 결과 텍스트와 실제 연출 순서가 사용자 관점에서 모순되지 않아야 한다.
