# Backend Conventions

## Route layer
- Route handler chỉ validate input và gọi service — không chứa business logic hay query DB trực tiếp
- Validate request bằng Zod `.parse()` (không dùng `.safeParse()` ở route — để express-async-errors bắt ZodError tự động)

```ts
// ✅ Đúng
const body = CreateGameSchema.parse(req.body);
const game = await GameService.create(body, req.user.id);
res.json(game);

// ❌ Sai — logic trong route
const exists = await db.query('SELECT ...');
if (!exists) throw ...
```

## Service layer
- Service nhận plain data, trả plain data — không biết về `req`/`res`
- Query DB trực tiếp trong service qua `db` từ `src/db.ts`

## Error handling
- Throw `AppError` (từ `middleware/error-handler.ts`), không throw `new Error()` hay string

```ts
// ✅ Đúng
throw new AppError('GAME_NOT_FOUND', 'Game not found', 404);

// ❌ Sai
throw new Error('Game not found');
throw 'Game not found';
```

## Game engines
- Mỗi game type là một file trong `src/api/src/engines/`
- Cuối file gọi `EngineRegistry.register('game-type', engine)` — đây là side-effect import
- Import trong `src/index.ts`: `import './engines/ten-game'`
