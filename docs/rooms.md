# Quy tắc phòng (Room)

## Tổng quan

Phòng do người chơi tự tạo. Có 2 cách để vào:

1. **Nhập code phòng** — dùng `inviteCode` do chủ phòng chia sẻ.
2. **Danh sách phòng công khai** — xem danh sách phòng đang chờ và chọn vào.

---

## Trạng thái phòng

```
waiting ──── player 2 vào ───► in_progress
   │                                │
   └── không còn ai → tự xóa        └── không còn ai → tự xóa
```

| Trạng thái | Ý nghĩa |
|---|---|
| `waiting` | Đang chờ người chơi thứ 2 |
| `in_progress` | Đang trong ván game |

---

## Tạo phòng

`POST /api/games/rooms`

```json
{
  "gameType": "gomoku",
  "isPrivate": false,
  "timeControlMs": 300000
}
```

- Mọi phòng đều có `inviteCode` (8 ký tự viết hoa, ví dụ `A3F9C2B1`).
- `isPrivate: false` → phòng hiện trong danh sách công khai.
- `isPrivate: true` → phòng ẩn, chỉ vào được bằng code.

---

## Cách 1 — Nhập code phòng

`POST /api/games/rooms/join-by-code`

```json
{ "inviteCode": "A3F9C2B1" }
```

- Code không phân biệt hoa/thường.
- Lỗi `INVALID_CODE 404` nếu code không tồn tại.
- Lỗi `ROOM_FULL 400` nếu đã đủ người.
- Lỗi `ROOM_NOT_OPEN 400` nếu game đã bắt đầu.

---

## Cách 2 — Danh sách phòng công khai

`GET /api/games/rooms` — trả về các phòng public đang `waiting`.

Sau khi chọn phòng, vào bằng:

```
POST /api/games/rooms/join-by-code   { inviteCode }
POST /api/games/rooms/:roomId/join
```

---

## Tự xóa phòng khi trống

Khi người chơi rời phòng (socket `game:leave` hoặc ngắt kết nối), hệ thống kiểm tra:

- Còn người trong phòng → cập nhật danh sách players, emit `game:player_disconnected`.
- Không còn ai → xóa toàn bộ: `room:*`, `inviteCode:*`, xóa khỏi `rooms:public`.

Phòng cũng tự hết hạn sau **24 giờ** nếu không có ai vào (Redis TTL).
