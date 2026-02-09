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
