'use strict'

import { app, protocol, BrowserWindow, ipcMain } from 'electron'

import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'

import { cloneDeep } from 'lodash'

import fs from 'fs'
import path from 'path'

import urlJoin from 'url-join'

import axios from 'axios'

import log from 'electron-log'

const onvif = require('node-onvif')

const sharp = require('sharp')

const isDevelopment = process.env.NODE_ENV !== 'production'

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

let win
async function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    win.loadURL('app://./index.html')
  }
}

let activated = false

const cameras = []

async function init () {
  await onvif.startProbe().then((deviceInfos) => {
    deviceInfos.forEach(async (deviceInfo) => {
      const device = new onvif.OnvifDevice({
        xaddr: deviceInfo.xaddrs[0]
      })

      let cameraInfo = {}

      cameraInfo.ready = false

      cameraInfo._location = deviceInfo.location
      cameraInfo._hardware = deviceInfo.hardware
      cameraInfo._name = deviceInfo.name
      cameraInfo._xaddrs = deviceInfo.xaddrs
      cameraInfo._xaddr = deviceInfo.xaddrs[0]
      cameraInfo._scopes = deviceInfo.scopes
      cameraInfo._types = deviceInfo.types
      cameraInfo._address = device.address

      cameraInfo.device = new onvif.OnvifDevice({
        xaddr: cameraInfo._xaddr,
        user: 'admin',
        pass: 'admin'
      })

      cameraInfo.device.init()
        .then((info) => {
          cameraInfo.ready = true
          cameraInfo.info = cloneDeep(info)

          cameraInfo.profile = cloneDeep(cameraInfo.device.getCurrentProfile())
        })
        .catch((err) => {
          throw err
        })

      log.info(`${device.address} is found`)

      cameras.push(cameraInfo)
    })
  }).catch((err) => {
    log.error('electron:event:notOnvifStartProbe')
    log.error(err)
    log.error(err.stack)
    console.error(err)
  })

  activated = true
}

const interval = 1

async function timer() {
  await fetch()

  setTimeout(timer, interval * 1000)
}

async function fetch() {
  if (cameras.length === 0) { return }

  const camera = cameras[0]
  if (camera.ready) {
    const snapshot = await camera.device.fetchSnapshot()
    const b64encoded = Buffer.from(snapshot.body).toString('base64')

    win.webContents.send('refresh', `data:image/png;base64,${b64encoded}`)
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    try {
      await installExtension(VUEJS3_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }

  init()

  createWindow()

  timer()
})

if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
