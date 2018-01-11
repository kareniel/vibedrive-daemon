if (!['production'].includes(process.env.NODE_ENV)) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

global.window = {
  localStorage: {
    getItem: () => {},
    setItem: () => {}
  }
}

var os = require('os')
var fs = require('fs')
var path = require('path')
var yaml = require('js-yaml')
var mv = require('mv')
var mkdirp = require('mkdirp')
var vibedrive = require('vibedrive-sdk')
var Folder = require('managed-folder')
var AudioFile = require('./AudioFile')
var folderStructureFromHash = require('./folder-structure')

main()

async function main () {
  try {
    var config = yaml.safeLoad(fs.readFileSync(path.join(__dirname, 'config.yaml')))

    await vibedrive.auth.login(config.user.username, config.user.password)

    var folder = Folder({
      appdir: path.join(os.homedir(), 'Vibedrive'),
      subfolders: {
        inbox: 'Inbox',
        library: 'Library'
      }
    })

    folder.on('ready', function () {
      console.log('ready')

      folder.on('inbox:add', function (filepath) {
        console.log('file added to inbox folder:', filepath)

        var audioFile = AudioFile({
          name: path.basename(filepath),
          path: filepath,
          type: 'audio/mp3',
          size: fs.statSync(filepath).size
        })

        audioFile.on('loaded', async function () {
          try {
            await vibedrive.track.create(audioFile)
            console.log('track created')
            var filename = path.basename(filepath)

            await vibedrive.upload.upload(audioFile)
            console.log('file uploaded')

            var folderStructure = folderStructureFromHash(audioFile.hash)
            var destination = path.join(filepath, '../../', 'Library', folderStructure)

            mkdirp(destination, function (err) {
              if (err) { return console.log(err) }
              mv(filepath, path.join(destination, filename), function (err) {
                if (err) { return console.log(err) }
                // done
                console.log('moved the file.')
              })
            })
          } catch (err) {
            console.log('oops', err)
          }
        })

        audioFile.load()
      })
    })
  } catch (err) {
    console.log(err)
  }
}
