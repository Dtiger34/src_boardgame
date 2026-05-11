# Rules

## Bắt buộc tuân theo
- Không chạy lệnh destructive mà không hỏi: `git push --force`, `git reset --hard`, `rm -rf`, `DROP TABLE`
- Không commit file chứa secret (`.env`, private key, token)
- Không tự push lên remote trừ khi được yêu cầu rõ ràng
- Luôn chạy `pnpm typecheck` sau khi sửa TypeScript để verify không có lỗi mới

## Khi thêm tính năng mới
- Định nghĩa type trong `packages/types` trước, sau đó mới implement
- Game engine mới phải implement `GameEngine` interface và đăng ký qua `EngineRegistry`
- Route mới phải có Zod schema validate input

## Khi sửa bug
- Không refactor code xung quanh trừ khi liên quan trực tiếp đến bug
- Không thêm error handling cho case không thể xảy ra
