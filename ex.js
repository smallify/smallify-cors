const Smallify = require('smallify')
const smallifyCors = require('./index')

const smallify = Smallify({
  pino: {
    level: 'info',
    prettyPrint: true
  }
})

smallify.register(smallifyCors, {
  origin: 'localhost',
  credentials: true,
  methods: ['GET']
  // headers: ['content-type', 'content-length']
})

smallify.route({
  url: '/',
  method: 'GET',
  handler (req, rep) {
    rep.send('hello world')
  }
})

smallify.ready(err => {
  err && smallify.$log.error(err)
  smallify.print()
})
