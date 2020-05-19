
module.exports = function  (app, option) {
  return function () {
    app.get('/proxy-api/get/disabledOption',function (req,res,next) {
      res.send(option.disabled || []);
    });
  }
}
