# The Nutcracker's Midnight Dream

고전 동화 『호두까기 인형』을 재해석한 **30초 / 1080×1920 (9:16) / 30fps / 900프레임** 크리스마스 판타지 애니메이션입니다.
React + TypeScript + **Remotion 4**로 만들었습니다. 모든 그림은 코드로 그린 SVG 레이어이고, 음악과 효과음은 스크립트로 직접 합성했습니다.

| 결과물 | 위치 |
|---|---|
| 완성 영상 (MP4, H.264 + AAC) | `out/nutcracker-midnight-dream.mp4` |
| 장면별 대표 프레임 5장 | `out/frames/frame-090.jpg`, `frame-300.jpg`, `frame-450.jpg`, `frame-650.jpg`, `frame-870.jpg` |
| 에셋 목록 | 이 문서의 [에셋 목록](#에셋-목록) |
| 원본 프로젝트 | 이 폴더 전체 |

---

## 실행 방법

```bash
cd nutcracker-midnight-dream
npm install

# (선택) 다시 만들어야 할 때만: 종이 텍스처와 음악/효과음
node scripts/generate-textures.cjs   # public/textures/*.png (Playwright 필요)
npm run audio                        # public/audio/score.wav

npm run studio      # Remotion Studio에서 미리보기 및 타임라인 확인
npm run render      # out/nutcracker-midnight-dream.mp4 렌더링
node scripts/render-stills.mjs out/frames 1 90 300 450 650 870   # 대표 프레임 저장
```

Chrome을 내려받을 수 없는 환경(CI, 클라우드 컨테이너)에서는 설치된 Chromium을 지정합니다.

```bash
export REMOTION_BROWSER=/path/to/chrome-headless-shell   # remotion.config.ts가 이 값을 읽습니다
```

4코어 기준 전체 렌더링은 몇 분 정도 걸립니다.

## 프로젝트 구조

```
src/
  index.ts / Root.tsx         컴포지션 등록 (NutcrackerDream, ModelSheet)
  NutcrackerDream.tsx         메인: 장면 배치, 전환, 종이 질감 합성, 오디오
  timeline.json               ★ 장면 구간과 효과음 큐를 프레임 단위로 정의 (영상·오디오가 함께 사용)
  Sheet.tsx                   캐릭터 모델 시트 (디자인 QA용 컴포지션)
  scenes/                     장면 5개, 각각 독립 컴포넌트 (prop `f` = 장면 내부 프레임)
    Scene01ChristmasEve.tsx      0–6초  자정의 거실, 카메라 돌리 인
    Scene02Awakening.tsx         6–12초 눈동자·고개·관절, 금빛 가루, 손 맞잡기, 바닥의 빛
    Scene03EnchantedToys.tsx     12–18초 트리 성장, 선물 상자, 행진, 팝업 성·극장
    Scene04SugarPlumKingdom.tsx  18–25초 사탕 왕국, 회전하는 발레리나, 설탕 별
    Scene05LastMagic.tsx         25–30초 아침, 깨어남, 윙크, 동화책 마지막 페이지
  components/                 재사용 일러스트 부품
    Clara.tsx                    클라라 (stand / kneel / sit 포즈, 표정·팔·리본 파라미터)
    Nutcracker.tsx               호두까기 인형 (관절 페그, 눈동자, 눈꺼풀, 턱 레버)
    Toys.tsx                     장난감 병정, 팝업 성, 장난감 극장, 안락의자, 책장
    Tree.tsx                     절차적으로 그린 6단 전나무 + 장식·촛불·별
    Room.tsx                     벽지, 마룻바닥·러그, 창문·커튼, 벽난로, 벽난로 시계, 선물 상자
    Kingdom.tsx                  설탕 궁전, 설탕탑, 솜사탕 구름, 발레리나, 사탕 가로등
    Effects.tsx                  눈송이, 설탕 결정 별, 마법 가루, 반짝임, 빛줄기
    Transitions.tsx              금빛 섬광, 극장 커튼, 눈송이 소용돌이
    StoryBook.tsx                마지막 페이지 (테두리, 장식, 타이틀 타이포그래피)
    Defs.tsx                     공통 그라디언트, 필터, 잉크 선 스타일
  animations/                 easing·keyframe 헬퍼, 패럴랙스 카메라, 결정적 난수
  styles/                     palette.ts (색상 시스템), fonts.ts
  assets/                     (외부 일러스트로 교체할 때 이곳에 PNG/SVG를 둡니다)
public/
  audio/score.wav             합성된 원곡 음악과 효과음
  textures/paper.png, wash.png  미리 구워 둔 종이 결과 수채 얼룩
  fonts/                      IM Fell English, Cormorant Garamond (SIL OFL)
scripts/
  generate-audio.mjs          음악 작곡 및 효과음 합성 (timeline.json 큐 사용)
  generate-textures.cjs       종이 텍스처 생성
  render-stills.mjs           지정 프레임을 JPEG로 렌더링
```

## 수정하는 방법

- **타이밍:** `src/timeline.json`의 `cues`를 바꾼 뒤 `npm run audio`를 실행하면 효과음도 같은 프레임으로 옮겨집니다. 예: `"blink": 832`는 마지막 윙크와 "띵" 소리 위치입니다.
- **색상:** `src/styles/palette.ts`. 브리프의 다섯 가지 색(Burgundy #762E42, Antique Gold #C5A46A, Powder Blue #ACC9DD, Warm Ivory #F2E8D4, Forest Green #345447)에서 파생된 톤만 씁니다.
- **캐릭터 연기:** 각 장면에서 `<Clara … />`, `<Nutcracker … />` props를 keyframe으로 조정합니다.
  - Clara: `gazeX/Y`, `blink`, `mouth`, `brow`, `headTilt`, `armL/R`, `elbowL/R`, `sway`(리본), `breathe`, `pose`
  - Nutcracker: `pupilX/Y`, `blink`, `winkOnly`, `headTilt`, `headLift`, `armL/R`, `elbowL/R`, `jaw`, `alive`
  - 모든 장면이 같은 컴포넌트를 쓰므로 얼굴, 의상, 비율, 색은 자동으로 일관되게 유지됩니다.
- **카메라:** 장면마다 있는 `cam = {x, y, zoom}`과 `<Layer depth>`로 조정합니다. depth가 1보다 작으면 원경(느리게), 1보다 크면 전경(빠르게) 레이어입니다.
- **디자인 점검:** Studio에서 `ModelSheet` 컴포지션을 열면 캐릭터 포즈를 한눈에 볼 수 있습니다.

## 타임라인

| 구간 | 프레임 | 주요 동작 | 전환 |
|---|---|---|---|
| 01 Christmas Eve | 0–180 | 창밖 눈, 벽난로 불꽃, 커튼과 리본의 흔들림, 시계 바늘이 자정에 도달(96f), 종소리 6번, 인형을 향한 카메라 돌리 인 | 디졸브 |
| 02 The Awakening | 180–360 | 눈동자 이동(212·238f "딸깍"), 고개 들기(252f 삐걱), 금빛 가루(268f), 관절 단위의 팔 회전(290–330f, 300·308f 딸깍), 손 맞잡기(335f), 바닥에서 번지는 빛 | 금빛 섬광 |
| 03 Enchanted Toys | 360–540 | 트리 성장(362f), 선물 상자 3개 개봉과 북치는 병정(384/400/416f), 박자에 맞춘 행진(420f~, 15프레임 = 1박), 의자→성·책장→극장 팝업(448/472f), 극장 무대로 카메라 진입 | 극장 커튼 |
| 04 Sugar Plum Kingdom | 540–750 | 하프 글리산도, 커튼이 열림, 설탕 궁전, 설탕탑, 발레리나 3명 회전, 설탕 불꽃, 별 결정과 눈송이, 함께 바라보는 클라라와 인형, 위에서 아래로 내려오는 크레인 카메라 | 눈송이 소용돌이 |
| 05 The Last Magic | 750–900 | 아침 햇살, 깨어남(792f), 품 안의 평범한 인형, 윙크(832f), 그림이 책의 삽화 판으로 축소, 타이틀(852f~), "The End" | — |

## 사운드

- `scripts/generate-audio.mjs`가 **새로 작곡한 곡**을 직접 합성합니다. 차이콥스키 발레의 분위기(첼레스타, 피치카토 현, 하프, 장난감 행진, 왈츠)를 참고했지만 원곡의 선율이나 녹음본은 사용하지 않았습니다.
  - A 자장가(E단조, 오르골) → B 깨어남(상승 첼레스타, 하프) → C 장난감 행진(G장조 4/4, 120BPM) → D 사탕 왕국 왈츠(첼레스타, 피치카토, 하프) → E 아침 오르골 리프라이즈, E장조 마지막 화음
- 효과음(시계 종, 째깍 소리, 나무 관절 삐걱, 딸깍, 마법 반짝임, 선물 상자, 행진 발소리, 종이 팝업, 눈바람, 아침 새소리, 윙크 "띵")도 모두 합성음이며, `timeline.json`의 프레임 큐에 맞춰 배치됩니다.
- 대사와 내레이션은 없습니다.
- 직접 제공한 음원으로 바꾸려면 `public/audio/score.wav`를 교체하거나 `NutcrackerDream.tsx`의 `<Audio>` 경로를 변경하면 됩니다.

## 에셋 목록

### 이 프로젝트에서 제작해 사용한 에셋

| 에셋 | 구현 | 파일 |
|---|---|---|
| 클라라 (서 있는 / 무릎 꿇은 / 앉은 포즈) | 손그림 스타일 SVG 패스, 관절 단위 리깅 | `components/Clara.tsx` |
| 호두까기 인형 | SVG, 페그 관절, 눈꺼풀, 턱 레버 | `components/Nutcracker.tsx` |
| 장난감 병정 (총/북) | SVG, 박자에 맞춘 걷기 사이클 | `components/Toys.tsx` |
| 크리스마스트리 | 절차적 가지 생성, 장식·촛불·별 | `components/Tree.tsx` |
| 빅토리아풍 거실 (다마스크 벽지, 웨인스코트, 마루, 러그, 아치 창, 커튼, 벽난로, 시계, 양말, 선물) | SVG | `components/Room.tsx` |
| 팝업 성, 장난감 극장, 안락의자, 책장 | SVG | `components/Toys.tsx` |
| 설탕 궁전, 설탕탑, 솜사탕 구름, 사탕 가로등 | SVG | `components/Kingdom.tsx` |
| 발레리나 (회전) | SVG, 회전 위상에 따른 파트 변형 | `components/Kingdom.tsx` |
| 눈송이, 설탕 결정 별, 마법 가루, 반짝임, 빛줄기 | SVG 파티클 (결정적 난수, 프레임마다 일정) | `components/Effects.tsx` |
| 동화책 마지막 페이지 | SVG + 타이포그래피 | `components/StoryBook.tsx` |
| 종이 결, 수채 얼룩 텍스처 | feTurbulence를 PNG로 미리 렌더링 | `public/textures/` |
| 음악과 효과음 | 직접 작곡 및 합성 | `public/audio/score.wav` |
| 서체 | IM Fell English, Cormorant Garamond (SIL Open Font License) | `public/fonts/` |

### 전문 일러스트로 교체하면 품질이 가장 크게 오를 에셋

이 세션에서는 일관된 스타일의 이미지 생성 도구를 쓸 수 없었기 때문에 모든 요소를 SVG로 그렸습니다. 레이어 구조와 파라미터를 그대로 두고 아래 항목을 손그림(과슈/수채, 투명 PNG 레이어)으로 교체하면 "살아 움직이는 동화책 삽화"에 더 가까워집니다.

1. **배경 플레이트 3장:** 밤의 거실, 아침의 거실(같은 구도), 사탕 왕국 원경. 패럴랙스를 위해 원경·중경·근경으로 나눈 PNG가 필요합니다.
2. **클라라 파츠:** 머리(눈 뜸/감음/놀람), 몸통 3포즈, 팔 상·하박, 리본. 현재 피벗 좌표에 맞춥니다.
3. **호두까기 인형 파츠:** 머리, 몸통, 팔 상·하박, 눈꺼풀, 아래턱.
4. **크리스마스트리:** 성장 장면에서 확대되므로 고해상도 단독 레이어로 준비합니다.
5. **설탕 궁전:** 영상에서 가장 화려한 장면의 중심 요소입니다.
6. **발레리나 회전 시트:** 8방향.
7. **동화책 표지와 펼친 페이지 스캔:** 실제 종이 질감.

교체할 때는 `src/assets/`에 파일을 두고, 해당 컴포넌트의 SVG 그룹을 `<Img src={staticFile(...)}/>`나 SVG `<image>`로 바꾸면 됩니다. 애니메이션 props는 그대로 쓸 수 있습니다.

## 품질 점검 (QC)

- 장면별 프레임과 전환 구간 프레임(172–188, 346–378, 526–566, 726–774)을 추출해 확인했습니다.
- 캐릭터는 모든 장면에서 같은 컴포넌트를 사용하므로 얼굴, 의상, 비율, 색이 고정됩니다.
- 파티클은 시드 기반이라 프레임 사이에 무작위로 깜빡이지 않습니다. 선 흔들림 필터도 정적 노이즈를 써서 선이 "끓어오르지" 않습니다.
- 오디오 큐는 영상과 같은 `timeline.json`에서 계산되므로 싱크가 프레임 단위로 맞습니다.
- 타이틀은 플레이트 아래쪽 여백에 배치했고, 9:16 화면에서 상하 안전 영역 안에 들어옵니다.
