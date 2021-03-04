const vary = require('vary')

function isString (s) {
  return typeof s === 'string' || s instanceof String
}

function isOriginAllowed (origin, allowedOrigin) {
  if (Array.isArray(allowedOrigin)) {
    for (let i = 0; i < allowedOrigin.length; ++i) {
      if (isOriginAllowed(origin, allowedOrigin[i])) {
        return true
      }
    }
    return false
  } else if (isString(allowedOrigin)) {
    return origin === allowedOrigin
  } else if (allowedOrigin instanceof RegExp) {
    return allowedOrigin.test(origin)
  } else {
    return !!allowedOrigin
  }
}

function configureOrigin (opts, req, rep) {
  const rOrigin = req.headers.origin
  const origin = opts.origin || '*'

  if (origin === '*') {
    rep.setHeader('Access-Control-Allow-Origin', '*')
  } else if (isString(origin)) {
    rep.setHeader('Access-Control-Allow-Origin', origin)
    vary(rep, 'Origin')
  } else {
    const isAllowed = isOriginAllowed(rOrigin, origin)
    rep.setHeader('Access-Control-Allow-Origin', isAllowed ? rOrigin : false)
    vary(rep, 'Origin')
  }
}

function configureCredentials (opts, req, rep) {
  const credentials = opts.credentials || false
  if (credentials === true) {
    rep.setHeader('Access-Control-Allow-Credentials', true)
  }
}

function configureExposedHeaders (opts, req, rep) {
  let exposedHeaders = opts.exposedHeaders
  if (exposedHeaders && exposedHeaders.join) {
    exposedHeaders = exposedHeaders.join(',')
    rep.setHeader('Access-Control-Expose-Headers', exposedHeaders)
  }
}

module.exports = async function (smallify, opts) {
  const { $root } = smallify
  const optionsMethod = 'OPTIONS'

  $root.addHook('onRoute', function (route) {
    const { url, method } = route
    if (method !== optionsMethod) {
      smallify.route({
        url,
        method: optionsMethod,
        handler (req, rep) {
          rep.header('Content-Length', 0).code(204)
        }
      })
    }
  })

  $root.addHook('onResponse', function (req, rep) {
    const { method } = this

    req = req.raw
    rep = rep.raw

    configureOrigin.call(this, opts, req, rep)
    configureCredentials.call(this, opts, req, rep)
    configureExposedHeaders.call(this, opts, req, rep)

    if (method === optionsMethod) {
      let methods = opts.methods || []
      if (methods.join) {
        methods = methods.join(',')
      }
      rep.setHeader('Access-Control-Allow-Methods', methods)

      let headers = opts.headers
      if (!headers) {
        headers = req.headers['access-control-request-headers']
        vary(rep, 'Access-Control-Request-Headers')
      } else if (headers.join) {
        headers = headers.join(',')
      }
      if (headers && headers.length) {
        rep.setHeader('Access-Control-Allow-Headers', headers)
      }

      const maxAge = opts.maxAge
      if (maxAge) {
        rep.setHeader('Access-Control-Max-Age', maxAge + '')
      }
    }
  })
}
