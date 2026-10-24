/**
 * Répartit les demandes entre des workers : une à la fois par worker, les autres attendent.
 * Un worker qui plante confie sa demande en cours, et toutes les suivantes, à `fallback` (la page).
 */
export function createPool(workers, fallback) {
  const idle = [];
  const queue = [];
  const busy = new Map(); // worker → demande en cours
  let nextId = 0;
  let alive = workers.length;

  const pump = () => {
    while (queue.length && (idle.length || !alive)) {
      const task = queue.shift();
      if (!alive) {
        fallback(task.payload).then(task.resolve, task.reject);
        continue;
      }
      const worker = idle.pop();
      busy.set(worker, task);
      worker.postMessage({ id: task.id, ...task.payload });
    }
  };

  for (const worker of workers) {
    worker.onmessage = ({ data }) => {
      const task = busy.get(worker);
      busy.delete(worker);
      idle.push(worker);
      if (data.error) task.reject(new Error(data.error));
      else task.resolve(data.result);
      pump();
    };
    worker.onerror = () => {
      const task = busy.get(worker);
      busy.delete(worker);
      alive--;
      if (task) fallback(task.payload).then(task.resolve, task.reject);
      pump();
    };
    idle.push(worker);
  }

  return (payload) => new Promise((resolve, reject) => {
    queue.push({ id: nextId++, payload, resolve, reject });
    pump();
  });
}
