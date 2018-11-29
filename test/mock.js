const assert = require('assert');
const axios = require('axios')
const request = require('supertest')
const app = require('../server')

describe('这是MOCK的功能测试', function() {
  describe('MOCK数据保存测试', function() {
    it('保存数据', function(done) {
      request(app)
        .post('/proxy-api/set/mock')
        .send({"data":[{"name":"请求参数1","requestData":{},"responseData":{"isOk":true}}],"url":"/unit/test","name":"mock保存数据测试"})
        .set('Accept', 'application/json')
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
          const {url, name, data} = res.body.UnitTest
          assert.equal('/unit/test', url, 'url 相等')
          assert.equal('mock保存数据测试', name, 'name 相等')
          assert.deepEqual([{"name":"请求参数1","requestData":{},"responseData":{"isOk":true}}], data, '数据相等')
          done();
        });
    });
  });
});