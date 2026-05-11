# TypeScript Conventions

- Không dùng `any` — dùng `unknown` rồi narrow type, hoặc define type rõ ràng
- Luôn khai báo return type cho function exported
- Dùng `type` thay vì `interface` cho object shapes (trừ khi cần extend)
- Import type-only với `import type { Foo }` để tránh runtime import
- Dùng `satisfies` operator thay vì type cast khi có thể
