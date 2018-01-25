var os = require('os')
var fs = require('fs')
var path = require('path')
var Folder = require('managed-folder')
var Authenticator = require('./Authenticator')
var logger = require('./logger')
var AudioFile = require('./AudioFile')
var unzip = require('unzip')
var { move, er } = require('./utils')
var Nanobus = require('nanobus')

process.on('unhandledRejection', r => console.log(r))

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

  Nanobus.call(this)
}

App.prototype = Object.create(Nanobus.prototype)

App.prototype.constructor = App

App.prototype.quit = function () {
  this.folder.close()
}

App.prototype.onFolderReady = function () {
  logger.info('Ready.')
  logger.info('Watching ' + this.folder.appdir)
  this.folder.on('inbox:add', this.onFileAdded.bind(this))
  // this.authenticator.init()
  this.emit('ready')
}

App.prototype.onFileAdded = async function (filepath) {
  this.loadFile(filepath, async (err, audioFile) => {
    if (err && err.code === 'unsupported') {
      var ext = path.extname(filepath)
      if (ext === '.zip') { return this.handleArchive(filepath) }
      var unsupportedDir = this.folder.subfolder('unsupported')
      return move(filepath, path.join(unsupportedDir, path.basename(filepath)))
    }

    move(filepath, path.join(this.folder.subfolder('waiting'), path.basename(filepath)))
    this.createTrackFrom(audioFile)
      .then(() => {
        console.log('created track')
      })
      .catch(err => {
        console.log(err)
      })
  })
}

App.prototype.loadFile = function (filepath, done) {
  fs.stat(filepath, function (err, stats) {
    if (err) return done(err)

    var audioFile = AudioFile({
      name: path.basename(filepath),
      path: filepath,
      extension: path.extname(filepath),
      type: 'audio/mp3',
      size: stats.size
    })

    audioFile.on('load', () => done(null, audioFile))
    audioFile.on('error', done)

    audioFile.load()
  })
}

App.prototype.createTrackFrom = function (audioFile) {
  return this.services.track.create(audioFile)
    .then(() => logger.info(`created track: ${audioFile.name}`))
    .catch(err => logger.error(`failed to create track: ${audioFile.name}. \n${er(err)}`))
}

module.exports = App

App.prototype.handleArchive = function (filePath) {
  fs.createReadStream(filePath)
    .pipe(unzip.Extract({ path: path.dirname(filePath) }))
    .on('finish', () => {
      var archives = this.folder.subfolder('archives')
      move(filePath, path.join(archives, path.basename(filePath)))
    })
}
