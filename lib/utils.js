var mv = require('mv')

module.exports.move = function move (src, dest, i = 3) {
  mv(src, dest, { mkdirp: true }, function (err) {
    if (err && i > 1) { return move(src, dest, i - 1) }
  })
}

module.exports.er = function er (error) {
  if (error instanceof Error) return error.message

  try {
    var str = JSON.stringify(error, null, 2)
    return '\\' + str
  } catch (err) {
    return '\\' + error
  }
}
