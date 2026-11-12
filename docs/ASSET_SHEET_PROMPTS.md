# 3D 모델링 에셋 레퍼런스 시트 — 제작 프롬프트 팩

`assets/reference/`에 넣을 디자인 시트 6장을 **이미지 생성 도구에서 직접 제작**하기 위한 프롬프트입니다.
이 저장소에는 시트 이미지가 아직 없습니다. 아래 절차로 만든 PNG를 지정된 파일명으로 저장하세요.

| 파일명 | 내용 |
|---|---|
| `01_Main_Building.png` | 중앙 왼쪽 후방의 메인 건축물, 4시점 |
| `02_Pink_Cottage.png` | 오른쪽 전경의 분홍 둥근 지붕 코티지, 4시점 |
| `03_Christmas_Nature.png` | 메인 트리와 자연물 |
| `04_Bridges_Structures.png` | 다리·난간·계단·산책로 |
| `05_Village_Props.png` | 반복 사용 소품 |
| `06_Floating_Islands.png` | 공중섬 지형 |

## 제작 절차

1. **참조 이미지를 첨부할 수 있는 이미지 생성 도구**를 사용합니다 (ChatGPT 이미지 생성, Gemini 이미지 생성, Midjourney의 스타일/이미지 참조 등). 텍스트만으로는 원본의 곡선과 색감을 재현할 수 없습니다.
2. **매 생성마다 원본 하늘섬 이미지를 첨부**하고, `공통 블록 + 시트별 블록`을 이어 붙여 입력합니다. 한 번에 한 시트만 요청합니다.
3. **01번을 먼저 확정**합니다. 02–06번은 원본 이미지와 함께 확정된 01번 시트를 추가로 첨부하고, 프롬프트 끝에 `Match the rendering style, palette and line quality of the second attached sheet exactly.`를 덧붙입니다. 여섯 장의 스타일이 섞이지 않게 하는 핵심 단계입니다.
4. 가로 3:2(또는 16:9), 도구가 허용하는 최고 해상도로 생성한 뒤 필요하면 업스케일합니다.
5. 01·02번은 대상 건물이 원본에서 작게 보이므로, **해당 건물만 크게 잘라 낸 크롭을 함께 첨부**하면 디테일 반영이 눈에 띄게 좋아집니다.

### 4시점이 서로 어긋날 때

한 번에 4시점을 그리면 창문 수나 굴뚝 위치가 시점마다 달라지기 쉽습니다. 그럴 때는 3/4 시점 한 장을 먼저 확정하고, 그 이미지를 첨부해 `Same building, exact same design. Now show only the FRONT orthographic elevation.` 식으로 정면·측면·후면을 차례로 만든 뒤 한 장으로 배치합니다.

### 검수 체크리스트

- 정면/측면/후면/3/4에서 창문 수, 탑 개수, 굴뚝·문 위치가 일치하는가
- 지붕이 벽 위에 실제로 얹히는가 (녹아 붙거나 공중에 뜬 부분이 없는가)
- 오브젝트가 잘리거나 겹치지 않는가, 배경이 단색인가
- 색이 원본과 같은가: 파스텔 핑크 벽, 아이보리 눈, 더스티 로즈 지붕, 따뜻한 골드 창 불빛
- 04번: 다리 폭이 아바타 2명이 나란히 지날 수 있는가, 난간이 허리 높이인가
- 06번: 섬 윗면이 건물과 산책로를 올릴 수 있을 만큼 평탄한가

---

## 공통 블록 (모든 시트 앞에 붙임)

```text
Use the attached image as the single source of truth for design and style.
Create a 3D MODELING ASSET REFERENCE SHEET (model turnaround / design sheet), not a moodboard and not a scene illustration.

STYLE: soft stylized 3D render identical to the attachment. Pastel pink and ivory plaster walls, dusty-rose and terracotta scalloped roof tiles, thick rounded pillowy snow caps with soft overhanging edges, warm golden glowing windows, storybook European architecture with gently curved, slightly bulging forms, pale stone trims and footings, dark-red timber brackets and frames, small red and gold ornaments, evergreen garlands. Reproduce the original curves, proportions, colors and fine decoration faithfully; do not simplify or redesign.

FIX AI ARTIFACTS: roofs must sit cleanly on walls, towers must stand on real footprints, doors and windows must be plausibly sized, nothing melted, merged or floating.

LAYOUT: pure white seamless background, no sky, no clouds, no scenery. Soft even studio light with only a faint contact shadow. Every object fully visible, never cropped, never overlapping, generous spacing. Objects drawn large. Front, side and back views are orthographic with no perspective distortion; the 3/4 view uses mild perspective. The same object keeps identical proportions, window count, roof shapes and decoration placement in every view.

TEXT: only tiny neutral labels under each view. No title, no logo, no watermark, no color swatches, no characters, no annotations.

FORMAT: landscape 3:2, highest available resolution, one sheet only.
```

## Sheet 01 — Main Building

```text
SUBJECT: the tall, complex main building standing left of centre toward the back of the central island in the attachment.
Show exactly four views of this one building in a single row: FRONT, SIDE, BACK, 3/4.
Include: the central gabled hall with its large glowing arched mullioned window, the tall slender pink tower with ivory domed cap and thin spire, the secondary turret, steep curved roofs with dusty-rose tiles, dormers, chimneys, the arched entrance with timber frame, weather-vane finial, thick snow on every roof plane, garlands, lanterns and small ornaments.
Roof-to-wall junctions must read clearly in every view, including the back, which should be a logical continuation of the front (plain rear wall, a few small windows, a back chimney).
Exclude neighbouring buildings, ground and props; show only a thin snowy stone base slab.
```

## Sheet 02 — Pink Christmas Cottage

```text
SUBJECT: the pink round-roofed cottage in the right foreground of the attachment.
Show exactly four views of this one cottage in a single row: FRONT, SIDE, BACK, 3/4.
Include: the horseshoe-shaped barrel roof with dark-rose arched trim on the gable face, the small arched window in the gable, the heavy rounded snow blanket over the roof, the lower side wing with red-tiled lean-to roof, eaves, the arched wooden front door, small glowing windows, the porch with striped awning, door wreath, garland and planters.
Keep the cute, soft, chubby silhouette of the original. The side view must show the full depth of the barrel roof; the back view shows a plain rounded gable with one small window.
Exclude ground and neighbouring objects; show only a thin snowy base slab.
```

## Sheet 03 — Christmas Trees & Nature

```text
SUBJECT: the trees and natural elements of the village.
LEFT HALF: the large central Christmas tree from the plaza, shown twice — full FRONT view and 3/4 view — with gold star topper, layered conical branches with snow on the tips, red and gold baubles, warm string lights, ribbon garlands, and the round red base with wrapped gifts. Add one enlarged close-up of a branch section showing ornament detail.
RIGHT HALF, arranged in a tidy grid: three distinct small snow-covered fir trees (short and round, medium, tall and slim), one decorated mini tree in a pot, two snow mounds of different sizes, two winter shrubs with snow and red berries, three small potted plants and planter greens.
All items share one scale reference and one style.
```

## Sheet 04 — Bridges & Architectural Structures

```text
SUBJECT: the structures connecting the floating islands.
Include, each shown as a 3/4 view plus a side elevation:
- Bridge A: the red timber footbridge with posts and hanging lanterns seen on the right of the attachment.
- Bridge B: the stone-and-wood bridge with timber supports seen on the left of the attachment.
Also include, as separate modular pieces: railing type 1 (red posts with rope or chain), railing type 2 (wooden balustrade with snow caps), a short flight of wooden steps with landing, a straight and a curved segment of snow-edged cobblestone walkway, an island-edge fence segment with corner post, and a cutaway detail showing how a bridge deck anchors into the stone rim of an island.
Design for real traversal: deck about 3 m wide so two avatars can pass, railings about 1 m high, step rise about 18 cm, no gaps in the deck. Place one plain grey 1.7 m mannequin silhouette beside Bridge A for scale.
```

## Sheet 05 — Christmas Village Props

```text
SUBJECT: reusable village props, arranged in a clean evenly spaced grid, each shown in 3/4 view; show the street lamps and benches additionally in front view.
Include: two vintage street lamps (one single-lantern, one double-arm with wreath), two benches (one wooden with iron sides, one cushioned with snow on the backrest), a Christmas mailbox in red with gold trim, a wooden signpost with two blank arrow boards, three planters of different sizes, ribbon bows and a garland segment with lights, a set of ornaments (ball, star, bell, candy cane, gift box), and a small fence segment with gate.
All props must look like they belong to the same village as the attachment: same pinks, ivory, dark red, warm gold, same rounded snow caps, same level of detail.
```

## Sheet 06 — Floating Islands & Terrain

```text
SUBJECT: the floating island terrain from the attachment, with all buildings, trees and props removed.
Include:
- The central island as a 3/4 view, a top-down plan view and a side elevation, showing the flat cobbled plaza, the main walkway, raised snowy building plots, the stone-block rim, and the tapering rocky underside.
- A vertical cross-section of the central island showing the snow layer, paving, stone rim, soil and rock core.
- Two different small secondary islands in 3/4 view, each with a flat buildable top and a bridge landing.
- Detail tiles: snow-covered ground surface, cliff face section, the rounded overhanging snow lip at the island edge, and how soft cloud puffs wrap around the base of an island.
The top surfaces must read as real, level, buildable space with clear room for buildings and paths. Clouds appear only in the cloud-contact detail; everything else is on pure white.
```
