/* a file gets added to the inbox folder */

var os = require('os')
var fs = require('fs')
var rimraf = require('rimraf')
var yaml = require('js-yaml')
var path = require('path')
var test = require('tape')
var services = require('vibedrive-sdk')
var App = require('../.')
var { user } = yaml.safeLoad(fs.readFileSync(path.join(__dirname, '../config.yaml')))
var sleep = require('hypno')
var chokidar = require('chokidar')
var appdir = os.homedir() + '/__VibedriveTEST__'

function setupApp () {
  return App(services, { appdir, user })
}

test('file is unsupported: move file to the unsupported folder', t => {
  t.plan(1)

  rimraf.sync(appdir)

  var app = setupApp()

  app.on('ready', async function () {
    const fileName = 'file.txt'

    var filePath = path.join(app.folder.subfolder('inbox'), fileName)
    var unsupported = app.folder.subfolder('unsupported')

    fs.writeFileSync(filePath, 'whatever')

    await sleep(1000)

    var files = fs.readdirSync(unsupported)

    t.equal(files.includes(fileName), true, 'file is now in unsupported folder')
    t.end()
    app.quit()
  })
})

test('file is a zip: unzip file and move it to the archive folder', t => {
  rimraf.sync(appdir)

  var app = setupApp()
  var i = 0

  app.on('ready', function () {
    var zippedFileName = 'archive.zip'
    var unzippedFileName = 'unzipped.txt'

    var inbox = app.folder.subfolder('inbox')
    var archives = app.folder.subfolder('archives')

    var inboxWatcher = chokidar.watch(inbox)
    var archivesWatcher = chokidar.watch(archives)

    inboxWatcher.on('add', onChange)
    archivesWatcher.on('add', onChange)

    var src = path.join(__dirname, zippedFileName)
    var dest = path.join(inbox, zippedFileName)
    var file = fs.readFileSync(src)

    fs.writeFileSync(dest, file)

    function onChange (filepath) {
      var filename = path.basename(filepath)
      var dir = path.dirname(filepath)

      if (dir === inbox && filename === zippedFileName) {
        t.pass('archive is moved to inbox folder')
        i++
      }

      if (dir === inbox && filename === unzippedFileName) {
        t.pass('archive is unzipped')
        i++
      }

      if (dir === archives && filename === zippedFileName) {
        t.pass('archive is moved to archives folder')
        i++
      }

      if (i === 3) return cleanup()
    }

    async function cleanup () {
      // make sure writeFile is done with the file
      await sleep(0)
      inboxWatcher.close()
      archivesWatcher.close()
      app.quit()
      console.log('end')
      t.end()
    }
  })
})

test('file is supported: create a new track', { timeout: 3000 }, t => {
  rimraf.sync(appdir)

  var app = setupApp()

  app.on('ready', function () {
    var fileName = 'audio-file.mp3'
    var inbox = app.folder.subfolder('inbox')
    var waiting = app.folder.subfolder('waiting')
    var waitingWatcher = chokidar.watch(waiting)

    waitingWatcher.on('add', onWaitingChange)

    var src = path.join(__dirname, fileName)
    var dest = path.join(inbox, fileName)

    fs.writeFileSync(dest, fs.readFileSync(src))

    function onWaitingChange (filepath) {
      if (path.basename(filepath) === fileName) {
        waitingWatcher.close()
        t.pass('file is in waiting folder')

      //   // services.dataStore.get('track', fileName)
      //   // t.fail('track exits')
      //   // t.fail('file is on the server')
        app.quit()
        t.end()
      }
    }
  })
})
