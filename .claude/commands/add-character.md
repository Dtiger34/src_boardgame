Thêm một nhân vật mới vào game (hiện tại hỗ trợ: werewolf).

## Bước 1 — Thu thập thông tin

Hỏi người dùng lần lượt các câu sau (hỏi từng câu, không hỏi một lúc):

1. **"Game nào?** Nhập game type (vd: `werewolf`) hoặc để trống nếu là werewolf."
2. **"File doc mô tả nhân vật ở đâu?** Nhập đường dẫn tới file `.md` trong `docs/` (vd: `docs/games/character-werewolf.md`), hoặc nhập mô tả trực tiếp."
3. **"Tên nhân vật?** Nhập tên tiếng Việt (vd: `Sói Phù Thủy`) và role ID tiếng Anh snake_case (vd: `wolf_sorcerer`)."
4. **"Ảnh nhân vật?** Nhập tên file ảnh trong `src/web/src/public/image/<game>/` (vd: `werewolfsorcerer.jpg`). Để trống nếu chưa có ảnh.**"

Sau khi có đủ thông tin, **đọc file doc được chỉ định** để lấy mô tả chính xác về nhân vật đó.

## Bước 2 — Xác nhận trước khi code

Trình bày tóm tắt những gì sẽ thay đổi:

```
Nhân vật mới: <Tên tiếng Việt> (<role_id>)
Phe: <villager | werewolf | third_party | neutral>
Mô tả: <tóm tắt kỹ năng từ doc>
Ảnh: src/web/src/public/image/<game>/<filename>

Các file sẽ chỉnh sửa:
  1. src/api/src/engines/<game>.ts
     - Thêm '<role_id>' vào union type Role
     - Thêm entry vào ROLE_TEAMS
     - Implement night action handler (nếu có kỹ năng đêm)
     - Cập nhật buildRoleList (nếu cần mặc định)
  2. docs/games/character-<game>.md  (nếu chưa có nhân vật này)
     - Thêm mục mô tả nhân vật

Có vẻ đúng không? Xác nhận để tiến hành.
```

**Chờ người dùng xác nhận (yes/no) trước khi làm bất kỳ thay đổi nào.**

## Bước 3 — Implement

Chỉ thực hiện sau khi được xác nhận.

### 3a. Engine (`src/api/src/engines/<game>.ts`)

Với **werewolf engine**:

- Thêm `'<role_id>'` vào union type `Role` (dòng `type Role = ...`)
- Thêm `<role_id>: '<team>'` vào `ROLE_TEAMS` — team phải là `'villager'`, `'werewolf'`, hoặc `'third_party'`
- Nếu nhân vật có **kỹ năng đêm**: thêm handler trong `applyNightAction` theo pattern hiện có
- Nếu nhân vật có **kỹ năng khi chết / khi bị vote**: thêm handler trong hàm tương ứng
- Nếu là nhân vật mặc định trong một số config player: cập nhật `buildRoleList`

> Đọc kỹ toàn bộ `werewolf.ts` trước khi sửa để đảm bảo đúng pattern và không duplicate logic.

### 3b. Doc (`docs/games/character-<game>.md`)

Nếu nhân vật chưa có trong file doc, thêm mục theo format hiện có:

```markdown
### <Tên nhân vật>

<Mô tả từ file doc người dùng cung cấp>
```

### 3c. Ảnh

Nếu người dùng cung cấp tên file ảnh:
- Kiểm tra file có tồn tại tại `src/web/src/public/image/<game>/<filename>` không
- Nếu không tồn tại: **thông báo** cho người dùng, không tạo file giả

## Bước 4 — Tổng kết

Liệt kê chính xác những gì đã thay đổi:
- Dòng nào trong engine được thêm/sửa
- File doc có được cập nhật không
- Trạng thái ảnh (có sẵn / chưa có)
- Nếu có bất kỳ TODO nào chưa implement (vd: frontend hiển thị ảnh), ghi rõ để người dùng biết
