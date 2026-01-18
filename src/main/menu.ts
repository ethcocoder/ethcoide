import { Menu, MenuItem, app, BrowserWindow, dialog } from 'electron';

export function setupMenus(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    // File Menu
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.send('menu-action', { type: 'new-file' });
            }
          }
        },
        {
          label: 'Open File...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              const result = await dialog.showOpenDialog(focusedWindow, {
                properties: ['openFile'],
                filters: [
                  { name: 'All Files', extensions: ['*'] },
                  { name: 'JavaScript', extensions: ['js', 'jsx'] },
                  { name: 'TypeScript', extensions: ['ts', 'tsx'] },
                  { name: 'Python', extensions: ['py'] },
                  { name: 'Text Files', extensions: ['txt', 'md'] }
                ]
              });
              
              if (!result.canceled && result.filePaths.length > 0) {
                focusedWindow.webContents.send('menu-action', { 
                  type: 'open-file', 
                  filePath: result.filePaths[0] 
                });
              }
            }
          }
        },
        {
          label: 'Open Folder...',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: async () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              const result = await dialog.showOpenDialog(focusedWindow, {
                properties: ['openDirectory']
              });
              
              if (!result.canceled && result.filePaths.length > 0) {
                focusedWindow.webContents.send('menu-action', { 
                  type: 'open-folder', 
                  folderPath: result.filePaths[0] 
                });
              }
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.send('menu-action', { type: 'save-file' });
            }
          }
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.send('menu-action', { type: 'save-file-as' });
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.send('menu-action', { type: 'close-tab' });
            }
          }
        },
        { type: 'separator' },
        {
          role: 'quit'
        }
      ]
    },

    // Edit Menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.send('menu-action', { type: 'find' });
            }
          }
        },
        {
          label: 'Find and Replace',
          accelerator: 'CmdOrCtrl+H',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.send('menu-action', { type: 'find-replace' });
            }
          }
        },
        {
          label: 'Find in Files',
          accelerator: 'CmdOrCtrl+Shift+F',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.send('menu-action', { type: 'find-in-files' });
            }
          }
        }
      ]
    },

    // View Menu
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle File Explorer',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.send('menu-action', { type: 'toggle-explorer' });
            }
          }
        },
        {
          label: 'Toggle AI Chat Panel',
          accelerator: 'CmdOrCtrl+Shift+A',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.send('menu-action', { type: 'toggle-ai-chat' });
            }
          }
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },

    // AI Menu
    {
      label: 'AI',
      submenu: [
        {
          label: 'Generate Completion',
          accelerator: 'CmdOrCtrl+Space',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.send('menu-action', { type: 'ai-completion' });
            }
          }
        },
        {
          label: 'Edit Selected Code',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.send('menu-action', { type: 'ai-edit-code' });
            }
          }
        },
        {
          label: 'Explain Code',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.send('menu-action', { type: 'ai-explain-code' });
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Open AI Chat',
          accelerator: 'CmdOrCtrl+Shift+C',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.send('menu-action', { type: 'open-ai-chat' });
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Configure API Key',
          click: () => {
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
              focusedWindow.webContents.send('menu-action', { type: 'configure-api-key' });
            }
          }
        }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });

    // Window menu for macOS
    template.push({
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
        { type: 'separator' },
        { role: 'front' }
      ]
    });
  }

  // Help menu
  template.push({
    label: 'Help',
    submenu: [
      {
        label: 'About AI-Powered IDE',
        click: async () => {
          const focusedWindow = BrowserWindow.getFocusedWindow();
          if (focusedWindow) {
            await dialog.showMessageBox(focusedWindow, {
              type: 'info',
              title: 'About AI-Powered IDE',
              message: 'AI-Powered IDE',
              detail: 'A revolutionary desktop IDE with AI assistance powered by Gemini API.\n\nVersion: 1.0.0\nAuthor: Ethco Coder'
            });
          }
        }
      },
      {
        label: 'Keyboard Shortcuts',
        click: () => {
          const focusedWindow = BrowserWindow.getFocusedWindow();
          if (focusedWindow) {
            focusedWindow.webContents.send('menu-action', { type: 'show-shortcuts' });
          }
        }
      }
    ]
  });

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  console.log('Application menus set up successfully');
}