import { useState } from 'react';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../server';

const trpc = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: 'http://localhost:3000' })],
});

function App() {
  const [status, setStatus] = useState('');

  const handleClick = async () => {
    try {
      const res = await trpc.logClick.mutate();
      setStatus(res.message);
    } catch {
      setStatus('Ошибка: бэк недоступен');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <button onClick={handleClick}>Отправить лог на бэк</button>
      <p>{status}</p>
    </div>
  );
}

export default App;
