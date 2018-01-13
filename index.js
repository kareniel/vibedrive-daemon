if (!['production'].includes(process.env.NODE_ENV)) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

var os = require('os')
var assert = require('assert')
var fs = require('fs')
var path = require('path')
var yaml = require('js-yaml')
var sleep = require('hypno')
var vibedrive = require('vibedrive-sdk')
var Folder = require('managed-folder')
var logger = require('./lib/logger')
var AudioFile = require('./AudioFile')
var { move, er } = require('./utils')

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
      logger.info(`failed to login. will retry in ${t} ms. ${er(err)}`)
      await sleep(t)
      this.retryLogin()
    })
}

App.prototype.login = function () {
  var promiseOfLogin = this.vibedrive.auth
    .login(this.config.user.username, this.config.user.password)

  return promiseOfLogin
}

App.prototype.fetchUserIdentity = async function (loggedIn) {
  assert.equal(loggedIn, true, 'expect loggedIn to be true if login succeeded')

  return vibedrive.user.get()
}

App.prototype.onFileAdded = function (filepath) {
  var folder = this.folder
  var audioFile = AudioFile({
    name: path.basename(filepath),
    path: filepath,
    extension: path.extname(filepath),
    type: 'audio/mp3',
    size: fs.statSync(filepath).size
  })

  audioFile.on('load', () => {
    this.createTrackFrom(audioFile).then(() => {
      var inbox = filepath
      var library = path.join(folder.appdir, 'Library', audioFile.relativePath())
      move(inbox, library)
    })
  })

  audioFile.on('error', err => {
    if (err.code === 'unsupported') {
      var inboxDir = filepath
      var unsupportedDir = path.join(this.folder.subfolders.unsupported, path.basename(filepath))
      move(inboxDir, unsupportedDir)
    }
  })

  audioFile.load()
}

App.prototype.createTrackFrom = function (audioFile) {
  return this.vibedrive.track.create(audioFile)
    .then(() => logger.info(`created track: ${audioFile.name}`))
    .catch(err => logger.error(`failed to create track: ${audioFile.name}. \n${er(err)}`))
}
