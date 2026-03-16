# Implementation Status

## 1. Current Phase
- 현재 단계: MVP-3 초입
- 기준 날짜: 2026-03-15
- 최신 상태: 코어 규칙, 입력, 렌더, 데이터 외부화, 최소 적 AI, 시나리오/다중 스테이지 기본 흐름까지 완료. 다음은 다중 스테이지 UX 정리와 콘텐츠 확장

## 2. Completed
- 1단계 프로젝트 기반 구축 완료
- Vite + TypeScript + Phaser 최소 프로젝트 구성 완료
- `BootScene`, `PreloadScene`, `TitleScene`, `GameScene`, `UIScene` 골격 구현 완료
- `src/core` 기반 순수 TypeScript 코어 규칙 레이어 추가 완료
- `Board`, `Cell`, `BoardQuery` 기본 구현 완료
- `Unit`, `UnitState`, `UnitFactory` 기본 구현 완료
- `MoveIntent`, `MoveResult`, `BattleEvent`, `PushResult` 타입 정의 완료
- `MoveResolver`, `PushResolver`, `BattleResolver`, `TurnResolver` 기본 구현 완료
- `Vitest` 기반 자동 테스트 환경 도입 완료
- 보드, 밀림, 전투, 턴 해결 테스트 작성 완료
- 현재 기준 core 테스트 13개 통과
- `GameScene`와 core 상태를 연결한 최소 디버그 루프 구현 완료
- 디버그 전투 보드 생성 및 샘플 턴 실행 연결 완료
- `.env` 기반 디버그 플래그 추가 완료
- `VITE_DEBUG_ON=true`일 때 `console` 디버그 로그 출력 연결 완료
- `BoardView`, `UnitView` 기본 분리 완료
- `GameScene`를 표현 레이어 조립자 역할로 1차 정리 완료
- `DragController` 최소 입력 연결 완료
- 아군 선택 후 인접 칸 이동 의도 생성 흐름 연결 완료
- 드래그 중 실시간 `swap/block` 상호작용 모델로 전환 완료
- `Board.swapUnits` 및 `DragInteractionResolver` 추가 완료
- 드래그 종료 또는 5초 종료 시 전투 판정 연결 완료
- 드래그 중 포인터 추종 표현 추가 완료
- 드래그 중 유효/무효/swap 셀 하이라이트 추가 완료
- swap 대상 아군 유닛의 부드러운 이동 연출 추가 완료
- block는 추가 연출 없이 현재 위치 유지로 확정 및 반영 완료
- 보드 상단 Header 구역 추가 완료
- 드래그 5초 타이머를 Header UI에 표시하도록 연결 완료
- `AnimationQueue` 최소 버전 도입 완료
- swap 연출 호출을 `GameScene`에서 큐 기반 구조로 이관 완료
- `AnimationQueue` 명령을 `swap`, `block`, `flash`, `hit`, `die`, `noop`으로 확장 완료
- block 셀 flash 및 전투 hit/die 연출 큐 연결 완료
- 확정된 밀림 규칙을 `PushResolver`/`MoveResolver`와 테스트에 반영 완료
- `VITE_DEBUG_ON` 기반 드래그/전투/씬 초기화 디버그 로그 형식 정리 완료
- `stunned`, `hasActed` 상태를 core 이동/드래그 제한에 반영 완료
- `hazard` 지형 타입을 core 셀 구조와 테스트에 반영 완료
- `hazard` 고정 데미지를 `src/data/config.json`의 `hazardDamage` 값으로 읽도록 연결 완료
- `hazard` 적용 순서를 전투 후 후속 효과 처리로 고정 완료
- `UIScene`를 실제 UI 레이어로 확장 완료
- Header/상태/선택 유닛/전투 요약 텍스트를 `GameScene`에서 `UIScene`으로 이관 완료
- 디버그 전투 보드의 맵/유닛 데이터를 JSON으로 외부화 완료
- `StageLoader`를 추가해 맵/유닛 데이터로부터 `Board`를 조립하도록 연결 완료
- 유닛 카탈로그/스테이지 데이터용 JSON Schema 추가 완료
- 유닛 데이터에 `sprite_path` 필드 추가 완료
- 공통 `image_area(x, y, w, h)` 스키마 추가 및 유닛/스테이지 데이터에 연결 완료
- 스테이지 데이터에 `background_path` 필드 추가 및 예시 스테이지에 반영 완료
- 자유 이동 기준에 맞춰 `moveRange` 필드를 유닛 데이터/타입/이동 실패 규칙에서 제거 완료
- `PreloadScene`, `BoardView`, `UnitView`를 데이터의 `sprite_path`, `background_path`, `image_area`와 연결해 실제 이미지 기반 전투 화면 렌더링 완료
- 규칙 기반 최소 적 AI 추가 완료
- 적 유닛 단독 공격 및 50% 타깃 선택(가까운 아군 / 방어가 낮은 아군) 규칙 반영 완료
- 추가 스테이지 포맷 확장을 위해 `title`, `description`, `objective` 메타데이터를 stage schema에 추가 완료
- 시나리오 데이터용 JSON Schema 및 다중 스테이지 예제(`stage-01`, `stage-02`, `debug-scenario`) 추가 완료
- `ScenarioLoader` 추가 및 `debug-scenario` 기반 최소 다중 스테이지 흐름 연결 완료
- `dialogue -> stage -> next stage` 자동 전환과 스테이지 클리어 기반 다음 step 진행 연결 완료
- 외부 대화 데이터(`dialog-01.json`) 참조를 위한 `dialogId` 기반 시나리오 연결 완료
- dialogue step 전용 오버레이 UI 및 SPACE/ENTER/클릭 진행 입력 연결 완료
- 스테이지 클리어/시나리오 완료 시 `Next Stage`, `Retry`, `Back To Title` 전환 패널 UI 연결 완료
- `TitleScene`에서 시나리오 선택 후 시작하는 흐름 연결 완료
- `UnitView`를 격자 크기 기준 라운드 사각형 프레임과 내부 스프라이트 비율 유지 렌더링으로 전환 완료
- `BoardView`/`UnitView`의 crop 기반 이미지 스케일 계산을 수정해 초기 표시와 드래그 후에도 배경/유닛 비율이 유지되도록 보정 완료
- `UnitView`는 `unit.image_area`가 있으면 잘린 별도 텍스처를 생성해 `spriteImage`에 직접 적용하도록 단순화 완료
- `BoardView`도 `image_area`가 있으면 잘린 별도 텍스처를 생성해 배경 이미지에 직접 적용하도록 단순화 완료
- 게임 화면 기준을 `2560x1440` 가상 해상도로 확장하고 `UIScene` 오버레이/패널 좌표를 상수 기반으로 유지하도록 정리 완료
- Phaser 렌더 설정을 일반 이미지/UI 선명도 기준(`pixelArt` 비활성화, DPR 해상도 반영, antialias 활성화)으로 조정 완료
- 드래그 중 같은 격자 내부에서도 `pointerWorld` 프리뷰를 계속 갱신하도록 수정해 유닛 이미지가 픽셀 단위로 포인터를 추종하도록 보정 완료
- 적/장애물 `block` 판정 중에는 드래그 프리뷰를 현재 유닛 위치에 고정하도록 수정해 적 유닛 타일 위로 통과해 보이지 않도록 보정 완료
- 전투 보드 `tileSize`를 `128`로 상향 조정 완료
- `BoardView.worldToGrid()`에 타일 코너 dead zone을 추가해 모서리 입력 판정을 완화하고 드래그 유격을 확보 완료
- 협공(`sandwich`) 전투 시 좌우 풀바디 이미지 fade in/out 오버레이 후 기존 hit 효과가 이어지도록 전투 연출 확장 완료
- 아군 전투 연출은 플레이어 드래그 직후 발생한 전투 이벤트에만 연결되도록 분리해 같은 턴의 후속 sandwich 재검사로 중복 재생되지 않게 보정 완료
- 현재 기준 테스트 36개 통과
- 프로덕션 빌드 기준 최소 실행 검증 완료

## 3. In Progress
- 밀림 예외 케이스 보강 필요
- 다중 스테이지 진행 흐름의 UX 정리 진행 중

## 4. Not Started
- 스킬 시스템
- 스테이지 목표 처리
- 컷신/대화 이벤트 실행기
- 콘텐츠 제작
- 대화 step 전용 UI 표현 고도화

## 4.1 Deferred Until Approval
- 상태 확장 규칙(`stunned`, `hasActed` 이후 상태) 정리 및 구현
- 적 AI 규칙의 데이터 외부화(`ai_profile`, 타깃 선택 규칙, 단독 공격 옵션) 정리 및 구현
- 스테이지 목표 달성/실패 처리의 데이터화 및 규칙 연결

## 5. Fixed Decisions
- Grid는 게임 규칙의 source of truth로 유지한다
- Phaser는 표현 레이어로만 사용한다
- 규칙 엔진은 Phaser 없이 동작해야 한다
- 이동은 현재 기준 직교 이동만 허용한다
- 충돌 시 연쇄 밀림은 전부 가능할 때만 성공한다
- 밀림 실패 시 전체 이동은 취소한다
- 전투 판정은 이동과 밀림이 끝난 뒤 수행한다
- 협공은 현재 기준 수평/수직 샌드위치 판정을 사용한다
- 드래그 중 아군 타일 진입은 즉시 `swap` 한다
- 드래그 중 적 타일과 장애물 타일 진입은 즉시 `block` 한다
- 드래그 종료 또는 5초 종료 시 현재 보드 상태 기준으로 전투를 판정한다
- 드래그 중 보드 밖 이탈 시 마지막 유효 위치를 유지한다
- 손을 떼면 현재 보드 상태를 그대로 확정한다
- 별도 취소 입력은 두지 않는다
- `block` 시 추가 복귀 없이 현재 위치에서 그냥 멈춘다
- 드래그 중 `swap` 후 다시 이동하여 재차 `swap` 하는 것은 허용한다
- 밀림은 아군에게만 적용 가능하다
- 적은 밀림 대상이 아니라 항상 block 취급한다
- 밀림 가능 여부에 추가 조건은 두지 않는다
- 환경 요소로 장애물 타일이 존재하며, 장애물은 이동/드래그 모두 block 처리한다
- 협공 데미지는 양쪽 아군 공격력의 합산형을 사용한다
- 상태 규칙은 현재 `stunned`, `hasActed` 중심으로 설계하고, 다른 상태도 확장 가능하게 유지한다
- 지형은 현재 `floor`, `wall`, `hazard`까지를 기준으로 설계하고, 추가 지형 확장이 가능하게 유지한다
- 자유 드래그 시각 표현은 현재 수준을 유지한다
- `hazard`는 유닛이 해당 타일에 위치할 때 고정 데미지를 적용한다
- `hazard` 고정 데미지 값은 `src/data/config.json`의 `hazardDamage` key로 관리하며 현재 값은 `10`이다
- `hazard`는 전투 처리 후 후속 효과 단계에서 적용한다
- 적 유닛은 단독 공격이 가능하다
- 적 AI는 50% 확률로 가장 가까운 아군 또는 방어가 가장 낮은 아군을 타깃으로 선택한다

## 6. Open Questions
- swap 연출을 더 늘릴지 현재 수준으로 유지할지 여부

## 7. Next Action
- 대화 step 전용 UI와 진행 입력 방식 정리
- 다중 스테이지 진행 흐름의 UX 정리
- 추가 시나리오/콘텐츠 데이터 확장
