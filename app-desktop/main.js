const { app, BrowserWindow, ipcMain, dialog, session, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store').default;
const https = require('https');
const http = require('http');

const store = new Store();

let mainWindow;
let downloadProgress = new Map();

function createWindow() {
    const configPath = path.join(__dirname, 'config.json');
    let config = { frontendUrl: 'http://localhost:5173' };
    
    if (fs.existsSync(configPath)) {
        try {
            const configData = fs.readFileSync(configPath, 'utf8');
            config = JSON.parse(configData);
        } catch (error) {
            console.error('Erreur lors du chargement de la configuration:', error);
        }
    } else {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
        },
        icon: path.join(__dirname, 'icon.png'),
        title: 'Invoicerr',
    });

    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        try {
            const parsedUrl = new URL(navigationUrl);
            const configUrl = new URL(config.frontendUrl);
            if (parsedUrl.origin !== configUrl.origin) {
                event.preventDefault();
            }
        } catch (error) {
            event.preventDefault();
        }
    });

    mainWindow.webContents.setWindowOpenHandler(() => {
        return { action: 'deny' };
    });

    mainWindow.loadURL(config.frontendUrl);

    const savedSession = store.get('session');
    if (savedSession && savedSession.cookies) {
        savedSession.cookies.forEach(cookie => {
            session.defaultSession.cookies.set(cookie).catch(err => {
                console.error('Erreur lors de la restauration des cookies:', err);
            });
        });
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    setInterval(() => {
        saveSession();
    }, 30000);
}

async function saveSession() {
    try {
        const cookies = await session.defaultSession.cookies.get({});
        store.set('session', {
            cookies: cookies,
            savedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de la session:', error);
    }
}

ipcMain.handle('download-file', async (event, url, filename) => {
    try {
        const result = await dialog.showSaveDialog(mainWindow, {
            defaultPath: filename,
            filters: [
                { name: 'Tous les fichiers', extensions: ['*'] },
                { name: 'PDF', extensions: ['pdf'] },
                { name: 'Images', extensions: ['png', 'jpg', 'jpeg'] },
            ],
        });

        if (result.canceled) {
            return { success: false, message: 'Téléchargement annulé' };
        }

        const downloadId = Date.now().toString();
        const filePath = result.filePath;
        const fileStream = fs.createWriteStream(filePath);

        const notification = new Notification({
            title: 'Téléchargement en cours',
            body: `Téléchargement de ${filename}... 0%`,
            silent: false,
        });
        notification.show();

        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const client = urlObj.protocol === 'https:' ? https : http;

            const request = client.get(url, (response) => {
                if (response.statusCode !== 200) {
                    fileStream.close();
                    fs.unlinkSync(filePath);
                    reject(new Error(`Erreur HTTP: ${response.statusCode}`));
                    return;
                }

                const totalSize = parseInt(response.headers['content-length'] || '0', 10);
                let downloadedSize = 0;

                response.on('data', (chunk) => {
                    downloadedSize += chunk.length;
                    const percent = totalSize > 0 ? Math.round((downloadedSize / totalSize) * 100) : 0;
                    
                    downloadProgress.set(downloadId, { percent, filename });
                    
                    const progressNotification = new Notification({
                        title: 'Téléchargement en cours',
                        body: `Téléchargement de ${filename}... ${percent}%`,
                        silent: true,
                    });
                    progressNotification.show();

                    mainWindow.webContents.send('download-progress', {
                        id: downloadId,
                        percent,
                        filename,
                    });
                });

                response.pipe(fileStream);

                fileStream.on('finish', () => {
                    fileStream.close();
                    downloadProgress.delete(downloadId);

                    const successNotification = new Notification({
                        title: 'Téléchargement terminé',
                        body: `${filename} a été téléchargé avec succès`,
                        silent: false,
                    });
                    successNotification.show();

                    mainWindow.webContents.send('download-complete', {
                        id: downloadId,
                        filename,
                        filePath,
                    });

                    resolve({ success: true, filePath });
                });

                fileStream.on('error', (err) => {
                    fileStream.close();
                    fs.unlinkSync(filePath);
                    downloadProgress.delete(downloadId);

                    const errorNotification = new Notification({
                        title: 'Erreur de téléchargement',
                        body: `Erreur lors du téléchargement de ${filename}`,
                        silent: false,
                    });
                    errorNotification.show();

                    reject(err);
                });
            });

            request.on('error', (err) => {
                fileStream.close();
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                downloadProgress.delete(downloadId);
                reject(err);
            });
        });
    } catch (error) {
        console.error('Erreur lors du téléchargement:', error);
        return { success: false, message: error.message };
    }
});

ipcMain.handle('save-session', async () => {
    await saveSession();
    return { success: true };
});

ipcMain.handle('get-config', () => {
    const configPath = path.join(__dirname, 'config.json');
    if (fs.existsSync(configPath)) {
        try {
            const configData = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(configData);
        } catch (error) {
            console.error('Erreur lors du chargement de la configuration:', error);
            return { frontendUrl: 'http://localhost:5173' };
        }
    }
    return { frontendUrl: 'http://localhost:5173' };
});

ipcMain.handle('update-config', (event, newConfig) => {
    const configPath = path.join(__dirname, 'config.json');
    try {
        fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
        return { success: true };
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la configuration:', error);
        return { success: false, message: error.message };
    }
});

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    saveSession();
    
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    saveSession();
});
