var sleep = require('hypno')
var logger = require('./logger')
var { er } = require('./utils')

/*
 *
 */
function Authenticator (service, config) {
  if (!(this instanceof Authenticator)) return new Authenticator(service, config)
  this.service = service
  this.username = config.user.username
  this.password = config.user.password
}

Authenticator.prototype.init = async function () {
  var loggingIn = true
  var attempt = 0

  while (loggingIn) {
    try {
      await this.service.login(this.username, this.password)
      logger.info(`Connected.`)
      loggingIn = false
    } catch (err) {
      logger.info(`Failed connecting. Attempt #${attempt}. ${er(err)}`)
      attempt++
      await sleep(15 * 1000) // ms
    }
  }
}

module.exports = Authenticator
