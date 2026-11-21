const DB_NAME = 'webmili';
const DB_VERSION = 1;
const STORE_NAME = 'documents';
const RECORD_KEY = 'last-document';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB no está disponible.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('No se pudo abrir IndexedDB.'));
  });
}

export async function readLastDocument() {
  const database = await openDatabase();

  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).get(RECORD_KEY);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error('No se pudo leer el documento.'));
    });
  } finally {
    database.close();
  }
}

export async function saveLastDocument(record) {
  const database = await openDatabase();

  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const request = transaction.objectStore(STORE_NAME).put(record, RECORD_KEY);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || request.error || new Error('No se pudo guardar el documento.'));
      transaction.onabort = () => reject(transaction.error || request.error || new Error('Se canceló el guardado.'));
    });

    if (navigator.storage && typeof navigator.storage.persist === 'function') {
      try {
        await navigator.storage.persist();
      } catch (error) {
        // Persistencia opcional: el guardado normal sigue funcionando.
      }
    }
  } finally {
    database.close();
  }
}

export async function deleteLastDocument() {
  const database = await openDatabase();

  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).delete(RECORD_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('No se pudo borrar el documento.'));
      transaction.onabort = () => reject(transaction.error || new Error('Se canceló el borrado.'));
    });
  } finally {
    database.close();
  }
}
