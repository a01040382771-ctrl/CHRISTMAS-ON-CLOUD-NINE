# 🎄 THE CHRISTMAS AFTERPARTY: SKY VILLAGE

구름 위에 떠 있는 동화 같은 크리스마스 마을 — 3D 인터랙티브 웹 월드.
현재 **Phase 1 — World Layout & Design System** 과
**Phase 2 — Avatar Movement, Third-Person Camera & Collision** 까지 구현되어 있습니다.

| | |
|---|---|
| 스택 | React 19 · TypeScript · Vite 7 · three.js · React Three Fiber 9 · drei · Rapier (`@react-three/rapier`) |
| 모델링 | 전부 코드 기반 프로시저럴 (이미지·모델 파일 없음, 외부 네트워크 요청 없음) |
| 단위 | 1 unit = 1 m · +x 동쪽 · +z 남쪽(기본 카메라 방향) · +y 위 |

## 실행

```bash
npm install
```

```bash
npm run dev
```

브라우저에서 <http://localhost:5173> 을 엽니다. 같은 네트워크의 휴대폰에서는 `http://<PC-IP>:5173`.

| 명령 | 내용 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 타입 검사 + 프로덕션 빌드 (`dist/`) |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm test` | 레이아웃 검증 + 실제 Rapier 캐릭터로 월드를 걸어 보는 헤드리스 물리 테스트 |
| `npm run test:e2e` | 브라우저 E2E (개발 서버 실행 중일 때) — 키보드·마우스·충돌·다리·추락 복귀·지면 일치·모바일 터치 |
| `npm run typecheck` | 타입 검사만 |

### 두 가지 모드

**월드 감상 모드** (기본) — 마을 전체를 둘러보는 검토용 카메라
- 회전: 마우스 드래그 / 한 손가락 · 확대·축소: 휠 / 핀치 · 이동: 우클릭 드래그 / 두 손가락
- 오른쪽 목록에서 구역을 누르면 해당 구역으로 카메라가 이동합니다.
- **구역 라벨** 이름표 · **아바타 스케일** 1.7 m 기준 인형

**탐험 모드** — `탐험 시작` 버튼. 아바타가 중앙 광장 시작 지점에서 출발합니다.

| | PC | 모바일 |
|---|---|---|
| 이동 | `W A S D` / 방향키 (카메라 기준) | 왼쪽 아래 조이스틱 |
| 달리기 | `Shift` | 조이스틱을 끝까지 밀기 |
| 시점 회전 | 마우스 드래그 | 화면 드래그 (조이스틱과 동시에 가능) |
| 카메라 거리 | 마우스 휠 | 두 손가락 핀치 |
| 시작 위치로 | `R` / 버튼 | 버튼 |
| 돌아가기 | `월드 감상으로` 버튼 · 구역 목록 클릭 | 같음 |

- URL에 `?debug` 를 붙이면 모든 충돌체가 선으로 표시됩니다(보이는 지형과 충돌 지형 비교용).
- `?touch` 를 붙이면 PC에서도 모바일 조이스틱 UI를 볼 수 있습니다.

## 월드 구성

```
                     [NW 예비 섬]                  ⑤ Secret Wish Forest
                                                  ╱  (+2 m)
                        ③ Velvet Ballroom       ╱
        ④ Photo        ② Invitation   ╲       ╱
        Garden ═══════  House   ① Starlight Plaza ══ ⑥ Candy Market ═══ ⑦ Moonlit Terrace
        (−1.2 m)                     ║                                    (+3.6 m)
                                Arrival Deck
```

- **마을 섬(중앙)** 82 × 70 m. 지름 25 m의 원형 광장 ① 에서 다섯 갈래 길이 뻗어 나갑니다.
  북쪽 볼룸 ③, 북서쪽 우체국 ②, 동쪽 마켓 거리 ⑥, 남쪽 도착 데크, 서쪽·북동쪽 다리.
- **주변 섬 3개** 포토 가든 ④, 소원 숲 ⑤, 전망대 ⑦. 각각 높이가 다르고 아치형 목조 다리로 연결됩니다.
- **원경 소형 섬 3개** 풍경용이자 향후 확장 섬을 위한 예비 자리입니다.

## 프로젝트 구조

```
src/
  design/                 공통 디자인 시스템 (여기만 고치면 전체가 바뀜)
    palette.ts              색상 팔레트
    scale.ts                공통 비율 (아바타 1.7 m, 문 1.4 × 2.4 m, 길 최소 3 m, 최대 경사 13° …)
    lighting.ts             조명 값 (태양·보조광·반구광·안개·그림자)
    materials.ts            공유 재질 라이브러리
    textures.ts             프로시저럴 캔버스 텍스처
  world/
    layout.ts               ★ 월드 배치의 단일 소스 (섬·다리·광장·길·부지·구역) — 순수 데이터/수학
    World.tsx               레이아웃을 읽어 전체를 조립
    terrain/                공중섬(눈·석축·암석 하부), 포장(광장·길), 지면 높이 함수
    bridges/                다리, 도착 데크
    buildings/
      kit/parts.tsx           공통 건축 부품 (벽체·탑·원뿔 지붕·박공 지붕·돔·창·문·굴뚝)
      BuildingSite.tsx        부지(기초 슬래브) + 배치
      registry.tsx            구역 → 컴포넌트 매핑
      StarlightPlaza.tsx …    구역별 컴포넌트 (현재는 임시 매스 모델)
    environment/            하늘, 구름, 조명, 나무 배치 규칙
    props/                  울타리, 가로등, 소나무, 구역 라벨, 스케일 인형
    common/                 인스턴싱·글로우·노이즈·GLB 로더 래퍼
    collision/
      shapes.ts               엔진 독립 충돌 형상 타입·그룹 (서버와 공유 가능한 순수 데이터)
      buildCollision.ts       레이아웃 → 충돌 월드 (눈·포장·다리 상판은 화면과 같은 삼각형 사용)
      blockers.ts             건물별 충돌 볼륨 (건물 파일과 짝)
  physics/                Rapier 런타임 (React 비의존: 테스트·향후 서버에서 재사용)
    CharacterMotor.ts         캡슐 캐릭터 + 계단 보조 + 지면 스냅
    staticColliders.ts        충돌 형상 → Rapier 콜라이더
    PhysicsLayer.tsx          <Physics> + 정적 콜라이더 등록
  player/                 아바타와 조작 (역할별 분리)
    state.ts                  캐릭터 상태 + 네트워크용 PlayerSnapshot
    movement.ts               이동 규칙 (카메라 기준 방향·가감속·회전·애니 상태, 고정 60 Hz)
    input.ts                  키보드·조이스틱·시점 입력 상태
    localPlayer.ts            이 브라우저의 플레이어
    PlayerController.tsx      입력 → 이동 → 물리 → 상태 → 아바타 배치
    avatar/                   외형(appearance)·모델(ProceduralAvatar)·애니메이션(animation)
  camera/                 월드 감상 카메라(ReviewCamera) · 3인칭 카메라(ThirdPersonCamera) · 시점 프리셋
  ui/                     오버레이 UI · 조이스틱
tests/layout.test.ts      레이아웃 검증
tests/physics.test.ts     실제 Rapier 캐릭터로 경로·다리·벽·절벽·계단을 걸어 보는 테스트
tests/e2e/explore.cjs     브라우저 E2E
public/models/            (비어 있음) 향후 GLB 모델 위치
```

### 건물을 하나씩 만드는 방법 (Phase 3)

각 구역은 `world/buildings/<Zone>.tsx` 한 파일입니다. 부지 위치·크기·방향과 문 앞 길은
`layout.ts` 가 정하므로, **파일 안의 내용만 교체하면 다른 건물에 영향 없이** 그 건물만 바뀝니다.
건물은 부지 로컬 좌표(기초 윗면 y = 0, +z 가 정면)로 모델링합니다.
외부 모델을 쓰려면 `common/GlbAsset.tsx` 로 감싸 같은 자리에 넣으면 됩니다.

### 새 공중섬을 추가하는 방법

`layout.ts` 에 ① `placeSatellite(...)` 로 섬 정의, ② `bridgeDefs` 에 다리, ③ `plazas`/`paths`/`lots` 를
추가하면 지형·다리·울타리 개구부·가로등·나무 배치가 자동으로 따라옵니다. `npm test` 로 연결 상태를 확인합니다.

## 이동·충돌 시스템 (Phase 2)

- **충돌은 화면과 같은 데이터로 만듭니다.** 눈 지형·포장·다리 상판은 렌더링되는 삼각형을 그대로 Rapier 트라이메시로 쓰고,
  울타리·난간·건물·나무·가로등은 같은 레이아웃 함수에서 계산합니다. 그래서 보이는 바닥과 밟는 바닥이 어긋나지 않습니다(E2E에서 수치로 확인).
- **캐릭터**: 높이 1.7 m 캡슐 + Rapier `KinematicCharacterController` (벽 미끄러짐, 40° 이하 경사, 지면 스냅).
  0.38 m 이하 턱은 자체 계단 보조 로직으로 오릅니다(Rapier 자동 계단은 천천히 걸을 때 실패해서 보완).
- **안전 경계**: 섬마다 울타리를 따라 보이지 않는 벽, 다리·도착 데크 난간을 따라 벽이 있고 울타리 끝과 난간이 이어져 있습니다.
  그래도 떨어지면(y < −25) 시작 위치로 돌아옵니다.
- **고정 시간 간격**: 이동은 항상 1/60초 단위로 계산되어 프레임 속도와 무관합니다. 그리는 위치만 부드럽게 보간합니다.
- **3인칭 카메라**: 드래그 회전·휠 거리(2.5–16 m)·상하 각도 제한, 걷는 동안 천천히 아바타 뒤로 복귀, 건물·지형이 가리면 앞으로 당겨지고 지면 아래로 내려가지 않습니다.
- **건물을 다시 디자인할 때**는 `world/collision/blockers.ts` 의 해당 건물 볼륨도 맞춰 주세요. `npm test` 가 문 앞 도달·벽 차단을 검사합니다.

### Phase 3(멀티플레이) 준비

- `PlayerSnapshot` (x, y, z, yaw, speed, anim) — 동기화할 최소 상태. 원격 아바타는 이 값을 보간해 `<Avatar pose>` 에 넘기면 됩니다.
- `Avatar` 는 위치·입력을 모르는 순수 외형 컴포넌트이고, `AvatarAppearance` 를 다른 방문자에게 그대로 보낼 수 있습니다.
- `buildCollision()` · `CharacterMotor` · `movement.ts` 는 React·브라우저에 의존하지 않아 Node(Colyseus 서버)에서 같은 충돌·이동 규칙으로 검증할 수 있습니다.

## 디자인 시스템

- **색상** Soft Pink(지붕·포인트) · Warm Ivory(외벽·눈) · Pastel Blue(하늘) · Sage Green(지붕·나무) ·
  Burgundy(문·난간·장식) · Champagne Gold(조명·오너먼트) + 같은 톤의 석재/암석/목재 중성색
- **조명** 낮은 겨울 오후 햇살(따뜻한 아이보리) + 반대편 분홍빛 보조광 + 하늘색/살구색 반구광,
  부드러운 그림자, 창문·가로등·트리 전구의 은은한 발광과 가산 글로우, 원경 안개
- **재질** 무광의 핸드페인티드 톤(거칠기 높음, 금속은 골드 포인트만), 돌 하나하나 색이 다른 자갈 포장
- **형태** 모든 매스는 모서리를 둥글게, 지붕은 곡선 프로파일(회전체·스윕)로 제작

## 단계별 계획

| 단계 | 내용 | 상태 |
|---|---|---|
| 1 | World Layout & Design System | ✅ 완료 |
| 2 | Avatar Movement · Third-Person Camera · Collision | ✅ 완료 |
| — | Starlight Plaza 세부 (광장 바닥·트리·벤치·가로등·장식) | 대기 |
| 3 | Individual Building Design (건물 하나씩) | 대기 |
| 4 | Floating Islands & Environment (섬·구름·눈·다리·나무) | 대기 |
| 5 | Visual Integration & Polish | 대기 |

아직 포함하지 않은 것: 멀티플레이(다음 단계, Colyseus), 채팅, AI 포토부스, 미니게임, NPC, 이벤트, 건물 내부.

> 이전 프로토타입(아바타 이동·Colyseus 멀티플레이)은 이 저장소의 git 기록(커밋 `d3a5dcf`)에 남아 있습니다.
