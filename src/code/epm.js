var {parseUrlToName} = require('../util/fun')
var fs=require('fs');
const {mockPath, getMock} = require('../mock/mockFun')

function  Emp(req, res, next, data) {
    this.requestData = data
    this.req = req
    this.res = res
    this.next = function () {
        next()
    }
}

Emp.prototype.send = function (...ary) {
    this.res.send(...ary)
}

Emp.prototype.getMockData = function (path) {
    const data = fs.readFileSync(`${mockPath}/${parseUrlToName(path)}.json`)
    return JSON.parse(data.toString())
}

Emp.prototype.setMockData = function (path) {

}




module.exports = Emp
