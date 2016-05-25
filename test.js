var request = require('./')
  , fs = require('fs')
  , rimraf = require('rimraf')
  , crypto = require('crypto')
  , path = require('path')
  , assert = require('assert')
  , http = require('http')

var tmpDir = path.join(require('os').tmpDir(), Math.random().toString(36).slice(2))

describe('test', function () {
  var p = path.join(tmpDir, 'alice.jpg')
  before(function () {
    fs.mkdirSync(tmpDir)
    if (!process.env.DEBUG) {
      process.on('exit', function () {
        rimraf.sync(tmpDir)
      })
    }
    else console.log('tmpDir', tmpDir)
  })
  it('streams fixture', function (done) {
    var uri = 'https://raw.githubusercontent.com/carlos8f/node-buffet/master/test/files/folder/Alice-white-rabbit.jpg'
    var options = {stream: true}
    request(uri, options, function (err, resp, body) {
      assert.ifError(err)
      assert.equal(resp.statusCode, 200)
      body
        .pipe(fs.createWriteStream(p))
        .on('finish', done)
    })
  })
  it('read stream fixture', function (done) {
    fs.createReadStream(p)
      .pipe(crypto.createHash('sha1'))
      .on('data', function (data) {
        assert.equal(data.toString('hex'), '2bce2ffc40e0d90afe577a76db5db4290c48ddf4')
        done()
      })
  })
  it('get (txt)', function (done) {
    request('https://www.apple.com/robots.txt', function (err, resp, body) {
      assert.ifError(err)
      assert.equal(resp.statusCode, 200)
      assert(body.match(/sentryx/))
      done()
    })
  })
  it('get (json)', function (done) {
    var uri = 'https://rawgit.com/carlos8f/7ccf6b5333f83704ff7cb967578172d3/raw/c6f7bbd6d38562606be949c17696ac6817693d33/test.json'
    request(uri, function (err, resp, body) {
      assert.ifError(err)
      assert.equal(resp.statusCode, 200)
      assert(body.ok)
      done()
    })
  })
  it('post (json)', function (done) {
    var server = http.createServer()
    server.on('request', function (req, res) {
      assert.equal(req.url, '/posts')
      assert.equal(req.method, 'POST')
      assert.equal(req.headers['content-type'], 'application/json; charset=utf-8')
      var chunks = []
      req.on('data', function (chunk) {
        chunks.push(chunk)
      })
      req.once('end', function () {
        var body = Buffer.concat(chunks).toString('utf8')
        var data = JSON.parse(body)
        assert(data.cool)
        res.writeHead(200, {'content-type': 'application/json'})
        res.end('{"ok":true}')
      })
    })
    server.listen(function () {
      var port = server.address().port
      var uri = 'http://localhost:' + port + '/posts'
      request.post(uri, {data: {cool: true}}, function (err, resp, body) {
        assert.ifError(err)
        assert.equal(resp.statusCode, 200)
        assert(body.ok)
        done()
      })
    })
  })
})