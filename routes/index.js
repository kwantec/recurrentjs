var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/notifications', function(req, res, next) {
  res.render('notifications', {});
});


module.exports = router;
