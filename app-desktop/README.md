# Application Desktop Invoicerr

Application Electron pour accéder à Invoicerr depuis le bureau.

## Fonctionnalités

- ✅ Téléchargement de fichiers (PDF, images, etc.)
- ✅ Sauvegarde automatique de session
- ✅ Configuration via fichier `config.json`
- ✅ Restauration automatique des cookies de session

## Installation

```bash
npm install
```

## Configuration

Modifiez le fichier `config.json` pour définir l'URL de votre frontend :

```json
{
  "frontendUrl": "http://localhost:5173"
}
```

## Utilisation

### Démarrer l'application

```bash
npm start
```

### Télécharger un fichier depuis le frontend

Dans votre code frontend, vous pouvez utiliser l'API Electron :

```javascript
if (window.electronAPI) {
    window.electronAPI.downloadFile('https://example.com/file.pdf', 'document.pdf')
        .then(result => {
            if (result.success) {
                console.log('Fichier téléchargé:', result.filePath);
            }
        });
}
```

### Sauvegarder manuellement la session

```javascript
if (window.electronAPI) {
    window.electronAPI.saveSession();
}
```

## Structure

- `main.js` - Processus principal Electron
- `preload.js` - Script de préchargement pour la sécurité
- `config.json` - Configuration de l'application
- `package.json` - Dépendances et scripts

## Build pour production

Pour créer un exécutable, utilisez `electron-builder` ou `electron-packager`.

