export function buildLocalStorageSnapshot() {
  const storageSnapshot = {};

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key || key.startsWith("sb-")) {
      continue;
    }

    const rawValue = localStorage.getItem(key);
    if (rawValue == null) {
      continue;
    }

    try {
      storageSnapshot[key] = JSON.parse(rawValue);
    } catch {
      storageSnapshot[key] = rawValue;
    }
  }

  return storageSnapshot;
}

export function buildCloudPayload() {
  return {
    app: "helios",
    savedAt: new Date().toISOString(),
    localStorage: buildLocalStorageSnapshot(),
  };
}

export function extractSnapshotFromCloudPayload(cloudPayload) {
  const snapshot =
    cloudPayload &&
    typeof cloudPayload === "object" &&
    cloudPayload.localStorage &&
    typeof cloudPayload.localStorage === "object"
      ? cloudPayload.localStorage
      : cloudPayload;

  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new Error("Cloud backup format is invalid.");
  }

  return snapshot;
}

export function rehydrateLocalStorage(snapshot) {
  const keysToDelete = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && !key.startsWith("sb-")) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach((key) => localStorage.removeItem(key));

  Object.entries(snapshot).forEach(([key, value]) => {
    if (!key || key.startsWith("sb-")) {
      return;
    }

    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);
  });
}
