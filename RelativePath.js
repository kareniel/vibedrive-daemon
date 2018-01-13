var path = require('path')
var assert = require('assert')

module.exports = RelativePath

function RelativePath () {
  if (!(this instanceof RelativePath)) return new RelativePath()
}

RelativePath.from = function (hash = '') {
  assert.ok(typeof hash, 'string')

  var hashArr = hash.split('')
  var dir = '/'

  // dir = '/', then 3x2 bytes joined by '/', followed by the rest of the bytes
  for (let i = 0; i < 4; i++) {
    var part = hashArr.shift() + hashArr.shift()
    dir = path.join(dir, part)
  }

  return path.join(dir, hashArr.join(''))
}
