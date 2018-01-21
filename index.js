if (!['production'].includes(process.env.NODE_ENV)) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

var App = require('./lib/Daemon')

if (require.main === module) {
  var vibedrive = require('vibedrive-sdk')
  var yaml = require('js-yaml')
  var fs = require('fs')
  var path = require('path')

  const appConfig = yaml.safeLoad(fs.readFileSync(path.join(__dirname, 'config.yaml')))

  App(vibedrive, appConfig)
} else {
  module.exports = App
}
