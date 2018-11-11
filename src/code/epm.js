var {parseUrlToName} = require('../util/fun')
var fs=require('fs');
const mockPath = './mockData'

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

Emp.prototype.getMockData = function () {
    const data = fs.readFileSync(`${mockPath}/${parseUrlToName(path)}.json`)
    return JSON.parse(data.toString())
}

Emp.prototype.setMockData = function (path) {
    const mockData = this.getMockData(path)
}




module.exports = Emp
