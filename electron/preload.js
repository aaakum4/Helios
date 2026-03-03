const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("nativeTheme", {
	get: () => ipcRenderer.invoke("native-theme:get"),
	onUpdated: (callback) => {
		if (typeof callback !== "function") {
			return () => {};
		}

		const handler = (_event, payload) => callback(payload);
		ipcRenderer.on("native-theme:updated", handler);

		return () => {
			ipcRenderer.removeListener("native-theme:updated", handler);
		};
	},
});

// PostHog bridge — lets the renderer send events to the main process (posthog-node)
contextBridge.exposeInMainWorld("posthog", {
	capture: (eventName, properties) => {
		ipcRenderer.send("posthog:capture", { eventName, properties });
	},
	getDistinctId: () => ipcRenderer.invoke("posthog:get-distinct-id"),
});

// Window bridge — expose min size getter and listener
contextBridge.exposeInMainWorld("windowApi", {
	getMinSize: () => ipcRenderer.invoke("window:get-min-size"),
	onMinSizeChanged: (callback) => {
		if (typeof callback !== "function") {
			return () => {};
		}

		const handler = (_event, payload) => callback(payload);
		ipcRenderer.on("window:min-size-changed", handler);

		return () => {
			ipcRenderer.removeListener("window:min-size-changed", handler);
		};
	},
});
