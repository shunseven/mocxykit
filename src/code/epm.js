var {parseUrlToName} = require('../util/fun')
var fs=require('fs');
const {mockPath, deleteMock} = require('../mock/mockFun')
const isEqual = require('lodash/isEqual')

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

Emp.prototype.setMockData = function (mockData, cover) {
    const path = mockData.url
    const name = parseUrlToName(path)
    var stat=fs.existsSync(`${mockPath}/${name}.json`);
    if (!Array.isArray(mockData.data)) {
        mockData.data.name = mockData.data.name || '请求参数'
        mockData.data = [mockData.data]
    }
    mockData.mock = mockData.mock || true
    if (!stat || cover) {
        if (!mockData.requestData) mockData.requestData = {}
        if (!mockData.responseData) mockData.responseData = {}
        fs.writeFileSync(`${mockPath}/${name}.json`, JSON.stringify(mockData, null, 2))
    } else {
        const localMockData = this.getMockData(path)
        mockData.data.forEach(data => {
            const index = localMockData.data.findIndex(item => isEqual(item.requestData, data.requestData))
            if (!data.requestData) data.requestData = {}
            if (!data.responseData) data.responseData = {}
            data.name = data.name || '请求参数'
            if (index === -1) {
                localMockData.data.push(data)
            } else {
                localMockData.data[index] = data
            }
        })
        fs.writeFileSync(`${mockPath}/${name}.json`, JSON.stringify(localMockData, null, 2))
    }
}

Emp.prototype.deleteMockData = function (option) {
    if (typeof option === 'string') {
        option = {
            url: option
        }
    }
    if (!option.requestData) {
        return deleteMock(option)
    }
    const mockData = this.getMockData(option.url)
    const index = mockData.data.findIndex(item => isEqual(item.requestData , option.requestData))
    if (index === -1 ) return console.log('没有可删除数据')
    mockData.data.splice(index, 1)
    this.setMockData(mockData, true)
    return mockData
    console.log('数据删除成功')
}



module.exports = Emp
