export function initializePriorityEmailBridge() {
  if (typeof window === "undefined") {
    return;
  }

  // Electron injects the real bridge from preload.
  if (window.priorityEmail && typeof window.priorityEmail.sendReminderEmail === "function") {
    return;
  }

  // Web fallback: use backend API for email sending
  window.priorityEmail = {
    async sendReminderEmail(payload) {
      // Default to Vercel serverless function in production, localhost in dev
      const apiUrl = import.meta.env.VITE_EMAIL_API_URL || 
        (window.location.hostname === "localhost" 
          ? "http://localhost:3001/api/send-email"
          : "/api/send-email");
      
      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        return result;
      } catch (error) {
        return {
          ok: false,
          error: "Failed to connect to email server. Make sure the backend is running.",
        };
      }
    },
  };
}
