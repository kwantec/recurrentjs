/**
 * Created by dcastane on 18/07/16.
 */
'use strict';

var app = require('./app.js')
var port = process.env.RJS_PORT || 3399;

function startServer() {
    app.listen(port);
}

startServer();
