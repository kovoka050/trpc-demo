import { createHmac, timingSafeEqual } from 'node:crypto';

const SECRET = 'my-secret-key'; 

const b64url = (data) => Buffer.from(data).toString('base64url');
const sign = (input) => createHmac('sha256', SECRET).update(input).digest('base64url');

// 1. Создание токена 
function createToken(payload, expiresInSec) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = { ...payload, iat: now, exp: now + expiresInSec };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(body))}`;
  return `${unsigned}.${sign(unsigned)}`;
}

// 2. Проверка токена
function verifyToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Неверный формат токена');
  const [h, p, signature] = parts;

  const expected = Buffer.from(sign(`${h}.${p}`));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new Error('Подпись не совпадает (токен подделан)');
  }

  const payload = JSON.parse(Buffer.from(p, 'base64url').toString());
  if (payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Срок действия токена истёк');
  }
  return payload;
}

// 3. Демонстрация
const token = createToken({ sub: '1', name: 'Ivan', role: 'user' }, 3600);
console.log('Токен:\n', token, '\n');

console.log('1) Верный токен:');
console.log(verifyToken(token), '\n');

console.log('2) Подделанный токен (злоумышленник поменял роль на admin):');
const [h, , s] = token.split('.');
const fakePayload = b64url(JSON.stringify({ sub: '1', name: 'Ivan', role: 'admin', exp: 9999999999 }));
try { verifyToken(`${h}.${fakePayload}.${s}`); } catch (e) { console.log('Ошибка:', e.message, '\n'); }

console.log('3) Просроченный токен:');
const expired = createToken({ sub: '1' }, -10);
try { verifyToken(expired); } catch (e) { console.log('Ошибка:', e.message); }
