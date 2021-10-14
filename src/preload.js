const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('api', {
  send: (name, arg) => {
    ipcRenderer.send(name, arg)
  },
  receive: (name, func) => {
    ipcRenderer.on(name, (event, ...args) => {
      func(...args)
    })
  }
})
