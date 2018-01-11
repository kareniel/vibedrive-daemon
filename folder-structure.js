var path = require('path')

module.exports = function folderStructureFromHash (str) {
  var arr = str.split('')
  var dir = '/'

  for (let i = 0; i < 4; i++) {
    var part = arr.shift() + arr.shift()
    dir = path.join(dir, part)
  }

  return path.join(dir, arr.join(''))
}
