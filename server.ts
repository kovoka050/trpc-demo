import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import cors from 'cors';

const t = initTRPC.create();

export const appRouter = t.router({
  hello: t.procedure.query(() => {
    return 'Привет от сервера!';
  }),

  logClick: t.procedure.mutation(() => {
    console.log(`[${new Date().toISOString()}] Кнопка нажата на клиенте`);
    return { ok: true, message: 'Лог записан на бэке' };
  }),
});

export type AppRouter = typeof appRouter;

createHTTPServer({
  router: appRouter,
  middleware: cors(),
}).listen(3000);

console.log('Сервер запущен на http://localhost:3000');
