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
    distinct_id: distinctId,
    properties: {
      ...(properties || {}),
      $lib: "helios-web-bridge",
      $lib_version: "1.0.0",
      $current_url: window.location.href,
      $host: window.location.host,
      $pathname: window.location.pathname,
      $browser: navigator.userAgent,
    },
    timestamp: new Date().toISOString(),
  };
}

export function initializePosthogWebBridge() {
  if (typeof window === "undefined") {
    return;
  }

  // Electron already injects a secure PostHog bridge from preload.
  if (window.posthog && typeof window.posthog.capture === "function") {
    if (import.meta.env.DEV) {
      console.log("[PostHog] Using Electron bridge");
    }
    return;
  }

  const apiKey = import.meta.env.VITE_POSTHOG_API_KEY;
  if (!apiKey) {
    if (import.meta.env.DEV) {
      console.warn("[PostHog] VITE_POSTHOG_API_KEY not configured");
    }
    return;
  }

  const host = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";
  const distinctId = getOrCreateDistinctId();

  if (import.meta.env.DEV) {
    console.log("[PostHog] Web bridge initialized", { host, distinctId });
  }

  window.posthog = {
    capture(eventName, properties) {
      if (!eventName) {
        return;
      }

      const payload = buildCapturePayload(eventName, properties, distinctId);

      // Log in development mode
      if (import.meta.env.DEV) {
        console.log("[PostHog]", eventName, properties);
      }

      fetch(`${host}/capture/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        keepalive: true,
      })
        .then((response) => {
          if (!response.ok && import.meta.env.DEV) {
            console.warn(
              `[PostHog] Capture failed: ${response.status} ${response.statusText}`
            );
          }
        })
        .catch((error) => {
          if (import.meta.env.DEV) {
            console.error("[PostHog] Network error:", error);
          }
          // Ignore analytics network failures in production
        });
    },
    getDistinctId() {
      return distinctId;
    },
  };
}
