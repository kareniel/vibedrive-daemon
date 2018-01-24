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
var appdir = os.homedir() + '/__VibedriveTEST__'

function setupApp () {
  return App(services, { appdir, user})
}

// test('file is unsupported: move file to the unsupported folder', t => {
//   t.plan(1)

//   rimraf.sync(appdir)

//   var app = setupApp()

//   app.on('ready', async function () {
//     const fileName = 'file.txt'

//     var filePath = path.join(app.folder.subfolder('inbox'), fileName)
//     var unsupported = app.folder.subfolder('unsupported')

//     fs.writeFileSync(filePath, 'whatever')

//     await sleep(1000)

//     var files = fs.readdirSync(unsupported)

//     t.equal(files.includes(fileName), true, 'file is now in unsupported folder')
//     t.end()
//     app.quit()
//   })
// })

test('file is a zip: unzip file and move it to the archive folder', t => {
  rimraf.sync(appdir)

  var app = setupApp()

  app.on('ready', function () {
    var zippedFileName = 'archive.zip'
    var unzippedFileName = 'unzipped.txt'

    var inbox = app.folder.subfolder('inbox')
    var archives = app.folder.subfolder('archives')

    var inboxWatcher = fs.watch(inbox)
    var archivesWatcher = fs.watch(archives)

    inboxWatcher.on('change', function (eventName, changedFile) {
      if (changedFile === zippedFileName) { return t.pass('archive is moved to inbox') }
      if (changedFile === unzippedFileName) { return t.pass('archive is unzipped') }
    })

    archivesWatcher.on('change', function (eventName, changedFile) {
      if (changedFile === zippedFileName) {
        t.pass('archive is moved to archives')
        app.quit()
        t.end()
      }
    })

    var src = path.join(__dirname, zippedFileName)
    var dest = path.join(inbox, zippedFileName)

    fs.writeFileSync(dest, fs.readFileSync(src))
    t.equal(fs.existsSync(dest), true, 'file was copied to inbox')
  })
})

// test('file is supported: create a new track', t => {
//   t.plan(3)

//   var app = setupApp()

//   var fileName = 'audio-file.mp3'
//   var waiting = path.join(app.folder.appdir, app.folder.subfolders.waiting)
//   var inbox = path.join(app.folder.appdir, app.folder.subfolders.inbox)
//   var waitingWatcher = fs.watch(waiting)

//   waitingWatcher.on('change', onWaitingChange)

//   cp(fileName, inbox)

//   var timeout = setTimeout(function () {
//     clearTimeout(timeout)
//     t.fail('file should be in waiting folder in less than 3 seconds')
//     app.quit()
//     app = null
//   }, 3000)

//   function onWaitingChange (eventType, changedFile) {
//     if (changedFile === fileName) {
//       clearTimeout(timeout)
//       waitingWatcher.close()
//       t.pass('file is in waiting folder')

//       services.dataStore.get('track', fileName)
//       t.fail('track exits')
//       t.fail('file is on the server')
//       app.quit()
//     }
//   }
// })
