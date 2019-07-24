
define(function(require) {

  // load custom THREE modules
  require('./THREE/main')

  return {
    global: require('./global'),
    rooms: require('./rooms')
  }

})
