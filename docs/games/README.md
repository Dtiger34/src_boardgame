# Game Documentation

Mỗi file trong thư mục này mô tả một game type: luật chơi, cấu trúc state/move, và cách implement engine.

## Danh sách game

| Game | File | Game Type ID | Trạng thái |
|---|---|---|---|
| Gomoku (Cờ Carô) | [gomoku.md](./gomoku.md) | `gomoku` | ✅ Implemented |
| Ma Sói (Werewolf) | [werewolf.md](./werewolf.md) | `werewolf` | 📝 Docs only |

## Thêm game mới

1. Tạo file `docs/games/<game-type>.md` theo template dưới đây.
2. Chạy `/new-engine` để scaffold engine từ file docs.
3. Implement các method trong engine file.
4. Thêm import vào `src/api/src/index.ts`.

## Template file docs game

```md
# <Tên Game>

## Mô tả
<Mô tả ngắn về game>

## Thông tin cơ bản
| Thuộc tính | Giá trị |
|---|---|
| Số người chơi | N |
| Game type ID | `<id>` |

## Luật chơi
...

## Cấu trúc Move
\`\`\`ts
{ ... }
\`\`\`

## Cấu trúc Board State
\`\`\`ts
interface State { ... }
\`\`\`
```
