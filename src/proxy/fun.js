var fs=require('fs');
var url=require('url');
function getHost(){
  var stat=fs.existsSync('./proxy.json');
  var config=stat?JSON.parse(fs.readFileSync('./proxy.json')):'';
  return config;
}

function getProxies() {
  var stat=fs.existsSync('./proxies.json');
  var mock=stat?JSON.parse(fs.readFileSync('./proxies.json')):[];
  return mock;
}

function setProxies(data) {
  fs.writeFileSync('./proxies.json',JSON.stringify(data));
}

module.exports = {
  getHost,
  getProxies,
  setProxies
}