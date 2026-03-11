export const LAST_LOCAL_WRITE_AT_KEY = "helios:meta:lastLocalWriteAt";

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

    // Preserve the exact serialized localStorage value so restore is lossless.
    storageSnapshot[key] = rawValue;
  }

  return storageSnapshot;
}

export function buildCloudPayload() {
  const nowMs = Date.now();
  setLocalWriteTimestamp(nowMs);

  return {
    app: "helios",
    savedAt: new Date(nowMs).toISOString(),
    localStorage: buildLocalStorageSnapshot(),
  };
}

function parseTimestampMs(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return numeric;
    }

    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function safeParseStoredValue(rawValue) {
  try {
    return JSON.parse(rawValue);
  } catch {
    return rawValue;
  }
}

export function getCloudPayloadSavedAtMs(cloudPayload) {
  return parseTimestampMs(cloudPayload?.savedAt);
}

export function getLocalWriteTimestamp() {
  const raw = localStorage.getItem(LAST_LOCAL_WRITE_AT_KEY);
  const parsed = parseTimestampMs(raw);
  return parsed ?? 0;
}

export function setLocalWriteTimestamp(timestampMs) {
  if (!Number.isFinite(timestampMs) || timestampMs <= 0) {
    return;
  }

  localStorage.setItem(LAST_LOCAL_WRITE_AT_KEY, String(Math.floor(timestampMs)));
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

export function rehydrateLocalStorage(snapshot, options = {}) {
  const { dispatchEvents = false } = options;
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

    // Backward-compatible with older backups that stored parsed JSON values.
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);

    if (dispatchEvents) {
      window.dispatchEvent(
        new CustomEvent("localStorageChange", {
          detail: { key, value: safeParseStoredValue(serialized) },
        })
      );
    }
  });
}

export function applyCloudPayloadIfNewer(cloudPayload, options = {}) {
  const { force = false, dispatchEvents = false } = options;
  const snapshot = extractSnapshotFromCloudPayload(cloudPayload);
  const cloudSavedAtMs = getCloudPayloadSavedAtMs(cloudPayload);
  const localLastWriteAtMs = getLocalWriteTimestamp();

  if (!force) {
    if (cloudSavedAtMs != null && localLastWriteAtMs > cloudSavedAtMs) {
      return {
        applied: false,
        reason: "local_newer",
        localLastWriteAtMs,
        cloudSavedAtMs,
        snapshotKeyCount: Object.keys(snapshot).length,
      };
    }

    if (cloudSavedAtMs == null && localLastWriteAtMs > 0) {
      return {
        applied: false,
        reason: "cloud_timestamp_missing",
        localLastWriteAtMs,
        cloudSavedAtMs: null,
        snapshotKeyCount: Object.keys(snapshot).length,
      };
    }
  }

  rehydrateLocalStorage(snapshot, { dispatchEvents });
  setLocalWriteTimestamp(cloudSavedAtMs ?? Date.now());

  return {
    applied: true,
    reason: force ? "force_applied" : "cloud_newer_or_equal",
    localLastWriteAtMs,
    cloudSavedAtMs,
    snapshotKeyCount: Object.keys(snapshot).length,
  };
}
