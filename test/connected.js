/* daemon connects to the api */

// var test = require('tape')

// test('there are non uploaded files: upload files', t => {
//   t.plan(1)

//   // log in
//   // lib tries uploading the file (through a stub)
//   // stub returns unexpected result
//   // lib continues trying to upload the file
//   // stub returns expected result
//   // status of track has changed somehow
//   // maybe track contains list of uploaded track ids

//   t.equal(uploadedFile.name, fileName, 'file is on the server')
//   t.end()

//   tracks.filter(keepNotUploaded)

//   function keepNotUploaded (track) {
//     return track.files.reduce()
//   }

//   function  (notUploaded) {
//     var filepath = notUploaded.filepath
//     var file = File.load(filepath)
//     try {
//       var uploadedFile = await upload(file)
//     } catch (err) {
//       t.fail('failed to upload file', err)
//     }
//     t.equal(uploadedFile.name, fileName, 'file is on the server')
//     t.end()
//   }
// })

// test('a synced playlist is missing files: download files', t => {
//   t.fail('all files are available locally')
//   t.fail('index of files lists those files')
//   t.end()
// })
