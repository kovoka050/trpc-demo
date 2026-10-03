import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';

const t = initTRPC.create();


export const appRouter = t.router({
  hello: t.procedure.query(() => {
    return 'Привет от сервера!';
  }),
});

export type AppRouter = typeof appRouter;

createHTTPServer({ router: appRouter }).listen(3000);
console.log('Сервер запущен на http://localhost:3000');
