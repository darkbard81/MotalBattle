# Phaser 기반 격자 + 자유 드래그 전술 퍼즐 RPG 개발 로드맵 (강화판)

이 문서는 **격자 기반 보드 규칙** 위에서 동작하지만, **유닛 이동은 자유 드래그처럼 보이고**,  
이동 중 **동료 유닛과 충돌하면 연쇄적으로 밀리거나 위치가 재배치되며**,  
그 결과 **협공 / 샌드위치 공격 / 전술적 배치 퍼즐**이 발생하는 전술 퍼즐 RPG를 개발하기 위한  
실전용 개발 로드맵이다.

이 문서의 목적은 단순 아이디어 정리가 아니라, 실제 제작 과정에서 바로 사용할 수 있는 수준의:

- 아키텍처 설계
- 시스템 분리 원칙
- 데이터 구조 제안
- 구현 우선순위
- 리스크 관리
- MVP 정의
- 확장 전략

까지 포함한 **실전 개발 문서**를 제공하는 것이다.

---

# 0. 핵심 컨셉 요약

이 게임의 장르는 겉으로 보면 “드래그 기반 전술 게임”처럼 보이지만, 실제 핵심은 다음 네 가지다.

1. **격자 기반 규칙 시스템**
2. **자유 드래그 입력 해석기**
3. **충돌 / 밀림 / 연쇄 이동 해결기**
4. **위치 기반 전투 판정기**

즉, 이 프로젝트에서 가장 중요한 설계 철학은 다음 한 줄로 정리된다.

> **Grid = 게임 규칙, Render = 연출**

이 원칙은 반드시 유지해야 한다.

- 격자는 게임의 진실(source of truth)
- 스프라이트 위치는 시각적 표현
- 드래그는 입력 방식일 뿐, 실제 규칙 판정은 보드가 담당
- 전투는 애니메이션 중 발생하지 않고, 보드 상태가 안정화된 뒤 계산됨

이 분리가 무너지면 다음 문제가 거의 반드시 발생한다.

- 드래그 중 셀 판정 흔들림
- 연쇄 밀림 중 중복 점유
- 애니메이션 중 입력 충돌
- 협공 판정 타이밍 오류
- 디버깅 불가
- 저장/로드 구조 불안정
- AI 구현 난이도 상승
- 리플레이 / 테스트 자동화 불가

---

# 1. 대상 기술 스택

## 기본 기술 스택

- **TypeScript**
- **Phaser 3**
- **Vite**
- **Tile 기반 Grid 시스템**
- **Tween 애니메이션**
- **Mouse + Touch Drag 입력**
- **JSON 기반 데이터 외부화**

## 권장 확정 값

### Engine
**Phaser 3 (Stable)**

#### 이유
- 실전용 예제와 문서가 풍부함
- Scene, Tween, Input, Asset 관리가 안정적임
- Phaser 4는 구조적으로 기대되지만, 실전 제품 안정성 관점에서는 Phaser 3가 보수적으로 유리함

---

### Language
**TypeScript**

#### 이유
- Unit / Board / Rule Resolver / Event Queue 등 구조화된 객체가 많음
- 타입 안정성이 유지보수 비용을 크게 줄임
- 협업 및 리팩토링이 쉬움
- 대형 시스템 분리 시 의존성이 명확해짐

---

### Build Tool
**Vite**

#### 이유
- 빠른 개발 서버
- 빌드 설정이 단순함
- 웹게임 프로토타이핑에 매우 적합
- TypeScript + Phaser 조합에서 DX가 좋음

---

### Renderer
**Phaser.AUTO**

#### 이유
- 가능한 경우 WebGL 사용
- 미지원 환경에서는 Canvas fallback
- 초기 개발 단계에서 가장 무난함

---

### Base Resolution
**1280 x 720**

#### 이유
- 16:9 표준
- UI 배치가 용이함
- 보드 + UI + 이펙트 배치에 충분한 공간 제공

---

### Aspect Ratio
**16:9**

#### 이유
- PC / 노트북 환경에서 일반적
- 전술 보드 게임에 안정적인 카메라 구성 가능

---

### Scale Mode
**FIT + CENTER_BOTH**

#### 이유
- 브라우저 크기 변화 대응
- 화면 왜곡 방지
- 중앙 정렬 유지

---

### Pixel Art Mode
**pixelArt: true**

#### 이유
- 도트 그래픽에서 선명도 유지
- 블러 방지

---

### Physics Engine
**코어 게임 규칙에는 사용하지 않음**

#### 이유
이 게임의 이동과 충돌은:
- 물리 엔진 기반 반응이 아니라
- 격자 규칙 기반 판정이기 때문이다.

즉:
- Arcade Physics: 보조 연출용으로는 가능
- Matter Physics: 본 게임 규칙에는 과함
- 코어 충돌/이동은 반드시 직접 구현

---

### Input Strategy
**Mouse + Touch Drag**

#### 이유
- 유닛 이동이 드래그 중심
- PC와 모바일 대응 가능
- UX 확장이 쉬움

---

### Platform Target
**Web First → Desktop Later**

#### 이유
- 브라우저 테스트 속도가 빠름
- 반복 개발에 유리
- 후속으로 Electron / NW.js / Steam 배포 가능

---

# 2. 전체 개발 단계 개요

전체 개발은 다음 13단계로 진행하는 것을 권장한다.

1. 프로젝트 기반 구축
2. 코어 규칙 엔진 구축
3. Grid 보드 시스템 구현
4. 유닛 시스템 구현
5. 드래그 입력 해석기 구현
6. 이동 / 충돌 / 밀림 시스템 구현
7. 전투 시스템 구현
8. 애니메이션 시스템 구현
9. UI 시스템 구현
10. 이벤트 / 연출 시스템 구현
11. 콘텐츠 제작
12. 최적화
13. 배포

이 순서는 단순 기능 나열이 아니라, **실패 확률이 낮은 구현 순서**다.

---

# 3. 최우선 설계 철학

## 3.1 Model과 View 분리

### Model
게임 규칙의 실제 상태

예:
- 유닛의 격자 좌표
- HP
- 팀 정보
- 이동 가능 여부
- 보드 점유 상태
- 턴 상태
- 효과/버프 상태

### View
화면에 보이는 상태

예:
- 스프라이트 위치
- 트윈 이동
- 피격 이펙트
- UI 숫자
- 선택 하이라이트
- 경로 미리보기

### 원칙
- Model이 먼저 결정된다
- View는 Model 결과를 따라간다
- View는 게임 규칙을 결정하지 않는다

---

## 3.2 Input → Intent → Resolve → Animate 구조

사용자의 드래그 입력을 바로 유닛 이동으로 처리하면 안 된다.

항상 다음 구조를 거쳐야 한다.

```text
Input
 -> DragInterpreter
 -> MoveIntent
 -> TurnResolver
    -> MoveResolver
    -> PushResolver
    -> BattleResolver
 -> Result
 -> AnimationQueue
 -> UI Update

이 구조를 따르면 다음 장점이 있다.

규칙이 결정론적임

애니메이션과 판정이 섞이지 않음

테스트가 쉬움

AI도 같은 인터페이스 사용 가능

리플레이/로그 저장이 가능

버그 재현이 쉬움

3.3 턴 해결 순서의 명확화

이 게임은 순서가 매우 중요하다.

권장 턴 해결 순서는 다음과 같다.

입력 수신

이동 의도 생성

이동 가능성 검사

충돌/밀림 해결

보드 상태 확정

전투 판정

데미지 적용

사망 처리

후속 효과 처리

턴 종료 처리

UI 갱신

다음 입력 허용

이 순서가 문서에 명시되어 있어야 한다.

4. 프로젝트 기반 구축
목표

게임 실행 가능한 최소 구조 만들기

작업 항목

Phaser 프로젝트 생성

Vite 설정

기본 Scene 구조 설계

에셋 로딩 파이프라인 구성

기본 렌더 루프 구축

전역 상수 / 설정 파일 분리

권장 Scene 구성

BootScene

PreloadScene

TitleScene

GameScene

UIScene

BootScene

전역 설정 초기화

레지스트리 초기값 설정

스케일, 입력, 공용 설정

PreloadScene

스프라이트

타일맵

UI 에셋

사운드

데이터 파일 로딩

TitleScene

타이틀 화면

시작 / 옵션 / 계속하기

세이브 로드 진입점

GameScene

보드, 유닛, 입력, 규칙, 애니메이션

실제 게임 플레이 담당

UIScene

HP 바

턴 정보

버튼

로그

스킬 UI

설명 패널

기본 폴더 구조 권장안
src/
 ├ main.ts
 ├ game/
 │   ├ Game.ts
 │   ├ config.ts
 │   └ constants.ts
 │
 ├ core/
 │   ├ board/
 │   │   ├ Board.ts
 │   │   ├ Cell.ts
 │   │   └ BoardQuery.ts
 │   │
 │   ├ unit/
 │   │   ├ Unit.ts
 │   │   ├ UnitState.ts
 │   │   └ UnitFactory.ts
 │   │
 │   ├ rules/
 │   │   ├ MoveResolver.ts
 │   │   ├ PushResolver.ts
 │   │   ├ BattleResolver.ts
 │   │   ├ TurnResolver.ts
 │   │   └ RuleTypes.ts
 │   │
 │   ├ combat/
 │   │   ├ DamageCalculator.ts
 │   │   └ ConditionChecker.ts
 │   │
 │   ├ event/
 │   │   ├ EventBus.ts
 │   │   ├ GameEvent.ts
 │   │   └ ScriptRunner.ts
 │   │
 │   └ types/
 │       ├ common.ts
 │       └ enums.ts
 │
 ├ phaser/
 │   ├ scenes/
 │   │   ├ BootScene.ts
 │   │   ├ PreloadScene.ts
 │   │   ├ TitleScene.ts
 │   │   ├ GameScene.ts
 │   │   └ UIScene.ts
 │   │
 │   ├ objects/
 │   │   ├ UnitView.ts
 │   │   ├ BoardView.ts
 │   │   ├ CellHighlight.ts
 │   │   └ EffectView.ts
 │   │
 │   ├ input/
 │   │   ├ DragController.ts
 │   │   └ SelectionController.ts
 │   │
 │   └ animation/
 │       ├ AnimationQueue.ts
 │       ├ TweenHelper.ts
 │       └ CombatEffectPlayer.ts
 │
 ├ data/
 │   ├ units/
 │   ├ enemies/
 │   ├ skills/
 │   ├ items/
 │   ├ maps/
 │   └ scenarios/
 │
 └ assets/
     ├ image/
     ├ audio/
     ├ tilemap/
     └ ui/
기본 Phaser 설정 예시
import Phaser from "phaser";
import { BootScene } from "../phaser/scenes/BootScene";
import { PreloadScene } from "../phaser/scenes/PreloadScene";
import { TitleScene } from "../phaser/scenes/TitleScene";
import { GameScene } from "../phaser/scenes/GameScene";
import { UIScene } from "../phaser/scenes/UIScene";

export const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: "#101018",
  pixelArt: true,
  scene: [BootScene, PreloadScene, TitleScene, GameScene, UIScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};
5. 코어 규칙 엔진 구축
목표

Phaser 없이도 동작 가능한 보드 규칙 로직을 만든다.

이 단계는 매우 중요하다.
실전에서 가장 많은 시간을 잡아먹는 부분은 렌더링이 아니라 규칙 충돌이다.

따라서 초기에:

이동

점유

충돌

밀림

협공

턴 순서

를 순수 TypeScript 로직으로 먼저 고정하는 것이 좋다.

핵심 객체
Vec2
export interface Vec2 {
  x: number;
  y: number;
}
Team
export type Team = "ally" | "enemy" | "neutral";
UnitData
export interface UnitData {
  id: string;
  name: string;
  team: Team;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  moveRange: number;
  weight: number;
  canBePushed: boolean;
}
Unit
export class Unit {
  id: string;
  name: string;
  team: Team;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  moveRange: number;
  weight: number;
  canBePushed: boolean;
  gridPos: Vec2;

  constructor(data: UnitData, pos: Vec2) {
    this.id = data.id;
    this.name = data.name;
    this.team = data.team;
    this.hp = data.hp;
    this.maxHp = data.maxHp;
    this.atk = data.atk;
    this.def = data.def;
    this.moveRange = data.moveRange;
    this.weight = data.weight;
    this.canBePushed = data.canBePushed;
    this.gridPos = pos;
  }

  isAlive(): boolean {
    return this.hp > 0;
  }
}
6. Grid 보드 시스템
목표

격자 기반 논리 좌표 시스템 구축

책임

격자 크기 관리

셀 정보 관리

점유 상태 관리

범위 검사

보드 질의(query) 제공

권장 데이터 구조

유닛 인스턴스를 바로 2차원 배열에 넣는 대신, unitId를 저장하는 것을 권장한다.

이유

참조 꼬임 감소

세이브/로드 쉬움

디버깅 쉬움

View와 분리 쉬움

리플레이/로그 기록 유리

예시 구조
export class Board {
  width: number;
  height: number;
  cells: (string | null)[][];
  units: Map<string, Unit>;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.cells = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => null)
    );
    this.units = new Map();
  }

  isInside(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  isEmpty(x: number, y: number): boolean {
    return this.isInside(x, y) && this.cells[y][x] === null;
  }

  getUnitAt(x: number, y: number): Unit | null {
    if (!this.isInside(x, y)) return null;
    const id = this.cells[y][x];
    if (!id) return null;
    return this.units.get(id) ?? null;
  }

  placeUnit(unit: Unit, x: number, y: number): void {
    if (!this.isInside(x, y)) {
      throw new Error("placeUnit: out of bounds");
    }
    if (!this.isEmpty(x, y)) {
      throw new Error("placeUnit: target cell occupied");
    }

    unit.gridPos = { x, y };
    this.units.set(unit.id, unit);
    this.cells[y][x] = unit.id;
  }

  removeUnit(unitId: string): void {
    const unit = this.units.get(unitId);
    if (!unit) return;
    const { x, y } = unit.gridPos;
    if (this.isInside(x, y) && this.cells[y][x] === unitId) {
      this.cells[y][x] = null;
    }
    this.units.delete(unitId);
  }

  moveUnit(unitId: string, newX: number, newY: number): void {
    const unit = this.units.get(unitId);
    if (!unit) throw new Error("moveUnit: unit not found");
    if (!this.isInside(newX, newY)) throw new Error("moveUnit: out of bounds");
    if (!this.isEmpty(newX, newY)) throw new Error("moveUnit: target occupied");

    const { x, y } = unit.gridPos;
    this.cells[y][x] = null;
    this.cells[newY][newX] = unitId;
    unit.gridPos = { x: newX, y: newY };
  }
}
Cell 확장 가능 속성

초기에는 단순해도 되지만, 나중에는 셀에 다음 속성이 들어갈 수 있다.

interface CellData {
  terrainType: "floor" | "wall" | "water" | "hazard";
  moveCost: number;
  blocksPush: boolean;
  blocksMove: boolean;
  effectId?: string;
}
향후 활용

늪지형 이동 감속

함정 타일

화염 지형

얼음 타일(미끄러짐)

벽 판정

이벤트 트리거

7. 유닛 시스템
목표

게임 캐릭터의 상태와 규칙 데이터를 관리한다.

구조

유닛은 데이터, 논리 상태, 표현 객체를 분리하는 것이 좋다.

구분

UnitData : 초기 정의

Unit : 실제 전투 상태

UnitView : Phaser 스프라이트/이펙트 관리

예시 설계
export interface UnitState {
  hasActed: boolean;
  hasMoved: boolean;
  stunned: boolean;
  selected: boolean;
}
export class Unit {
  id: string;
  team: Team;
  hp: number;
  atk: number;
  def: number;
  moveRange: number;
  weight: number;
  canBePushed: boolean;
  gridPos: Vec2;
  state: UnitState;

  constructor(...) {
    // ...
  }

  applyDamage(amount: number): void {
    this.hp = Math.max(0, this.hp - amount);
  }

  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  isAlive(): boolean {
    return this.hp > 0;
  }
}
향후 확장 요소

클래스/직업

속성 상성

버프/디버프

상태이상

무게/밀림 저항

태그 기반 스킬 판정

장비

패시브

8. 드래그 입력 시스템
목표

유닛을 자유롭게 드래그하는 것처럼 보이게 하되,
실제 규칙은 격자 기반으로 해석한다.

매우 중요한 원칙

드래그 입력은 규칙이 아니다.
드래그 입력은 오직 의도 입력 장치다.

즉:

손가락/마우스는 자유롭게 움직일 수 있음

스프라이트는 부드럽게 따라다닐 수 있음

하지만 실제 이동은 격자 셀 단위로 해석됨

드래그 처리 단계

유닛 선택

드래그 시작 셀 기록

포인터 위치 추적

월드 좌표 → 그리드 좌표 변환

경계 넘김 감지

경로(path) 갱신

드래그 종료 시 MoveIntent 생성

규칙 엔진에 전달

좌표 변환
function screenToGrid(
  screenX: number,
  screenY: number,
  boardOriginX: number,
  boardOriginY: number,
  tileSize: number
) {
  return {
    x: Math.floor((screenX - boardOriginX) / tileSize),
    y: Math.floor((screenY - boardOriginY) / tileSize)
  };
}
단순 드래그 예시
this.input.on("drag", (_pointer, gameObject, dragX, dragY) => {
  gameObject.x = dragX;
  gameObject.y = dragY;
});

하지만 실전에서는 위 코드만으로 부족하다.

추가로 필요하다.

드래그 중 현재 셀 계산

경로 미리보기

보드 밖 이탈 처리

드래그 취소 조건

점유 셀 접근 허용 여부

유효/무효 셀 표시

마지막 입력 방향 추적

자유 드래그 해석 방식 권장안
방식 A. 최종 셀만 판정

장점: 구현 쉬움

단점: 경로 기반 퍼즐성과 충돌 규칙이 약함

방식 B. 셀 경계 기반 경로 추적

장점: 전술성과 밀림 시스템에 적합

단점: 구현 복잡

이 게임은 방식 B가 더 어울린다.

반드시 정의해야 하는 입력 규칙

대각 이동 허용 여부

한 번에 여러 칸 이동 가능한지

되돌아간 경로(backtrack) 허용 여부

이동 범위 초과 시 처리

셀 경계 넘김 판정 기준

드래그 중 다른 유닛 위를 지나갈 수 있는지

드래그 종료 후 원위치 복귀 조건

9. 이동 시스템
목표

드래그 의도를 실제 보드 이동으로 변환한다.

이 단계에서 해야 할 일은 다음과 같다.

시작 위치 확인

목표 위치 확인

이동 범위 검사

경로 유효성 검사

점유 셀 확인

충돌 처리 여부 결정

최종 이동 결과 산출

MoveIntent 예시
export interface MoveIntent {
  unitId: string;
  start: Vec2;
  path: Vec2[];
  finalTarget: Vec2;
}
MoveResult 예시
export interface MoveResult {
  success: boolean;
  movedUnitIds: string[];
  finalPositions: Record<string, Vec2>;
  triggeredBattles: BattleEvent[];
  failedReason?: string;
}
이동 실패 사유 예시

보드 밖

이동 범위 초과

벽

이동 불가 지형

밀림 불가 대상 존재

연쇄 끝이 막힘

상태이상으로 이동 불가

10. 충돌 및 밀림 시스템
목표

유닛이 다른 유닛과 충돌할 때, 규칙적으로 위치 재배치를 수행한다.

이 시스템은 게임의 핵심 퍼즐 요소다.

기본 규칙 예시

유닛 A가 이동 중이고, 이동 방향에 유닛 B가 있다면:

B가 밀릴 수 있으면 밀림 시도

B 앞에 C가 있으면 C도 연쇄 검사

연쇄 끝이 비어 있으면 뒤에서부터 한 칸씩 밀림

끝이 막혀 있으면 전체 이동 실패

예시:

A -> B -> C -> 빈칸

결과:

A 이동
B 한 칸 밀림
C 한 칸 밀림
연쇄 밀림 권장 규칙

이동 방향 결정

첫 충돌 셀 확인

연쇄 대상 리스트 수집

밀림 가능한지 전체 검사

실패면 전체 취소

가능하면 뒤에서부터 이동

마지막으로 주체 유닛 이동

예시 코드
function resolvePushChain(
  board: Board,
  startX: number,
  startY: number,
  dx: number,
  dy: number
): { success: boolean; movedUnitIds: string[] } {
  const chain: Unit[] = [];
  let x = startX;
  let y = startY;

  while (board.isInside(x, y) && board.getUnitAt(x, y)) {
    const unit = board.getUnitAt(x, y)!;

    if (!unit.canBePushed) {
      return { success: false, movedUnitIds: [] };
    }

    chain.push(unit);
    x += dx;
    y += dy;
  }

  if (!board.isInside(x, y) || !board.isEmpty(x, y)) {
    return { success: false, movedUnitIds: [] };
  }

  const moved: string[] = [];

  for (let i = chain.length - 1; i >= 0; i--) {
    const u = chain[i];
    board.moveUnit(u.id, u.gridPos.x + dx, u.gridPos.y + dy);
    moved.push(u.id);
  }

  return { success: true, movedUnitIds: moved };
}
반드시 설계해야 할 예외 규칙
1. 벽이 있을 때

벽은 밀리지 않음

전체 이동 실패

2. 보드 밖일 때

보드 밖으로 밀릴 수 없음

전체 이동 실패

또는 특정 게임에선 낙하/즉사 규칙 가능

3. 적과 아군이 섞일 때

선택지가 필요하다.

모든 유닛 동일하게 밀림

아군만 밀림

적은 충돌 시 공격 판정

무거운 적은 고정체처럼 작동

4. 무게(weight)

예:

가벼운 유닛만 밀림

밀려는 유닛의 힘이 더 커야 밀 수 있음

총 무게 제한 존재 가능

5. 연쇄 끝이 막혀 있을 때

정책 결정 필요:

전체 취소

일부만 이동

충돌 데미지 발생

반동 발생

초기 MVP는 전체 취소가 가장 안전하다.

11. 전투 시스템
목표

위치 기반 전술 공격을 구현한다.

이 게임의 전투는 “직접 공격 버튼”보다 이동 결과로 만들어지는 위치 관계에 더 큰 의미가 있다.

핵심 전투 컨셉: 협공 / 샌드위치

예시:

A - Enemy - B

이 상태가 되면 적이 협공 당한다.

매우 중요한 규칙

전투 판정은 이동과 밀림이 모두 끝난 후 수행한다.

즉:

드래그 중 공격 없음

애니메이션 중 실시간 판정 없음

보드 상태 안정화 후 판정

기본 샌드위치 판정 예시
function checkSandwich(board: Board, enemyX: number, enemyY: number): boolean {
  const left = board.getUnitAt(enemyX - 1, enemyY);
  const right = board.getUnitAt(enemyX + 1, enemyY);

  if (left && right && left.team === "ally" && right.team === "ally") {
    return true;
  }

  return false;
}
일반화된 방향 검사
const SANDWICH_DIRS = [
  [{ x: -1, y: 0 }, { x: 1, y: 0 }],
  [{ x: 0, y: -1 }, { x: 0, y: 1 }]
];

이렇게 하면:

수평

수직

둘 다 처리할 수 있다.

반드시 정해야 할 전투 규칙

수평만 허용?

수직도 허용?

대각선도 허용?

아군 2명만 있으면 발동?

특정 무기만 협공 가능?

밀림 결과로 만들어진 샌드위치도 유효?

한 턴에 여러 적이 동시에 협공될 수 있는가?

죽은 적 제거 후 연쇄 전투가 있는가?

데미지 규칙 예시
단순형

협공 성립 시 적에게 고정 데미지

합산형

양쪽 유닛 공격력 합산

우위형

협공 시 방어 무시

특수형

협공 시 기절 / 밀침 / 상태이상 발생

MVP에서는 고정 데미지 또는 단순 합산형이 가장 안전하다.

추천 전투 처리 순서

이동 종료

밀림 종료

보드 상태 안정화

협공 체크

데미지 적용

사망 판정

제거 처리

후속 효과 적용

12. 애니메이션 시스템
목표

논리 결과를 자연스럽게 표현한다.

애니메이션은 게임 규칙을 결정하지 않는다.
오직 계산된 결과를 보기 좋게 재생한다.

권장 구성

이동 트윈

밀림 트윈

피격 효과

사망 효과

셀 강조

경로 미리보기

협공 연출

이동 트윈 예시
scene.tweens.add({
  targets: unitSprite,
  x: targetX,
  y: targetY,
  duration: 200,
  ease: "Quad.Out"
});
권장 분리
Tween

위치 이동

점프

흔들림

확대/축소

Animation

걷기 프레임

공격 프레임

피격 프레임

대기 프레임

FX

파티클

슬래시 이펙트

데미지 숫자

셀 플래시

AnimationQueue가 필요한 이유

연쇄 밀림, 협공, 사망 등이 동시에 발생할 수 있기 때문에
시각적 재생 순서를 통제하는 큐가 필요하다.

예시 순서

이동 재생

밀림 재생

충돌 효과

협공 강조

데미지 숫자

사망 처리

보드 정리

애니메이션 큐 예시 구조
interface AnimationCommand {
  type: "move" | "push" | "hit" | "die" | "flash";
  unitId?: string;
  from?: Vec2;
  to?: Vec2;
  duration?: number;
}
13. UI 시스템
목표

게임 진행 정보를 명확하게 전달한다.

주요 UI 요소

HP 바

턴 표시

선택 유닛 정보

스킬 버튼

이동 가능 범위 표시

협공 가능 표시

메뉴 버튼

로그 패널

목표 조건 표시

UIScene 권장 구조
UIScene
 ├ turn indicator
 ├ selected unit panel
 ├ health bars
 ├ skill buttons
 ├ pause/menu
 └ battle log
UX에서 중요한 포인트

드래그 중 현재 경로 표시

이동 불가 셀은 즉시 시각 피드백

밀림 예상 경로 표시

협공 성립 예상 위치 강조

선택/해제 상태 명확히 표현

실수 방지를 위한 복귀/취소 UX 고려

14. 이벤트 시스템
목표

스토리, 컷신, 스크립트 이벤트, 트리거를 관리한다.

구성 요소

대화 이벤트

컷신 재생

카메라 이동

스폰 트리거

승리/패배 조건 변화

튜토리얼 스크립트

스테이지 기믹 이벤트

권장 구조
EventSystem
 ├ dialogue
 ├ cutscene
 ├ trigger
 ├ scripted action
 └ camera event
트리거 예시

특정 셀 진입

적 전멸

특정 유닛 사망

특정 턴 도달

특정 오브젝트 파괴

협공 성공 횟수

15. 콘텐츠 제작
제작 요소

맵 제작

적 데이터

아군 유닛 데이터

스킬

아이템

스테이지 목표

대화

튜토리얼

보스 기믹

데이터 외부화 예시
data/
 ├ enemies.json
 ├ units.json
 ├ skills.json
 ├ items.json
 ├ maps/
 │   ├ stage_01.json
 │   ├ stage_02.json
 │   └ boss_01.json
 └ scenarios/
     ├ intro.json
     └ chapter_01.json
맵 데이터 예시
{
  "id": "stage_01",
  "width": 8,
  "height": 8,
  "terrain": [
    ["floor","floor","floor","wall","floor","floor","floor","floor"],
    ["floor","floor","floor","wall","floor","floor","floor","floor"]
  ],
  "units": [
    { "unitId": "hero_01", "x": 1, "y": 1 },
    { "unitId": "ally_01", "x": 2, "y": 1 },
    { "unitId": "enemy_01", "x": 5, "y": 1 }
  ]
}
16. 시스템 간 의존성 관리
좋지 않은 구조

GameScene가 Board/Unit/UI/Event/Combat 전부 직접 제어

Sprite 위치를 곧 게임 상태로 취급

입력 중 곧바로 데미지 처리

권장 구조

GameScene는 조립자(orchestrator)

실제 규칙은 core/ 아래에 존재

Phaser 오브젝트는 phaser/ 아래에서 관리

데이터는 data/에 분리

입력은 Intent 생성만 담당

최종 권장 아키텍처
Game
 │
 ├ Scene
 │   ├ BootScene
 │   ├ PreloadScene
 │   ├ TitleScene
 │   ├ GameScene
 │   └ UIScene
 │
 ├ Core
 │   ├ Board
 │   ├ Unit
 │   ├ MoveResolver
 │   ├ PushResolver
 │   ├ BattleResolver
 │   └ TurnResolver
 │
 ├ Phaser Layer
 │   ├ BoardView
 │   ├ UnitView
 │   ├ DragController
 │   ├ AnimationQueue
 │   └ EffectPlayer
 │
 ├ Systems
 │   ├ EventSystem
 │   ├ SaveSystem
 │   ├ AudioSystem
 │   └ UIStateSystem
 │
 └ Data
     ├ Maps
     ├ Units
     ├ Skills
     ├ Items
     └ Scenarios
17. MVP 전략

모든 기능을 한 번에 넣지 말고, 단계적으로 검증해야 한다.

MVP-1

가장 먼저 재미와 규칙만 검증

포함 기능

8x8 보드

아군 2, 적 1

한 칸 이동

드래그 또는 클릭 이동

충돌 시 한 줄 밀림

수평 협공 판정

HP 감소 표시

목표

핵심 퍼즐성이 재미있는지 확인

MVP-2

자유 드래그 감각과 전술성 강화

포함 기능

여러 칸 이동

경로 표시

연쇄 밀림

수직 협공

이동 불가 판정

턴 시스템

기본 적 배치

목표

실제 플레이 루프가 성립하는지 확인

MVP-3

게임다운 구조 추가

포함 기능

적 AI

스킬

스테이지 목표

UI 확장

컷신 이벤트

이펙트 보강

목표

콘텐츠 제작 가능한 프레임 확보

18. 추천 구현 순서

실전에서는 다음 순서가 가장 안전하다.

Phaser 프로젝트 생성

순수 TypeScript Board 구현

Unit 데이터 구조 구현

이동 검사 구현

충돌/밀림 해결기 구현

협공 판정 구현

콘솔 기반 테스트 작성

Phaser GameScene 연결

UnitView / BoardView 연결

드래그 입력 연결

AnimationQueue 연결

UI 연결

데이터 외부화

적 AI 구현

콘텐츠 생산

최적화

배포

19. 테스트 전략

이 장르는 테스트가 매우 중요하다.

최소한 필요한 테스트
보드 테스트

범위 검사

점유 검사

배치 / 제거 / 이동

밀림 테스트

단일 밀림

연쇄 밀림

보드 끝 막힘

벽 막힘

밀림 불가 유닛 포함

전투 테스트

수평 샌드위치

수직 샌드위치

미성립 케이스

밀림 후 성립 케이스

턴 테스트

이동 후 전투 발생

사망 처리

턴 종료

중복 행동 방지

추천 방식

core 로직은 Jest/Vitest 등으로 단위 테스트

Phaser 레이어는 수동 테스트 비중이 높아도 됨

규칙 엔진은 자동 테스트 우선

20. 적 AI 확장 방향

초기에는 복잡한 AI보다 규칙 기반 우선순위 AI가 적합하다.

간단한 AI 전략 예시

협공을 피하려고 이동

아군을 밀어내는 플레이어를 방해

플레이어를 벽 쪽으로 몰기

가장 약한 유닛을 노림

특정 목표 타일 수비

고급 AI 확장

보드 평가 함수

협공 위험도 계산

다음 턴 예측

A* + 규칙 기반 위험 회피

21. 성능 및 최적화

이 장르는 일반적으로 초고성능이 필요한 편은 아니지만, 아래 최적화는 유효하다.

최적화 항목

불필요한 오브젝트 생성 최소화

이펙트 오브젝트 풀링

경로 미리보기 재사용

UI 갱신 최소화

연속 Tween 남발 방지

큰 데이터 로딩 시 분할 처리

렌더링 최적화

보드 배경은 가능한 정적 처리

하이라이트 재사용

파티클 과다 사용 주의

텍스트 오브젝트 남발 주의

22. 저장/로드 고려

초기부터 저장 가능한 구조를 염두에 두는 것이 좋다.

저장 대상 예시

현재 맵 ID

유닛 상태

턴 수

이벤트 플래그

인벤토리

퀘스트 상태

저장하기 좋은 이유

디버그 편함

리플레이/재현 편함

스테이지 재개 가능

QA 효율 상승

23. 배포 계획
대상 플랫폼

Web

Desktop(Electron / NW.js)

추후 Mobile 검토 가능

빌드 체계

Web: Vite

Desktop: Electron 또는 NW.js

Steam: Desktop 빌드 + Steamworks 연동

24. 실전에서 가장 위험한 지점

이 프로젝트에서 가장 흔한 실패 포인트는 다음과 같다.

1. 드래그 감각과 격자 판정이 충돌

해결:

자유 드래그는 View

판정은 Grid 기준 고정

2. 애니메이션과 규칙이 섞임

해결:

Result 먼저 계산

AnimationQueue 나중 재생

3. 밀림 규칙이 예외 케이스에서 무너짐

해결:

실패 조건을 문서화

자동 테스트 작성

4. 모든 기능을 한 번에 넣으려 함

해결:

MVP-1부터 검증

5. GameScene 비대화

해결:

Core / Phaser Layer / Data 분리

25. 핵심 설계 원칙 최종 정리
원칙 1

Grid는 규칙의 진실이다.

원칙 2

드래그는 입력 방식일 뿐, 이동 규칙이 아니다.

원칙 3

애니메이션은 결과를 보여줄 뿐, 판정을 하지 않는다.

원칙 4

충돌/밀림/전투는 반드시 결정론적 순서로 처리한다.

원칙 5

Phaser는 표현 레이어, 게임의 본체는 core 규칙 엔진이다.

26. 최종 개발 순서 요약

Phaser 프로젝트 생성

Board 구현

Unit 구현

MoveIntent 설계

PushResolver 구현

BattleResolver 구현

TurnResolver 구현

테스트 작성

GameScene 연결

DragController 연결

AnimationQueue 구현

UIScene 구현

EventSystem 구현

데이터 외부화

콘텐츠 제작

최적화

배포

27. 결론

이 구조를 따르면 다음이 가능해진다.

격자 기반 규칙 안정성 확보

자유 드래그 UX 구현

연쇄 밀림 퍼즐 구현

협공 전술 구현

AI / 저장 / 테스트 / 리플레이 확장 가능

Phaser 의존도를 표현 레이어로 제한

즉, 이 프로젝트의 성공 포인트는 단순히 “Phaser로 드래그 게임 만들기”가 아니라,

격자 기반 규칙 엔진 위에, 드래그 감각과 연쇄 상호작용을 안전하게 얹는 것

이다.

이 문서의 구조를 기반으로 개발하면,
격자 기반이지만 정적인 체스류와는 다른,
유동적이고 손맛 있는 전술 퍼즐 RPG를 안정적으로 구현할 수 있다
