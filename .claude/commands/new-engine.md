Scaffold một game engine mới cho project boardgame này.

## Bước 1 — Chọn nguồn thông tin game

Hỏi người dùng: **"Bạn muốn tạo engine cho game nào? Nhập tên game type hoặc chỉ định file docs (trong `docs/games/`)."**

- Nếu có file docs tương ứng: đọc file đó để lấy luật chơi, cấu trúc Move, cấu trúc Board State, game type ID — dùng thông tin này để implement engine thay vì để TODO trống.
- Nếu không có file docs: hỏi thêm thông tin cơ bản rồi tạo file docs trước, sau đó mới scaffold engine.

## Bước 2 — Tạo engine file

Tạo `src/api/src/engines/<game-type>.ts` implement đúng `GameEngine` interface, đăng ký qua `EngineRegistry`.

## Bước 3 — Nhắc người dùng

1. Thêm import vào `src/api/src/index.ts`.
2. Cập nhật bảng danh sách game trong `docs/games/README.md`.
