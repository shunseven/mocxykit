var fs=require('fs');

function getItemProxy() {
  var stat=fs.existsSync('./itemProxy.json');
  var itemProxy=stat?JSON.parse(fs.readFileSync('./itemProxy.json')): '[]';
  return itemProxy;
}

module.exports = {
  getItemProxy
}
