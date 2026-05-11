# Gomoku (Cờ Carô)

## Mô tả

Gomoku (hay còn gọi là Cờ Carô) là trò chơi board game chiến thuật cho 2 người chơi trên bàn cờ 15×15 ô vuông. Mục tiêu là đặt 5 quân cờ liên tiếp theo hàng ngang, dọc hoặc chéo trước đối thủ.

## Thông tin cơ bản

| Thuộc tính | Giá trị |
|---|---|
| Số người chơi | 2 |
| Kích thước bàn cờ | 15×15 |
| Loại quân cờ | Đen (player 1) và Trắng (player 2) |
| Điều kiện thắng | 5 quân liên tiếp |
| Game type ID | `gomoku` |

## Luật chơi

### Thiết lập

- Bàn cờ 15×15, ban đầu tất cả các ô đều trống.
- Player 1 chơi quân Đen, Player 2 chơi quân Trắng.
- Player 1 (Đen) đi trước.

### Lượt chơi

1. Hai người chơi lần lượt đặt quân cờ của mình vào một ô trống trên bàn.
2. Mỗi lượt chỉ được đặt đúng 1 quân.
3. Quân đã đặt xuống không được di chuyển.

### Điều kiện thắng

Người chơi nào đặt được **5 quân cờ liên tiếp** (không ngắt quãng) theo một trong các hướng sau sẽ thắng:

- Ngang (→)
- Dọc (↓)
- Chéo phải (↘)
- Chéo trái (↙)

### Điều kiện hòa

Nếu toàn bộ 225 ô trên bàn đã được đặt quân mà không ai tạo được 5 quân liên tiếp, kết quả là **hòa**.

## Cấu trúc Move

```ts
{ row: number; col: number }  // 0-indexed, row và col trong [0, 14]
```

## Cấu trúc Board State

```ts
interface State {
  board: Cell[][];   // Cell: 0 = trống, 1 = Player 1 (Đen), 2 = Player 2 (Trắng)
  moveCount: number; // số nước đã đi; chẵn = lượt Player 1, lẻ = lượt Player 2
}
```

## Engine file

`src/api/src/engines/gomoku.ts`
