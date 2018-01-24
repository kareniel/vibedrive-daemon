var Nanobus = require('nanobus')
var fs = require('fs')
var mm = require('music-metadata')
var concat = require('concat-stream')
var crypto = require('crypto')
var multihashes = require('multihashes')
var RelativePath = require('./RelativePath')

module.exports = AudioFile

function AudioFile (file) {
  if (!(this instanceof AudioFile)) return new AudioFile(file)
  Nanobus.call(this)

  this._file = file

  this.name = file.name
  this.size = file.size

  this.hash = null
  this.relativePath = this._getRelativePath.bind(this)
  this.data = null
  this.metadata = null
  this.ready = false
}

AudioFile.prototype = Object.create(Nanobus.prototype)

AudioFile.prototype._getRelativePath = function () {
  return RelativePath.from(this.hash)
}

AudioFile.prototype.load = function () {
  var readStream = fs.createReadStream(this._file.path)

  if (this._file.extension !== '.mp3') {
    var err = new Error('Sorry, Vibedrive only supports the mp3 format.')
    err.code = 'unsupported'
    this.emit('error', err)
    return
  }

  mm.parseStream(readStream, 'audio/mpeg', { duration: true, fileSize: this._file.size })
    .then(metadata => {
      this.metadata = metadata
    })

  var writeStream = concat(data => {
    this.hash = multihash(data)
    this.data = data
    this.ready = true
    this.emit('load')
  })

  readStream.on('error', console.log)
  readStream.pipe(writeStream)
}

// generate self-describing hash from striped mp3, return that hash
function multihash (buf) {
  var hash = crypto.createHash('sha256').update(buf).digest()
  var multihash = multihashes.encode(hash, 'sha2-256')

  return multihashes.toB58String(multihash)
}
