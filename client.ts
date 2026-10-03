import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './server';

// Подключаемся к серверу
const client = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: 'http://localhost:3000' })],
});

// Вызываем серверную функцию 
async function main() {
  const result = await client.hello.query();
  console.log(result);
}

main();
