var test = require('tape')
var folderStructureFromHash = require('../folder-structure')

test('folderStructureFromHash', function (t) {
  var hash = 'QmYtd9LqAPKcQcsioXESBKgd7jxCZNrsvDSRx1C5THKHjX'
  var folderStructure = folderStructureFromHash(hash)
  var expected = '/Qm/Yt/d9/Lq/APKcQcsioXESBKgd7jxCZNrsvDSRx1C5THKHjX'
  t.equal(folderStructure, expected, 'returns expected string')
  t.end()
})
