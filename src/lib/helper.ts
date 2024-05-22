export const getStorageData = key =>
  new Promise((resolve, reject) =>
    chrome.storage.sync.get(key, result =>
      chrome.runtime.lastError ? reject(Error(chrome.runtime.lastError.message)) : resolve(result),
    ),
  );

export const setStorageData = data =>
  new Promise<void>((resolve, reject) =>
    chrome.storage.sync.set(data, () =>
      chrome.runtime.lastError ? reject(Error(chrome.runtime.lastError.message)) : resolve(),
    ),
  );
