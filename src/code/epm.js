var {parseUrlToName} = require('../util/fun')
var fs=require('fs');
const mockPath = './mockData'

module.exports = {
  getMockData (path) {
    const data = fs.readFileSync(`${mockPath}/${parseUrlToName(path)}.json`)
    return JSON.parse(data.toString())
  },
  setMockData () {
    console.log('isSet')
  },
  requestData: {
  }
}
