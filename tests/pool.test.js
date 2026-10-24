import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPool } from '../src/pool.js';

// Faux worker : répond quand le test le décide, ou plante
function fakeWorker() {
  const worker = {
    sent: [],
    postMessage(message) { worker.sent.push(message); },
    reply(result) { const { id } = worker.sent.at(-1); worker.onmessage({ data: { id, result } }); },
    fail(error) { const { id } = worker.sent.at(-1); worker.onmessage({ data: { id, error } }); },
    crash() { worker.onerror(new Event('error')); },
  };
  return worker;
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

test('la file attend un worker libre au lieu d\'échouer (M1)', async () => {
  const worker = fakeWorker();
  const run = createPool([worker], () => Promise.reject(new Error('fallback inattendu')));
  const first = run({ n: 1 });
  const second = run({ n: 2 });
  assert.equal(worker.sent.length, 1); // la seconde demande attend
  worker.reply('un');
  await tick();
  assert.equal(worker.sent.length, 2);
  worker.reply('deux');
  assert.deepEqual(await Promise.all([first, second]), ['un', 'deux']);
});

test('une erreur de compression est transmise sans bloquer le worker', async () => {
  const worker = fakeWorker();
  const run = createPool([worker], () => Promise.reject(new Error('fallback inattendu')));
  const failing = run({ n: 1 });
  const next = run({ n: 2 });
  worker.fail('too-large');
  await assert.rejects(failing, { message: 'too-large' });
  await tick();
  worker.reply('ok');
  assert.equal(await next, 'ok');
});

test('un worker qui plante confie sa tâche et la suite à la page (M2)', async () => {
  const worker = fakeWorker();
  const handled = [];
  const run = createPool([worker], async (payload) => { handled.push(payload.n); return `page ${payload.n}`; });
  const first = run({ n: 1 });
  const second = run({ n: 2 });
  worker.crash();
  assert.deepEqual(await Promise.all([first, second]), ['page 1', 'page 2']);
  assert.equal(await run({ n: 3 }), 'page 3');
  assert.deepEqual(handled, [1, 2, 3]);
});

test('sans worker, tout passe par la page', async () => {
  const run = createPool([], async (payload) => `page ${payload.n}`);
  assert.equal(await run({ n: 1 }), 'page 1');
});
