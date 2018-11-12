const fs=require('fs');
const {parseUrlToName} = require('../util/fun')
const codePath = './mockCode'

function getMockCode() {
    const mockCode = {}
    if (!fs.existsSync(codePath)) {
        fs.mkdirSync(codePath);
    }
    const files=fs.readdirSync(codePath);
    if (files.length < 1) return mockCode
    files.forEach(filePath => {
        let data = fs.readFileSync(`${codePath}/${filePath}`)
        data = JSON.parse(data)
        const name = parseUrlToName(data.url)
        mockCode[name] = data
    })
    return mockCode;
}

function setMockCode(data) {
    var mocksCode=getMockCode();

    if (!fs.existsSync(codePath)) {
        fs.mkdirSync(codePath);
    }
    const name = parseUrlToName(data.url)
    mocksCode[name] = data
    fs.writeFileSync(`${codePath}/${name}.json`,JSON.stringify(data, null, 2));
    return mocksCode;
}

function setMockStatus(data) {
    var mocksCode=getMockCode();

    let checkedUrls = data.map(msg => msg.url)

    Object.keys(mocksCode).forEach(key => {
        if (checkedUrls.includes(mocksCode[key].url)) {
            mocksCode[key].mock = true
            fs.writeFileSync(`${codePath}/${key}.json`,JSON.stringify(mocksCode[key], null, 2))
        } else if (!checkedUrls.includes(mocksCode[key].url)){
            mocksCode[key].mock = false
            fs.writeFileSync(`${codePath}/${key}.json`,JSON.stringify(mocksCode[key], null, 2))
        }
    })

    return mocksCode;
}


function deleteMock(data) {
    let name = parseUrlToName(data.url)
    var mocksCode=getMockCode();
    fs.unlinkSync(`${codePath}/${name}.json`)
    delete mocksCode[name]
    return mocksCode;
}

module.exports = {
    getMockCode,
    setMockCode,
    setMockStatus,
    deleteMock
}
