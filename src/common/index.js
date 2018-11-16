
module.exports = function  (app, option) {
  return function (req,res,next) {
    app.get('/proxy-api/get/disabledOption',function (req,res,next) {
      res.send(option.disabled || []);
    });

    next()
  }
}
