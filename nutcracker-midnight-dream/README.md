# The Nutcracker's Midnight Dream

고전 동화 『호두까기 인형』을 재해석한 **30초 / 1080×1920 (9:16) / 30fps / 900프레임** 크리스마스 판타지 애니메이션입니다.
React + TypeScript + **Remotion 4**로 만들었습니다.

그림체는 **빈티지 동화책 과슈 일러스트**입니다. 배경, 소품, **인물까지 모두 AI로 그린 과슈 그림(PNG)**입니다. 인물은 '종이 인형 파츠 시트'로 그린 뒤 관절별로 잘라 리깅했기 때문에, 그림체는 배경과 같고 움직임(고개, 팔, 눈 깜빡임, 윙크, 리본, 행진, 회전)은 그대로 살아 있습니다. 음악과 효과음은 스크립트로 직접 합성했습니다.

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

# (선택) 다시 만들어야 할 때만: 종이 텍스처, 아침 배경, 음악/효과음
node scripts/generate-textures.cjs   # public/textures/*.png (Playwright 필요)
python3 scripts/make-morning-plate.py # public/gouache/parlour-morning.png
npm run audio                        # public/audio/score.wav

npm run studio      # Remotion Studio에서 미리보기 및 타임라인 확인
npm run render      # out/nutcracker-midnight-dream.mp4 렌더링
node scripts/render-stills.mjs out/frames 1 90 300 450 650 870   # 대표 프레임 저장
```

Chrome을 내려받을 수 없는 환경(CI, 클라우드 컨테이너)에서는 설치된 Chromium을 지정합니다.

```bash
export REMOTION_BROWSER=/path/to/chrome-headless-shell   # remotion.config.ts가 이 값을 읽습니다
```

4코어 기준 전체 렌더링은 10분 이상 걸릴 수 있습니다(과슈 이미지와 필터 때문).

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

### 과슈 일러스트 (AI 생성, `public/gouache/`)

Figma의 이미지 생성 기능(gpt-image 모델)으로 같은 스타일 프롬프트를 써서 만들었습니다. 원본은 `src/assets/gouache/`에, 트리밍한 사용본은 `public/gouache/`에 있습니다. 생성 원본은 Figma 파일 "Nutcracker Gouache Assets"에도 남아 있습니다.

| 파일 | 내용 | 사용 장면 |
|---|---|---|
| `parlour-night.png` | 밤의 빅토리아풍 거실 (창, 커튼, 벽난로, 벽난로 시계, 러그) | 1, 2(흐림 배경과 바닥), 3 |
| `parlour-morning.png` | 같은 그림에서 파생: 창을 새벽 하늘로, 불을 잔불로 바꾸고 아침 톤으로 보정 (`scripts/make-morning-plate.py`) | 5 |
| `tree.png` | 크리스마스트리 (투명 배경) | 1, 2, 3(성장), 5 |
| `kingdom.png` | 사탕 왕국: 과자 궁전, 설탕탑, 체크무늬 무도회장 | 4 |
| `castle.png`, `theatre.png` | 팝업 장난감 성, 장난감 극장 (투명 배경) | 3 |
| `armchair.png`, `bookcase.png` | 변신 전의 안락의자와 책장 (투명 배경) | 3 |

그림 위에 얹은 애니메이션 오버레이(`components/Painted.tsx`): 창밖 눈, 벽난로 불꽃과 불티, 자정을 가리키는 시계 바늘, 트리 촛불의 깜빡임과 별빛.

### 과슈 인물 (종이 인형 파츠 시트 → 리그, `public/gouache/cast/`)

인물마다 같은 그림 안에 모든 파츠를 함께 그려(`src/assets/gouache/sheets/*-sheet.png`) 얼굴, 의상, 색이 장면마다 바뀌지 않습니다. `scripts/build-cast.py`가 시트를 파츠로 자르고, `components/PaintedCast.tsx`가 관절(피벗)에 맞춰 조립합니다. 이전 SVG 리그와 props가 같아서 장면 코드의 애니메이션은 바꾸지 않았습니다.

| 인물 | 파츠 | 움직임 |
|---|---|---|
| 클라라 | 머리 3종(뜬 눈 / 잠든 눈 / 놀란 표정), 몸 3종(서기 / 무릎 꿇기 / 앉기), 팔 상·하박 좌우, 분리한 리본 | 고개 기울이기, 눈 깜빡임과 표정 전환, 팔 뻗기와 안기, 리본 흔들림, 호흡 |
| 호두까기 인형 | 몸통, 견장, 머리 3종(정면 / 왼쪽 응시 / 윙크), 팔 상·하박 좌우 | 눈동자 이동, 고개 들기, 페그 관절 단위의 팔 회전, 마지막 윙크 |
| 장난감 병정 | 상반신 2종(총 / 북), 다리 | 박자에 맞춘 다리 교차 행진, 북치기 |
| 발레리나 | 4방향 턴어라운드(정면, 3/4, 뒤, 3/4) | 방향 전환과 몸통 압축으로 표현한 피루엣 |

### 코드로 만든 효과

| 에셋 | 파일 |
|---|---|
| 선물 상자 (뚜껑 열림) | `components/Room.tsx` (SVG + `#gouache` 필터) |
| 눈송이, 설탕 결정 별, 마법 가루, 빛줄기, 전환 효과 | `components/Effects.tsx`, `components/Transitions.tsx` |
| 동화책 마지막 페이지 | `components/StoryBook.tsx` |
| 종이 결, 수채 얼룩 텍스처 | `public/textures/` |
| 음악과 효과음 (직접 작곡 및 합성) | `public/audio/score.wav` |
| 서체: IM Fell English, Cormorant Garamond (SIL OFL) | `public/fonts/` |

이전 버전의 SVG 캐릭터와 배경(`Clara.tsx`, `Nutcracker.tsx`, `Toys.tsx`, `Kingdom.tsx`, `Room.tsx`, `Tree.tsx`)은 모델 시트(`ModelSheet` 컴포지션)와 대체용으로 남겨 두었습니다.

### 알려진 한계

- 인물이 종이 인형 방식이라 관절이 꺾일 때 "종이 인형극"처럼 보입니다. 동화책 콘셉트와는 어울리지만, 셀 애니메이션처럼 몸이 휘지는 않습니다.
- 클라라의 눈동자 방향과 입 모양은 머리 3종을 바꿔 끼우는 방식이라 중간 표정이 없습니다.
- 발레리나 3명은 같은 그림(분홍)입니다. 색이 다른 의상이 필요하면 턴어라운드 시트를 추가로 생성하면 됩니다.

## 품질 점검 (QC)

- 장면별 프레임과 전환 구간 프레임(172–188, 346–378, 526–566, 726–774)을 추출해 확인했습니다.
- 캐릭터는 모든 장면에서 같은 컴포넌트를 사용하므로 얼굴, 의상, 비율, 색이 고정됩니다.
- 파티클은 시드 기반이라 프레임 사이에 무작위로 깜빡이지 않습니다. 선 흔들림 필터도 정적 노이즈를 써서 선이 "끓어오르지" 않습니다.
- 오디오 큐는 영상과 같은 `timeline.json`에서 계산되므로 싱크가 프레임 단위로 맞습니다.
- 타이틀은 플레이트 아래쪽 여백에 배치했고, 9:16 화면에서 상하 안전 영역 안에 들어옵니다.
