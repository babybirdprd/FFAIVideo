import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { generateVideo, VideoConfig, VideoAspect, generateResponse } from './index';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
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

ipcMain.on('load-local-videos', (event, dirPath) => {
  fs.readdir(dirPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return;
    }
    const videoFiles = files.filter(file => file.endsWith('.mp4') || file.endsWith('.mov'));
    const fullPaths = videoFiles.map(file => path.join(dirPath, file));
    event.reply('local-videos-loaded', fullPaths);
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

ipcMain.on('generate-script', async (event, { topic, config }) => {
  try {
    const prompt = `Generate a short video script about the following topic: ${topic}. The script should be concise and suitable for a short video.`;
    const script = await generateResponse(prompt, config);
    event.reply('script-generated', script);
  } catch (error) {
    event.reply('script-error', error instanceof Error ? error.message : 'An unknown error occurred');
  }
});

ipcMain.on('save-preset', (event, preset) => {
  dialog.showSaveDialog({
    title: 'Save Preset',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  }).then(result => {
    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, JSON.stringify(preset, null, 2));
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

ipcMain.on('generate-preview', async (event, config: VideoConfig) => {
  try {
    // Generate a short preview (e.g., 5 seconds)
    const previewConfig = { ...config, videoClipDuration: 5 };
    const previewPath = await generateVideo(previewConfig, (progress: number) => {
      event.reply('preview-progress', progress);
    });
    event.reply('preview-generated', previewPath);
  } catch (error) {
    event.reply('preview-error', error instanceof Error ? error.message : 'An unknown error occurred');
  }
});

ipcMain.on('get-video-aspects', (event) => {
  event.reply('video-aspects', Object.values(VideoAspect));
});

ipcMain.on('get-voice-names', (event) => {
  // This should be implemented to return available voice names
  // For now, we'll return a placeholder array
  event.reply('voice-names', ['en-US-JennyNeural', 'en-US-GuyNeural', 'zh-CN-XiaoxiaoNeural']);
});
