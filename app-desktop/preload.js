const { contextBridge, ipcRenderer } = require('electron');

// Exposer les APIs sécurisées au renderer
contextBridge.exposeInMainWorld('electronAPI', {
    // Télécharger un fichier
    downloadFile: (url, filename) => ipcRenderer.invoke('download-file', url, filename),
    
    // Sauvegarder la session
    saveSession: () => ipcRenderer.invoke('save-session'),
    
    // Obtenir la configuration
    getConfig: () => ipcRenderer.invoke('get-config'),
    
    // Mettre à jour la configuration
    updateConfig: (config) => ipcRenderer.invoke('update-config', config),
    
    // Écouter les événements de progression de téléchargement
    onDownloadProgress: (callback) => {
        ipcRenderer.on('download-progress', (event, data) => callback(data));
    },
    
    // Écouter les événements de téléchargement terminé
    onDownloadComplete: (callback) => {
        ipcRenderer.on('download-complete', (event, data) => callback(data));
    },
    
    // Retirer les listeners
    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    },
});

