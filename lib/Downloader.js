var concat = require('concat-stream')
var Nanobus = require('nanobus')

module.exports = Downloader

function Downloader (service) {
  if (!(this instanceof Downloader)) return new Downloader(service)
  Nanobus.call(this)

  this.service = service
  this.downloads = []
}

Downloader.prototype = Object.create(Nanobus.prototype)

Downloader.prototype.add = function (fileHash) {
  var readStream = this.service.download(fileHash)
  var download = DownloadProcess(readStream)

  download.on('progress', () => {

  })

  download.on('finish', () => {

  })

  download.on('error', () => {

  })

  this.downloads.push(download)
}

function DownloadProcess (readStream) {
  if (!(this instanceof DownloadProcess)) return new DownloadProcess()
  Nanobus.call(this)

  this.data = null
  this.progress = 0

  this.readStream = readStream
  this.writeStream = concat(data => {
    this.data = data
    this.emit('finish')
  })
}

DownloadProcess.prototype = Object.create(Nanobus.prototype)

DownloadProcess.prototype.start = function () {
  this.readStream.pipe(this.writeStream)
}
