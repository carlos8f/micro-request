var querystring = require('querystring')
  , url = require('url')

var protocols = {
  'http:': require('http'),
  'https:': require('https')
}

var methods = [
  'get',
  'post',
  'put',
  'head',
  'delete',
  'options',
  'trace',
  'copy',
  'lock',
  'mkcol',
  'move',
  'purge',
  'propfind',
  'proppatch',
  'unlock',
  'report',
  'mkactivity',
  'checkout',
  'merge',
  'm-search',
  'notify',
  'subscribe',
  'unsubscribe',
  'patch',
  'search',
  'connect'
]

function request (url, options, cb) {
  var parsedUrl = url.parse(url)
  if (typeof options === 'function') {
    cb = options
    options = {}
  }
  options || (options = {})
  options.method = (options.method || 'GET').toUpperCase()
  options.protocol || (options.protocol = parsedUrl.protocol || 'http:')
  options.hostname || (options.hostname = parsedUrl.hostname)
  options.port || (options.port = parsedUrl.protocol === 'https:' ? 443 : 80)
  options.path || (options.path = parsedUrl.path)
  options.headers || (options.headers = {})
  var data
  if (options.data) {
    if (typeof options.data === 'object') {
      data = JSON.stringify(options.data)
      options.headers['content-type'] = 'application/json; charset=utf-8'
    }
    else data = options.data
  }
  options.headers['content-length'] || (options.headers['content-length'] = Buffer(data).length)
  var req = protocols[options.protocol].request(options, function (res) {
    if (errored) return
    if (options.stream) {
      return cb(null, res)
    }
    var chunks = []
    res.once('error', function (err) {
      if (errored) return
      errored = true
      cb(err)
    })
    res.on('data', function (chunk) {
      return chunks.push(chunk)
    })
    res.once('end', function () {
      if (errored) return
      var body
      var buf = Buffer.concat(chunks)
      if (res.headers['content-type'] && res.headers['content-type'].match(/^text\/|^application\/json/)) {
        body = buf.toString('utf8')
      }
      else body = buf
      if (res.headers['content-type'] && res.headers['content-type'].match(/^(text\/json|application\/json)/)) {
        try {
          body = JSON.parse(body)
        }
        catch (e) {
          errored = true
          return cb(e, res, body)
        }
      }
      cb(null, res, body)
    }
  })
  var errored = false
  req.once('error', function (err) {
    if (errored) return
    errored = true
    cb(err)
  })
  if (options.data && options.data && options.data.pipe) {
    // input stream
    return options.data.pipe(req)
  }
  
  req.end()
  return req
}

module.exports = request

methods.forEach(function (method) {
  module.exports[method] = function (url, options, cb) {
    if (typeof options === 'callback') {
      cb = options
      options = {}
    }
    options || (options = {})
    options.method = method
    return request(url, options, cb)
  }
})