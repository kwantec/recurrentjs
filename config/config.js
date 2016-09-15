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


var sampleLogger = function(msg) {
    console.log(msg);
}

function initConfig() {

    var theConfig = {
        apiPath: '/api/v1',
        serializer: {
            type: 'mongo',
            config: {
                //dburl: process.env.RJS_DATABASE || 'mongodb://127.0.0.1/recurrentdb',
                dburl: 'mongodb://' + process.env.MONGO_USER + ':' + process.env.MONGO_PASS + '@' +
                    process.env.DB_1_PORT_27017_TCP_ADDR + ',' +
                    process.env.DB_1_PORT_27018_TCP_ADDR + ',' +
                    process.env.DB_2_PORT_27017_TCP_ADDR +
                    '/recurrentdb?replicaSet=rs0',
                ordersCollection: process.env.RJS_COLLECTION_ORDERS || 'orders',
                scheduledCollection: process.env.RJS_COLLECTION_SCHEDULED || 'scheduled',
                recurringCollection: process.env.RJS_COLLECTION_TRIGGERS || 'recurring',
                saveSent: false,
                sentCollection: process.env.RJS_COLLECTION_SENT || 'sentNotifications',
                saveFailedSent: false,
                failedCollection: process.env.RJS_COLLECTION_FAILED || 'failedNotifications'
            }
        },
        logger: sampleLogger
    };

    return theConfig;

};


module.exports = initConfig();
