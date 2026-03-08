function getOrCreateDistinctId() {
  try {
    const storageKey = "helios-posthog-distinct-id";
    const existing = window.localStorage.getItem(storageKey);
    if (existing) {
      return existing;
    }

    const generated =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `helios-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    window.localStorage.setItem(storageKey, generated);
    return generated;
  } catch {
    return "helios-web-anonymous";
  }
}

function buildCapturePayload(eventName, properties, distinctId) {
  return {
    api_key: import.meta.env.VITE_POSTHOG_API_KEY,
    event: eventName,
    properties: {
      ...(properties || {}),
      distinct_id: distinctId,
      $lib: "helios-web-bridge",
      $current_url: window.location.href,
      $host: window.location.host,
    },
  };
}

export function initializePosthogWebBridge() {
  if (typeof window === "undefined") {
    return;
  }

  // Electron already injects a secure PostHog bridge from preload.
  if (window.posthog && typeof window.posthog.capture === "function") {
    return;
  }

  const apiKey = import.meta.env.VITE_POSTHOG_API_KEY;
  if (!apiKey) {
    return;
  }

  const host = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";
  const distinctId = getOrCreateDistinctId();

  window.posthog = {
    capture(eventName, properties) {
      if (!eventName) {
        return;
      }

      const payload = buildCapturePayload(eventName, properties, distinctId);

      fetch(`${host}/capture/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {
        // Ignore analytics network failures so they never affect app UX.
      });
    },
    getDistinctId() {
      return distinctId;
    },
  };
}
