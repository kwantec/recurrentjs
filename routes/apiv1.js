var express = require('express');
var router = express.Router();

path = require('path');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('apiv1', { title: 'Hello API V1' });
});

router.get('/schedules', function(req, res, next) {
    res.render('apiv1', { title: 'Schedules' });
});

router.put('/schedules', function(req, res, next) {




    res.render('apiv1', { title: 'Schedules' });
});



module.exports = router;