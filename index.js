if (!['production'].includes(process.env.NODE_ENV)) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

var os = require('os')
var assert = require('assert')
var fs = require('fs')
var path = require('path')
var yaml = require('js-yaml')
var vibedrive = require('vibedrive-sdk')
var Folder = require('managed-folder')
var AudioFile = require('./AudioFile')
var { move, er } = require('./utils')
var logger = require('./logger')
var sleep = require('hypno')

const appConfig = yaml.safeLoad(fs.readFileSync(path.join(__dirname, 'config.yaml')))

if (require.main === module) {
  logger.debug('called directly')
  App(vibedrive)
} else {
  logger.debug('required as a module')
  module.exports = App
}

function App (vibedrive) {
  this.vibedrive = vibedrive
  this.config = appConfig
  this.folder = Folder({
    appdir: path.join(os.homedir(), 'Vibedrive'),
    subfolders: {
      inbox: 'Inbox',
      library: 'Library',
      unsupported: 'Unsupported'
    }
  })

  this.folder.on('ready', () => {
    logger.info('ready.')
    logger.info('appdir=' + this.folder.appdir)

    this.folder.on('inbox:add', this.onFileAdded)

    this.init()
  })
}

App.prototype.init = function () {
  this.retryLogin()
}

App.prototype.retryLogin = async function () {
  const t = 5000
  this.login()
    .then(this.fetchUserIdentity)
    .catch(async function (err) {
      logger.warning(`failed to login. will retry in ${t} ms. ${er(err)}`)
      await sleep(t)
      this.retryLogin()
    })
}

App.prototype.login = function () {
  var promiseOfLogin = vibedrive.auth.login(this.config.user.username, this.config.user.password)

  return promiseOfLogin
}

App.prototype.fetchUserIdentity = async function (loggedIn) {
  assert.equal(loggedIn, true, 'expect loggedIn to be true if login succeeded')

  return vibedrive.user.get()
}

App.prototype.onFileAdded = function (filepath) {
  logger.debug('file added to inbox folder:', path.basename(filepath))

  var file = {
    name: path.basename(filepath),
    filepath,
    extension: path.extname(filepath),
    stats: fs.statSync(filepath),
    _folder: this.folder
  }

  // mp3 only
  if (!['.mp3'].includes(file.extension)) {
    var inboxFolder = file.filepath
    var unsupportedFolder = path.join(this.folder.subfolders.unsupported, path.basename(file.filepath))
    move(inboxFolder, unsupportedFolder)
    logger.info(`couldn't read ${file.extension} file.`)
    logger.debug(`${file.name} moved to the $unsupported folder.`)
    return
  }

  var audioFile = AudioFile({
    name: path.basename(file.filepath),
    path: file.filepath,
    type: 'audio/mp3',
    size: file.stats.size
  })

  audioFile.on('error', this.onAudioFileLoadError)
  audioFile.on('load', this.onAudioFileLoad)

  audioFile.load()
}

App.prototype.onAudioFileLoadError = function (err) {
  logger.error(err)
}

App.prototype.onAudioFileLoad = async function (audioFile) {
  var inbox = audioFile._file.filepath
  var library = path.join(this.folder, 'Library', audioFile.relativePath())

  this.createTrackFrom(audioFile).then(() => move(inbox, library))
}

App.prototype.createTrackFrom = function (audioFile) {
  return this.vibedrive.track.create(audioFile)
    .then(() => logger.info(`created track: ${audioFile.name}`))
    .catch(err => logger.error(`failed to create track: ${audioFile.name}. \n${er(err)}`))
}
