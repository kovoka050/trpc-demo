const API = 'http://localhost:4000';

async function request(title, path, options = {}) {
  const res = await fetch(API + path, options);
  const data = await res.json();
  console.log(`${title}\n  статус: ${res.status}\n  ответ:`, data, '\n');
  return data;
}

const json = (body) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
const bearer = (token) => ({ headers: { Authorization: `Bearer ${token}` } });


await request('1) /profile без токена:', '/profile');

await request('2) Вход с неверным паролем:', '/login', json({ username: 'ivan', password: 'wrong' }));

const { token } = await request('3) Вход ivan / 1234:', '/login', json({ username: 'ivan', password: '1234' }));

//  Запрос с токеном
await request('4) /profile с токеном:', '/profile', bearer(token));


await request('5) /admin с токеном обычного пользователя:', '/admin', bearer(token));


const admin = await request('6) Вход admin / admin:', '/login', json({ username: 'admin', password: 'admin' }));
await request('7) /admin с токеном администратора:', '/admin', bearer(admin.token));

const [h, , s] = token.split('.');
const fakePayload = Buffer.from(JSON.stringify({ sub: '1', name: 'ivan', role: 'admin', exp: 9999999999 })).toString('base64url');
await request('8) /admin с подделанным токеном:', '/admin', bearer(`${h}.${fakePayload}.${s}`));
