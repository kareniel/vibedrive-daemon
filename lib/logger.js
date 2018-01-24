var winston = require('winston')
var logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      level: process.env.NODE_ENV === 'test' ? 'error' : 'silly',
      format: winston.format.simple()
    })
  ]
})

module.exports = logger
