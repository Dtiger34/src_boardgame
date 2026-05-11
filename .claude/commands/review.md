Review code thay đổi hiện tại theo conventions của project boardgame này.

Chạy `git diff HEAD` để lấy danh sách thay đổi, sau đó kiểm tra từng điểm:

**TypeScript**
- [ ] Có dùng `any` không? Nếu có, đề xuất type cụ thể
- [ ] Function exported có khai báo return type không?
- [ ] Import type-only dùng `import type` chưa?

**API layer (nếu có thay đổi trong `src/api/src/routes/`)**
- [ ] Route handler có chứa business logic hay query DB không? (phải chuyển vào service)
- [ ] Input có được validate bằng Zod `.parse()` không?
- [ ] Error có dùng `AppError` không?

**Game engine (nếu có thay đổi trong `src/api/src/engines/`)**
- [ ] Implement đủ 3 method: `getInitialState`, `validateAndApply`, `checkResult`?
- [ ] Đã `EngineRegistry.register(...)` ở cuối file chưa?
- [ ] Đã import trong `index.ts` chưa?

**Frontend (nếu có thay đổi trong `src/web/`)**
- [ ] Global state đi qua Zustand store, không dùng useState/context?
- [ ] API call qua `api` từ `lib/api.ts`, không dùng fetch trực tiếp?

Tổng kết: liệt kê các vấn đề cần sửa (nếu có) và những điểm đã đúng convention.
