var request = require('./')
  , fs = require('fs')
  , rimraf = require('rimraf')
  , crypto = require('crypto')
  , path = require('path')
  , assert = require('assert')

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
})