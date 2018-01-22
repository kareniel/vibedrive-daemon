/* a file gets added to the inbox folder */

var os = require('os')
var fs = require('fs')
var cp = require('node-cp')
var yaml = require('js-yaml')
var path = require('path')
var tape = require('tape')
var services = require('vibedrive-sdk')
var App = require('../.')
var config = yaml.safeLoad(fs.readFileSync(path.join(__dirname, '../config.yaml')))

var app

function test (description, fn) {
  tape(description, function (t) {
    setup()
    fn(t)
    teardown()
  })
}

function setup () {
  app = App(services, {
    appdir: os.homedir() + '/__VibedriveTEST__',
    user: config.user
  })
}

function teardown () {
  app.quit()
}

test('file is unsupported: move file to the unsupported folder', t => {
  t.plan(1)

  const fileName = 'file.txt'
  var filePath = path.join(app.folder.appdir, app.folder.subfolders.inbox, fileName)
  var unsupported = path.join(app.folder.appdir, app.folder.subfolders.unsupported)

  fs.writeFileSync(filePath, 'whatever')

  setTimeout(function () {
    var files = fs.readdirSync(unsupported)

    t.ok(files.includes(fileName), 'file is now in unsupported folder')
    t.end()
  }, 1000)
})

test('file is a zip: unzip file and move it to the archive folder', t => {
  t.plan(2)

  var fileName = 'test.zip'
  var inbox = path.join(app.folder.appdir, app.folder.subfolders.inbox)
  var archives = path.join(app.folder.appdir, app.folder.subfolders.archives)

  cp(fileName, inbox, function () {
    setTimeout(function () {
      t.ok(fs.readdirSync(archives).includes(fileName), 'file is in archive folder')
      t.ok(fs.readdirSync(inbox).includes('unzipped.txt'), 'unzipped file is now in inbox')
    }, 1000)
  })

  t.end()
})

test('file is supported: create a new track', t => {
  t.plan(3)

  var fileName = 'audio-file.mp3'
  var waiting = path.join(app.folder.appdir, app.folder.subfolders.waiting)
  var inbox = path.join(app.folder.appdir, app.folder.subfolders.inbox)
  var waitingWatcher = fs.watch(waiting)

  waitingWatcher.on('change', onWaitingChange)

  cp(fileName, inbox)

  var timer = setTimeout(function () {
    t.fail('file should be in waiting folder in less than 3 seconds')
  }, 3000)

  function onWaitingChange (eventType, changedFile) {
    if (changedFile === fileName) {
      clearTimeout(timer)
      waitingWatcher.close()
      t.pass('file is in waiting folder')

      services.dataStore.get('track', fileName)
      t.fail('track exits')
      t.fail('file is on the server')
    }
  }
})
