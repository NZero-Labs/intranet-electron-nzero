import { app, autoUpdater, dialog } from 'electron'
import { updateElectronApp } from 'update-electron-app'
import path from 'path'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import { initializeMainWindow } from '~/main/main-window'
import { initTabsIpcHandlers } from '~/main/tabs-handler'

updateElectronApp({
  notifyUser: true,
  onNotifyUser(info) {
    dialog.showMessageBox({
      type: 'info',
      buttons: ['Instalar agora', 'Mais tarde'],
      title: "Atualização Disponível",
      message:  process.platform === 'win32' ? info.releaseNotes : info.releaseName,
      detail: "Uma nova versao do Intranet está disponível. reinicie o aplicativo para instalar a nova versão.",
      icon: path.join(__dirname, './assets/icon.png')
    }).then((returnValue) => {
      if (returnValue.response === 0) autoUpdater.quitAndInstall()
    })
  },
})

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('intranet', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('intranet')
}
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  electronApp.setAppUserModelId('intranet')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  initTabsIpcHandlers()
  initializeMainWindow()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
