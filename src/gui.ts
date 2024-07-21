import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { generateVideo, VideoConfig } from './index';

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile(path.join(__dirname, 'index.html'));
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

ipcMain.on('generate-video', (event, config: VideoConfig) => {
  generateVideo(config, (progress) => {
    event.reply('progress-update', progress);
  }).then((videoPath) => {
    event.reply('video-generated', videoPath);
  }).catch((error) => {
    event.reply('generation-error', error.message);
  });
});
