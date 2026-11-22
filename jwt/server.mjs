import http from 'node:http';
import { createHmac, timingSafeEqual } from 'node:crypto';

const PORT = 4000;
const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  console.error('Ошибка: не задана переменная окружения JWT_SECRET (см. .env.example)');
  process.exit(1);
}
const TOKEN_TTL_SEC = 60 * 60; 

// База данных пользователей
const USERS = [
  { id: 1, username: 'ivan', password: '1234', role: 'user' },
  { id: 2, username: 'admin', password: 'admin', role: 'admin' },
];

// Работа с JWT 
const b64url = (data) => Buffer.from(data).toString('base64url');
const sign = (input) => createHmac('sha256', SECRET).update(input).digest('base64url');

function createToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { sub: String(user.id), name: user.username, role: user.role, iat: now, exp: now + TOKEN_TTL_SEC };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  return `${unsigned}.${sign(unsigned)}`;
}

function verifyToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Неверный формат токена');
  const [h, p, signature] = parts;

  let header, payload;
  try {
    header = JSON.parse(Buffer.from(h, 'base64url').toString());
    payload = JSON.parse(Buffer.from(p, 'base64url').toString());
  } catch {
    throw new Error('Неверный формат токена');
  }

  if (header.alg !== 'HS256' || header.typ !== 'JWT') {
    throw new Error('Недопустимый алгоритм подписи');
  }

  const expected = Buffer.from(sign(`${h}.${p}`));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new Error('Подпись не совпадает (токен подделан)');
  }


  if (typeof payload.exp !== 'number') throw new Error('В токене нет срока действия (exp)');
  if (payload.exp <= Math.floor(Date.now() / 1000)) throw new Error('Срок действия токена истёк');
  return payload;
}


function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('Неверный JSON')); }
    });
  });
}

function authenticate(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) throw new Error('Токен не передан');
  return verifyToken(header.slice(7));
}

//Сервер 
const server = http.createServer(async (req, res) => {
  console.log(`${req.method} ${req.url}`);


  if (req.method === 'POST' && req.url === '/login') {
    try {
      const { username, password } = await readBody(req);
      const user = USERS.find((u) => u.username === username && u.password === password);
      if (!user) return send(res, 401, { error: 'Неверный логин или пароль' });

      const token = createToken(user);
      console.log(`  -> выдан токен пользователю ${user.username}`);
      return send(res, 200, { token });
    } catch (e) {
      return send(res, 400, { error: e.message });
    }
  }

  if (req.method === 'GET' && req.url === '/profile') {
    try {
      const payload = authenticate(req);
      return send(res, 200, { message: `Привет, ${payload.name}!`, user: payload });
    } catch (e) {
      console.log(`  -> отказ: ${e.message}`);
      return send(res, 401, { error: e.message });
    }
  }

 
  if (req.method === 'GET' && req.url === '/admin') {
    try {
      const payload = authenticate(req);
      if (payload.role !== 'admin') return send(res, 403, { error: 'Недостаточно прав' });
      return send(res, 200, { message: 'Секретные данные администратора' });
    } catch (e) {
      console.log(`  -> отказ: ${e.message}`);
      return send(res, 401, { error: e.message });
    }
  }

  send(res, 404, { error: 'Не найдено' });
});

server.listen(PORT, () => console.log(`JWT-сервер запущен на http://localhost:${PORT}`));
