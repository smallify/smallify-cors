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

    const rOrigin = req.headers.origin
    const origin = opts.origin || '*'
    const credentials = opts.credentials || false
    const exposedHeaders = opts.exposedHeaders

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

    if (credentials === true) {
      rep.setHeader('Access-Control-Allow-Credentials', true)
    }

    if (exposedHeaders) {
      rep.setHeader('Access-Control-Expose-Headers', exposedHeaders.join(','))
    }

    if (method === optionsMethod) {
      const methods = opts.methods
      const headers = opts.headers
      const maxAge = opts.maxAge

      if (methods) {
        rep.setHeader('Access-Control-Allow-Methods', methods.join(','))
      }

      let accessHeaders
      if (!headers) {
        accessHeaders = req.headers['access-control-request-headers']
        vary(rep, 'Access-Control-Request-Headers')
      } else if (headers.join) {
        accessHeaders = headers.join(',')
      }

      if (accessHeaders && accessHeaders.length) {
        rep.setHeader('Access-Control-Allow-Headers', accessHeaders)
      }

      if (maxAge) {
        rep.setHeader('Access-Control-Max-Age', maxAge + '')
      }
    }
  })
}
