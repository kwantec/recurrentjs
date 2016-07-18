/**
 * Created by dcastane on 18/07/16.
 */
'use strict';

/*
var _ = require('lodash'),
    //chalk = require('chalk'),
    //glob = require('glob'),
    path = require('path');
*/


var sampleLogger = function(msg){
    console.log(msg);
}

function initConfig()
{

    var theConfig = {
        apiPath: '/api/v1',
        serializer: 'mongo',
        logger: sampleLogger
    };

    return theConfig;

};


module.exports = initConfig();