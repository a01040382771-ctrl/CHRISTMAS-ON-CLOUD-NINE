# 🎄 THE CHRISTMAS AFTERPARTY: SKY VILLAGE

구름 위에 떠 있는 동화 같은 크리스마스 마을 — 3D 인터랙티브 웹 월드.
지금은 **시각 디자인과 환경 제작 단계**이며, 이 저장소는 그 첫 단계인
**Phase 1 — World Layout & Design System** 까지 구현되어 있습니다.

| | |
|---|---|
| 스택 | React 19 · TypeScript · Vite 7 · three.js · React Three Fiber 9 · drei |
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
| `npm test` | 월드 레이아웃 검증 테스트 |
| `npm run typecheck` | 타입 검사만 |

### 조작 (디자인 검토용 카메라)

- **회전** 마우스 드래그 / 한 손가락 드래그
- **확대·축소** 휠 / 핀치
- **이동** 우클릭 드래그 / 두 손가락 드래그
- 오른쪽 목록에서 구역을 누르면 해당 구역으로 카메라가 이동합니다. 그 상태에서 돌려 보면 정면·측면·후면을 확인할 수 있습니다.
- **구역 라벨** 이름표 표시 · **아바타 스케일** 1.7 m 기준 인형 표시(문·길·다리 비율 확인용)

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
  camera/                 검토용 카메라와 시점 프리셋
  ui/                     오버레이 UI
tests/layout.test.ts      레이아웃 검증
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
| 2 | Starlight Plaza (광장 바닥·트리·벤치·가로등·장식) | 대기 |
| 3 | Individual Building Design (건물 하나씩) | 대기 |
| 4 | Floating Islands & Environment (섬·구름·눈·다리·나무) | 대기 |
| 5 | Visual Integration & Polish | 대기 |

이번 단계에 포함하지 않은 것: 아바타 이동, 충돌, 멀티플레이, 채팅, AI 포토부스, 미니게임, NPC, 이벤트, 건물 내부.

> 이전 프로토타입(아바타 이동·Colyseus 멀티플레이)은 이 저장소의 git 기록(커밋 `d3a5dcf`)에 남아 있습니다.
