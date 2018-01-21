# vibedrive-daemon

this module is meant to be used either as a standalone terminal app (installed globally, I guess?)
or as a dependency of an Electron app.


##### Logging

Logging levels in winston conform to the severity ordering specified by RFC5424: severity of all levels is assumed to be numerically ascending from most important to least important.

```js
const levels = { 
  error: 0, 
  warn: 1, 
  info: 2, 
  verbose: 3, 
  debug: 4, 
  silly: 5 
}
```
