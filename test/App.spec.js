var path = require('path')
var test = require('tape')
var AudioFile = require('../AudioFile')
var proxyquire = require('proxyquire')
var App = require('../.')

test('App.prototype.retryLogin', t => {
  t.plan(2)

  var ctx = {
    login: function () {
      t.pass('login() called')
      return Promise.resolve()
    },
    fetchUserIdentity: function () {
      t.pass('fetchUserIdentity() called')
    }
  }

  App.prototype.retryLogin.call(ctx)
})

test('App.prototype.onFileAdded', t => {
  t.plan(3)

  var filepath = path.join(__dirname, 'audio-file.mp3')
  var App = proxyquire('../.', {
    './utils': {
      move: function (src, dest) {
        t.equal(src, filepath, 'move is called with filepath')
      }
    }
  })

  var ctx = {
    folder: {
      appdir: '/'
    },
    createTrackFrom: function (audioFile) {
      t.pass('createTrackFrom() called')
      t.ok(audioFile instanceof AudioFile, 'audioFile')
      return Promise.resolve()
    }
  }

  App.prototype.onFileAdded.call(ctx, filepath)
})
