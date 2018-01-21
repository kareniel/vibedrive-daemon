var os = require('os')
var fs = require('fs')
var path = require('path')
var Folder = require('managed-folder')
var Authenticator = require('./Authenticator')
var logger = require('./logger')
var AudioFile = require('./AudioFile')
var { move, er } = require('./utils')

const APPDIR = path.join(os.homedir(), 'Vibedrive')
const SUBFOLDERS = {
  inbox: 'Inbox',
  library: 'Library',
  unsupported: 'Unsupported',
  archives: 'Archives',
  waiting: 'Waiting'
}

/*
 * Vibedrive Daemon
 */
function App (services, config) {
  if (!(this instanceof App)) return new App(services, config)

  this.services = services
  this.config = config
  this.authenticator = Authenticator(services.auth, config)
  this.folder = Folder({
    appdir: config.appdir || APPDIR,
    subfolders: config.subfolders || SUBFOLDERS
  })

  this.folder.on('ready', this.onFolderReady.bind(this))
}

App.prototype.onFolderReady = function () {
  logger.info('Ready.')
  logger.info('Watching ' + this.folder.appdir)

  this.folder.on('inbox:add', this.onFileAdded)
  // this.authenticator.init()
}

App.prototype.onFileAdded = async function (filepath) {
  var audioFile

  try {
    audioFile = await this.loadFile(filepath)
  } catch (err) {
    switch (err.code) {
      case 'unsupported':
        return this.move(filepath, this.folder.subfolders.unsupported)
      default:
        throw err
    }
  }

  try {
    await this.createTrackFrom(audioFile)
  } catch (err) {

  }

  try {
    await this.moveFile(audioFile, path.join(this.folder.appdir, this.folder.subfolders.library))
  } catch (err) {

  }
}

App.prototype.loadFile = function (filepath, done) {
  var audioFile = AudioFile({
    name: path.basename(filepath),
    path: filepath,
    extension: path.extname(filepath),
    type: 'audio/mp3',
    size: fs.statSync(filepath).size
  })

  audioFile.on('load', done)
  audioFile.on('error', done)
  audioFile.load()
}

App.prototype.move = function (audioFile, libraryFolder) {
  var inbox = audioFile.filepath
  var library = path.join(libraryFolder, audioFile.relativePath())
  move(inbox, library)
}

App.prototype.createTrackFrom = function (audioFile) {
  return this.services.track.create(audioFile)
    .then(() => logger.info(`created track: ${audioFile.name}`))
    .catch(err => logger.error(`failed to create track: ${audioFile.name}. \n${er(err)}`))
}

module.exports = App
