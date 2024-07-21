import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { generateVideo, VideoConfig } from './index';

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile(path.join(__dirname, '..', 'src', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on('select-directory', (event, type) => {
  dialog.showOpenDialog({
    properties: ['openDirectory']
  }).then(result => {
    if (!result.canceled) {
      event.reply('selected-directory', type, result.filePaths[0]);
    }
  }).catch(err => {
    console.log(err);
  });
});

ipcMain.on('generate-video', (event, config: VideoConfig) => {
  generateVideo(config, (progress: number) => {
    event.reply('progress-update', progress);
  }).then((videoPath) => {
    event.reply('video-generated', videoPath);
  }).catch((error) => {
    event.reply('generation-error', error.message);
  });
});

ipcMain.on('save-preset', (event, preset) => {
  dialog.showSaveDialog({
    title: 'Save Preset',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  }).then(result => {
    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, JSON.stringify(preset));
      event.reply('preset-saved');
    }
  });
});

ipcMain.on('load-preset', (event) => {
  dialog.showOpenDialog({
    title: 'Load Preset',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  }).then(result => {
    if (!result.canceled && result.filePaths.length > 0) {
      const preset = JSON.parse(fs.readFileSync(result.filePaths[0], 'utf-8'));
      event.reply('preset-loaded', preset);
    }
  });
});

ipcMain.on('generate-preview', (event, config: VideoConfig) => {
  // Implement preview generation logic here
  // For now, we'll just send a placeholder message
  event.reply('preview-generated', 'Preview generation not implemented yet');
});
