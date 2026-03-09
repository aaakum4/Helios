export function initializePriorityEmailBridge() {
  if (typeof window === "undefined") {
    return;
  }

  // Electron injects the real bridge from preload.
  if (window.priorityEmail && typeof window.priorityEmail.sendReminderEmail === "function") {
    return;
  }

  // Web fallback: explicit unsupported response for email features.
  window.priorityEmail = {
    async sendReminderEmail() {
      return {
        ok: false,
        error:
          "Priority email requires the desktop app (Electron) with SMTP configured. Start with `npm start` and restart the app after preload changes.",
      };
    },
  };
}
