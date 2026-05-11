# Ma Sói (Werewolf / Mafia)

## Mô tả

Ma Sói là trò chơi suy luận xã hội cho nhiều người chơi (6–18 người). Người chơi được chia thành hai phe: **Dân làng** (không biết ai là Ma Sói) và **Ma Sói** (biết nhau và hành động bí mật). Trò chơi diễn ra theo các vòng **Đêm → Ngày** xen kẽ cho đến khi một phe thắng.

## Thông tin cơ bản

| Thuộc tính | Giá trị |
|---|---|
| Số người chơi | 6–18 |
| Loại | Suy luận xã hội, thời gian thực |
| Phe thắng (Dân) | Tiêu diệt toàn bộ Ma Sói |
| Phe thắng (Ma Sói) | Bằng hoặc vượt số Dân làng còn sống |
| Game type ID | `werewolf` |

---

## Vai trò

### Phe Dân làng

| Vai | Số lượng | Kỹ năng đêm |
|---|---|---|
| **Dân làng** | Biến động | Không có |
| **Thầy bói** | 1 | Xem danh tính 1 người |
| **Bác sĩ** | 1 | Bảo vệ 1 người khỏi bị giết đêm đó |
| **Cảnh sát** | 1 | Điều tra xem 1 người có phải Ma Sói không |
| **Thợ săn** | 1 | Khi chết, được bắn chết 1 người bất kỳ |

### Phe Ma Sói

| Vai | Số lượng | Kỹ năng đêm |
|---|---|---|
| **Ma Sói** | Biến động (≥ 1) | Chọn 1 người để giết |
| **Trùm Ma Sói** | 0–1 | Không bị Thầy bói phát hiện là Ma Sói |

### Phe Trung lập (tuỳ chọn mở rộng)

| Vai | Điều kiện thắng |
|---|---|
| **Kẻ ám ảnh** | Bị bỏ phiếu xử tử bởi Dân làng |

---

## Luật chơi

### Thiết lập

1. Host (chủ phòng) chọn số người và cấu hình vai trò trước khi bắt đầu.
2. Server phân vai ngẫu nhiên và gửi vai trò riêng tư cho từng người chơi.
3. Ma Sói biết danh tính của nhau ngay từ đầu.

### Cấu trúc vòng chơi

```
[ Đêm ] → [ Ngày: Thảo luận ] → [ Ngày: Bỏ phiếu ] → lặp lại
```

#### Đêm

Tất cả người chơi "nhắm mắt" (giao diện ẩn thông tin). Các vai lần lượt hành động theo thứ tự:

1. **Ma Sói** — chọn 1 mục tiêu để giết (phải đồng thuận nội bộ nếu nhiều Ma Sói).
2. **Bác sĩ** — chọn 1 người để bảo vệ (có thể chọn chính mình).
3. **Thầy bói** — chọn 1 người để xem danh tính.
4. **Cảnh sát** — chọn 1 người để điều tra (nhận kết quả: Ma Sói / Không phải).

Kết quả đêm: nếu mục tiêu của Ma Sói không được Bác sĩ bảo vệ → người đó chết.

#### Ngày — Thảo luận

- Server công bố ai đã chết đêm qua (không tiết lộ vai của người chết ngay, tuỳ cấu hình).
- Tất cả người còn sống thảo luận qua chat trong thời gian giới hạn (mặc định 2 phút).
- Người chết có thể xem nhưng không được nói.

#### Ngày — Bỏ phiếu

- Mỗi người chơi còn sống bỏ phiếu chọn 1 người để xử tử (hoặc bỏ qua).
- Người bị nhiều phiếu nhất bị xử tử. Bằng phiếu → không ai chết (hoặc bỏ phiếu phụ, tuỳ cấu hình).
- Sau khi xử tử → kiểm tra điều kiện thắng, nếu chưa xong → chuyển sang Đêm tiếp theo.

### Điều kiện thắng

| Phe | Điều kiện |
|---|---|
| **Dân làng** | Tất cả Ma Sói đã chết |
| **Ma Sói** | Số Ma Sói ≥ số Dân làng còn sống |
| **Kẻ ám ảnh** | Bị xử tử bởi bỏ phiếu ban ngày |

---

## Cấu hình phòng đề xuất

| Số người | Ma Sói | Trùm | Thầy bói | Bác sĩ | Cảnh sát | Dân làng |
|---|---|---|---|---|---|---|
| 6 | 1 | 0 | 1 | 0 | 0 | 4 |
| 8 | 2 | 0 | 1 | 1 | 0 | 4 |
| 10 | 2 | 1 | 1 | 1 | 1 | 4 |
| 12 | 3 | 1 | 1 | 1 | 1 | 5 |
| 15 | 4 | 1 | 1 | 1 | 1 | 7 |

---

## Cấu trúc dữ liệu (thiết kế sơ bộ)

### Player state (private, chỉ server biết)

```ts
interface WerewolfPlayer {
  userId: string;
  role: 'villager' | 'werewolf' | 'alpha_werewolf' | 'seer' | 'doctor' | 'sheriff' | 'jester';
  team: 'village' | 'werewolf' | 'neutral';
  isAlive: boolean;
}
```

### Board state (public — không tiết lộ role)

```ts
interface WerewolfState {
  phase: 'night' | 'day_discussion' | 'day_vote';
  round: number;
  phaseEndsAt: number;          // unix ms — đếm ngược thời gian
  alivePlayers: string[];       // userId[]
  deadPlayers: { userId: string; revealedRole?: string }[];
  nightActions: {               // chỉ server xử lý, client không thấy
    kill?: string;
    protect?: string;
    investigate?: string;
  };
  votes: Record<string, string | null>;  // voterId → targetId | null
  lastKilled?: string;          // userId bị giết đêm vừa rồi
  lastExecuted?: string;        // userId bị xử tử ban ngày
}
```

### Move / Action

```ts
// Đêm — Ma Sói giết
{ action: 'kill'; targetId: string }

// Đêm — Bác sĩ bảo vệ
{ action: 'protect'; targetId: string }

// Đêm — Thầy bói xem
{ action: 'investigate'; targetId: string }

// Ngày — Bỏ phiếu
{ action: 'vote'; targetId: string | null }
```

---

## Ghi chú thiết kế

- **Real-time phase timer**: server emit `game:phase_tick` mỗi giây (hoặc client tự đếm từ `phaseEndsAt`).
- **Private channel**: Ma Sói cần kênh chat riêng ban đêm → dùng Socket.IO room `wolf:${roomId}`.
- **Role reveal**: khi chết, tuỳ host bật/tắt hiển thị vai của người chết.
- **Anti-cheat**: tất cả action đêm phải validate server-side; client không được nhận `nightActions` raw.

## Engine file (chưa tạo)

`src/api/src/engines/werewolf.ts`
