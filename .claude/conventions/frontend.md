# Frontend Conventions

## State management
- State toàn cục dùng Zustand store trong `src/web/src/store/` — không dùng React context cho global state
- Store chỉ chứa state và actions — không gọi API trong store (trừ `socket.ts` vì liên quan lifecycle)

## API calls
- Gọi API qua axios instance `api` từ `lib/api.ts` — không dùng `fetch` trực tiếp
- `api` tự đính Bearer token qua interceptor — không thêm header thủ công

## Socket
- Socket events được wire vào store trong `store/socket.ts`, không xử lý trong component
- Connect socket sau khi login thành công (có token), disconnect khi logout

## Component
- Page components trong `pages/`, UI components trong `components/`
- Dùng `@/` alias thay vì relative path khi import từ `src/`
