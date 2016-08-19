/**
 * Created by dcastane on 18/07/16.
 */
"use strict";

var express = require('express');
var path = require('path');
var config = require(path.resolve('./config/config'));
var later = require('later');
var moment = require('moment-timezone');

var reqAgent = require('superagent');
var Q = require('q');


var isInteger = function(val) {
    if (Number.isInteger(val)) {
        return true;
    }
    if (NaN === Number.parseInt(val)) {
        return false;
    }
    return true;
};

var isNumber = function(val) {
    if (NaN === Number.parseFloat(val)) {
        return false;
    }
    return true; // FIXME using a RegExp - this will return true for things like 3.14kskhsu as it parses to 3.14
};

var isString = function(val) {
    return 'string' === typeof val;
};
var isObject = function(val) {
    return 'object' === typeof val;
};

var isFunction = function(fun) {
    return 'function' === typeof fun;
};


var isValue = function(val) {
    if ((null !== val) && (NaN !== val) && (undefined !== val)) {
        return true;
    }

    return false;
}

/*
var roundMinutes = function(date) {

    var returnDate = new Date(date.getTime());

    var min = date.getMinutes();
    var hr = date.getHours();



    if ((min < 30)&&(min > 0)){

        min = 30;
    }else if (min > 30){

    }// other cases exatly 0 and exactly 30 remain the same



    date.setHours(date.getHours() + Math.round(date.getMinutes()/60));
    date.setMinutes(0);

    return returnDate;
}
*/

function Recurrent(app, opt) {
    this.app = app;
    this.options = opt;
    this.runningSchedule = null;

    if ((undefined === opt) || (null === opt)) {
        this.options = config;
    }

    this.serializer = null;
    this.logger = console.log;

    Recurrent.prototype.validatePutScheduleInput = function(input) {


        if (!isString(input.notificationId)) {
            return 'Invalid notificationId, MUST be a string';
        }

        if (!moment(input.expires).isValid()) {
            return 'Invalid expiration date format, MUST be parseable by the momentjs library';
        }



        if (!isString(input.triggerUrl)) {
            return 'Invalid triggerUrl, MUST be a URL';
        } else {

            /*
            // TODO FIXME this RegExp filters more than we want
            var expression = '/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/';
            var regex = new RegExp(expression);

            if (input.triggerUrl.match(regex) )
            {
                // ok
            } else {
                return 'INVALID triggerUrl, MUST conform to RegExp: ' + expression;
            }
            */
        }

        //['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'CONNECT', 'TRACE', 'HEAD'];
        var supportedHttpMethods = ['POST', 'PUT'];

        if (!isString(input.triggerMethod)) {
            return 'Invalid triggerMethod, only PUT and POST are supported at this time';
        }

        var foundIt = false;

        input.triggerMethod = input.triggerMethod.trim().toUpperCase();

        for (var i = 0; i < supportedHttpMethods.length; i++) {
            if (supportedHttpMethods[i] === input.triggerMethod) {
                foundIt = true;
                break;
            }
        }
        if (false === foundIt) {
            return 'Invalid triggerMethod, MUST be a valid HTTP method: GET, POST, PUT, DELETE, etc';
        }

        for (var i = 0; i < input.triggerMoments.length; i++) {

            if (!moment(input.triggerMoments[i]).isValid()) {
                return 'Invalid triggerMoment: ' + input.triggerMoments[i] + ' MUST be parseable date by momentjs library';
            }
        }

        if (true === input.isRecurring) {
            if (typeof input.recurrent === 'object') {
                // TODO validate time zone string
                // TODO validate expressionFormat
                // TODO validate expression

            } else {
                return 'When isRecurring is true, recurrent object MUST be provided';
            }
        }


        /*
                "notificationId": "978b6640-4f1d-11e6-a21f-876bcc4591e0",
                    "notificationType": "EVENT_REMINDER",
                    "notificationName": "Invitación desfile de modas",
                    "expires": "2016-09-30T23:59:59-05:00",
                    "triggerUrl": "http://localhost:3399/api/v1/schedules",
                    "triggerMethod": "PUT",
                    "triggerHeaders": {"Content-Type":"application/json"},
                    "triggerMoments": [
                    "2016-06-29T17:00:00-05:00",
                    "2016-06-30T17:00:00-05:00"
                ],
                    "isRecurring": true,
                    "recurrent": {
                    "expressionFormat": "TEXT",
                        "expression": "every 1 mins",
                        "timeZone": "America/Rainy_River"
                },

          */

        return null; // null indicates OK (some string would return the error otherwise)

    }.bind(this);


    Recurrent.prototype.makeTriggerRecord = function(index, payload) {

        console.log('////////////////////////////////////////////////////');
        console.log('INDEX IS: ' + index);

        var m = moment(payload.triggerMoments[index]).tz('UTC').format();

        console.log('payload.triggerMoments: ' + payload.triggerMoments.toString());
        console.log('m is: ' + m);


        var newRec = {};
        newRec.notificationId = payload.notificationId;
        newRec.notificationType = payload.notificationType;
        newRec.triggerMoment = m;
        newRec.triggerUrl = payload.triggerUrl;
        newRec.triggerMethod = payload.triggerMethod;
        newRec.triggerHeaders = payload.triggerHeaders;
        newRec.status = 0; // 0-unprocessed, 1-processing, 2-sent
        newRec.data = payload.data;

        return newRec;

    }.bind(this);



    Recurrent.prototype.putSchedule = function(req, res, next) {

        this.logger('Entered Recurrent.putSchedule');

        var payload = req.body;
        var valid = this.validatePutScheduleInput(payload);


        if (valid === null) {
            // OK to continue (no error on JSON)
            this.logger('Received JSON: \n' + JSON.stringify(payload));

            // ensure we save onlyas UTC (so that we can easily find due ones
            payload.expires = moment(payload.expires).tz('UTC').format();

            payload.created = moment.tz('UTC').format();

            if (isObject(payload.options)) {
                if ((payload.options.saveMaster === false) || (payload.options.saveMaster === 'false')) {
                    console.log('NOT Saving Master order because header "recurrentjs_save-master" is set to "false"');
                } else {
                    console.log('Saving Master');
                    this.serializer.save(payload);

                }
            } else {
                console.log('Saving Master');
                this.serializer.save(payload);
            }

            var m = null;

            // do not allow to schedule things earlier than 2 minutes from now
            // otherwise likely they would not get processed


            var rightNow = moment.tz('UTC');

            var rightNowPlus2 = moment.tz(rightNow.format(), 'UTC');
            rightNowPlus2.minutes(rightNowPlus2.minutes() + 2);
            var nextSchedulerTime = null;

            var minToNextScheduler = 0;

            if (rightNow.minutes() >= 30) {
                // second period

                minToNextScheduler = 60 - rightNow.minutes();
                nextSchedulerTime = moment.tz(rightNow.format(), 'UTC');
                nextSchedulerTime.seconds(0);
                nextSchedulerTime.milliseconds(0);
                nextSchedulerTime.minutes(nextSchedulerTime.minutes() + minToNextScheduler);

            } else {
                // first period
                minToNextScheduler = 30 - rightNow.minutes();
                nextSchedulerTime = moment.tz(rightNow.format(), 'UTC');
                nextSchedulerTime.seconds(0);
                nextSchedulerTime.milliseconds(0);
                nextSchedulerTime.minutes(nextSchedulerTime.minutes() + minToNextScheduler);

            }

            var endTime = moment.tz(nextSchedulerTime.format(), 'UTC');
            endTime.minutes(endTime.minutes() - 1);

            var nextScheduler = nextSchedulerTime.format();
            this.logger('Current time _________ : ' + rightNow.format());
            this.logger('After 2 min __________ : ' + rightNowPlus2.format() + '  <--Soonest time to allow schedules is after this time');
            this.logger('Next scheduler runs at : ' + nextScheduler);

            // TODO CONTINUE HERE: Use chained promises to trigger a scheduler AFTER
            // all triggerMoments have been generated if and only if there is
            // at least 1 that needs to be processed between now and the time of the next scheduler
            // right now has a bug where it creates more than one


            //var q_saveTriggerMoment = Q.denodeify(this.serializer.saveTriggerMoment);

            var promise = null;
            var needToScheduleNow = false;



            console.log('nextScheduler    : ' + nextScheduler);

            for (var k = 0; k < payload.triggerMoments.length; k++) {

                m = moment(payload.triggerMoments[k]).tz('UTC').format();

                console.log('triggerMoment[' + k + ']:' + m);

                if (m < nextScheduler) {
                    console.log('There is at least ONE triggerMoment that needs to be triggered before the time the next scheduler starts');
                    needToScheduleNow = true;
                }
            }

            for (var i = 0; i < payload.triggerMoments.length; i++) {

                m = moment(payload.triggerMoments[i]).tz('UTC').format();

                if (m <= rightNowPlus2.format()) {
                    // too soon, ignore, we do not allow scheduling
                    // for the next 2 minutes
                    this.logger('WARNING: Scheduling of notifications older then 2 minutes ahead of the current time are not allowed');
                    this.logger('Current time is                  : ' + rightNow.format());
                    this.logger('Ignoring notification request for: ' + m);

                } else {

                    var newRec = this.makeTriggerRecord(
                        i,
                        payload);

                    if (null === promise) {
                        //console.log('PROCESSING REC: \n' + JSON.stringify(newRec));
                        //console.log('===========================================');

                        promise = this.serializer.q_saveTriggerMoment(newRec);
                    } else {
                        promise = promise.then(
                            this.serializer.q_saveTriggerMoment(newRec),
                            this.serializer.q_saveTriggerMoment(newRec)
                        );

                    }


                    /*
                    this.serializer.saveTriggerMoment(newRec, function(err, r){

                        var nr = newRec;
                        if (err){
                            this.logger('ERROR on inserting to Database: ' + JSON.stringify(err));
                        }else{
                            //this.logger('SAVED TO DATABASE: ' + JSON.stringify(nr));
                            var o = r.ops[0];
                            this.logger('SAVED TO DATABASE: ' + JSON.stringify(o));


                            //this.logger('nr.triggerMoment : ' + nr.triggerMoment);
                            this.logger('o.triggerMoment  : ' + o.triggerMoment);
                            this.logger('nextScheduler    : ' + nextScheduler);

                            //if (nr.triggerMoment < nextScheduler){
                            if (o.triggerMoment < nextScheduler){
                                this.logger('Request to send notification before next scheduler, process now');

                                this.scheduleCallbackBetween(rightNowPlus2, endTime);

                            }else{
                                this.logger('No need to process now, will be picked up by next scheduler');
                            }
                        }

                    }.bind(this));
                    */
                }
            } // end for
            if (null != promise) {
                promise.then(
                    function(r) {
                        console.log('COMPLETED SAVING triggerMoments to DATABASE');

                        if (needToScheduleNow === true) {
                            console.log('Launching scheduler now to handle triggerMoments that need to be triggered before the time the next scheduler starts');
                            this.scheduleCallbackBetween(rightNowPlus2, endTime);
                        } else {
                            console.log('No triggerMoments detected before first scheduler, no need to launch special scheduler now');
                        }
                    }.bind(this),
                    function(err3) {
                        console.log('Error saving triggerMoments to DATABASE: ' + JSON.stringify(err3));

                        if (needToScheduleNow === true) {
                            console.log('Launching scheduler now to handle triggerMoments that need to be triggered before the time the next scheduler starts');
                            this.scheduleCallbackBetween(rightNowPlus2, endTime);
                        } else {
                            console.log('No triggerMoments detected before first scheduler, no need to launch special scheduler now');
                        }

                    }.bind(this)
                )
            }


            res.status(200).send({
                message: 'OK'
            });

        } else {
            // some error ocurred
            this.logger('Error: ' + valid);

            res.status(400).send({
                message: 'ERROR'
            });
        }


    }.bind(this);

    Recurrent.prototype.getSchedule = function(req, res, next) {

        this.logger('Entered Recurrent.getSchedule');

        res.render('index', {
            title: 'Schedules'
        });

    }.bind(this);


    Recurrent.prototype.postTest = function(req, res, next) {

        var payload = req.body;
        this.logger('====== Entered POST Test ============================================');
        this.logger('Received JSON: \n' + JSON.stringify(payload));
        this.logger('====== About to respond and exit putTest ==========================');
        res.status(200).send({
            message: 'OK'
        });

    }.bind(this);

    Recurrent.prototype.putTest = function(req, res, next) {
        var payload = req.body;
        this.logger('====== Entered PUT Test ============================================');
        this.logger('Received JSON: \n' + JSON.stringify(payload));
        this.logger('====== About to respond and exit putTest ==========================');
        res.status(200).send({
            message: 'OK'
        });

    }.bind(this);


    Recurrent.prototype.createRouter = function() {

        this.logger('Entered Recurrent.createRouter');
        var router = express.Router();


        router.put('/schedules', this.putSchedule);
        router.get('/schedules', this.getSchedule);

        router.post('/test', this.postTest);
        router.put('/test', this.putTest);

        this.logger('Exited Recurrent.createRouter');
        return router;
    }.bind(this);



    Recurrent.prototype.init = function() {

        if (isFunction(this.options.logger)) {
            this.logger = this.options.logger;
        }

        this.logger('Entered Recurrent.init');

        var TheSerializer = null;
        if (isString(this.options.serializer.type)) {
            this.logger('Using MONGO serializer');
            TheSerializer = require(path.resolve('./config/serializers/' + this.options.serializer.type));
        } else {
            this.logger('Using FILE serializer');
            TheSerializer = require(path.resolve('./config/serializers/file'));
        }
        this.serializer = new TheSerializer(this.options);

        if (!isFunction(this.serializer.save)) {
            throw 'ERROR IN SERIALIZER';
        }

        var router = this.createRouter();

        app.use(this.options.apiPath, router);


        this.logger('Exited Recurrent.init');

    }.bind(this);

    Recurrent.prototype.doSendTrigger = function(triggerInfo) {
        var m = 'POST'; // default to post

        if (isString(triggerInfo.triggerMethod)) {
            m = triggerInfo.triggerMethod.trim().toUpperCase();
        } else {
            console.log('      No HTTP method specified, defaulting to POST');
        }

        var timeout = 1000; // default if not specified
        if (isNumber(triggerInfo.triggerTimeout)) {
            timeout = Number.parseInt(triggerInfo.triggerTimeout);
        }

        var cb = function(err, results) {
            if (err) {
                var errMsg = 'ERROR SENDING ' + triggerInfo.triggerMethod + ' NOTIFICATION to ' + triggerInfo.triggerUrl;
                if (isNumber(err.timeout)) {
                    errMsg = 'TIMEOUT WHILE TRYING TO SEND ' + triggerInfo.triggerMethod + ' NOTIFICATION to ' + triggerInfo.triggerUrl;
                    console.log('      ' + errMsg);
                    console.log('      REQUEST TIMED OUT AFTER ' + timeout + ' ms');
                    console.log('      ERROR: ' + JSON.stringify(err));

                    this.serializer.deleteAsFailedTriggerMoment(triggerInfo, {
                        message: toMsg
                    });

                } else {
                    console.log('      ' + errMsg);
                    console.log('      ERROR: ' + JSON.stringify(err));

                    this.serializer.deleteAsFailedTriggerMoment(triggerInfo, {
                        message: errMsg
                    });
                }



            } else {
                console.log('      SUCCESS SENDING ' + triggerInfo.triggerMethod + ' NOTIFICATION to ' + triggerInfo.triggerUrl);

                this.serializer.deleteAsSentTriggerMoment(triggerInfo);


            }

        }.bind(this);

        if ('PUT' === m) {
            console.log('      ===>PUT');

            var p = reqAgent.put(triggerInfo.triggerUrl);

            if ('object' === typeof triggerInfo.triggerHeaders) {
                for (var prop in triggerInfo.triggerHeaders) {
                    console.log('      Setting header "' + prop + '" to "' + triggerInfo.triggerHeaders[prop] + '"');
                    p = p.set(prop, triggerInfo.triggerHeaders[prop]);
                }
            } else {
                console.log('      triggerInfo.triggerHeaders is NOT an object');
            }

            if (timeout > 0) {
                console.log('      Setting timeout to: ' + timeout + 'ms');
                p = p.timeout(timeout);
            }
            p.send(triggerInfo.data)
                .end(cb);

        } else if ('POST' === m) {
            console.log('      ===>POST');

            var p = reqAgent.post(triggerInfo.triggerUrl);

            if ('object' === typeof triggerInfo.triggerHeaders) {
                for (var prop in triggerInfo.triggerHeaders) {
                    console.log('      Setting header "' + prop + '" to "' + triggerInfo.triggerHeaders[prop] + '"');
                    p = p.set(prop, triggerInfo.triggerHeaders[prop]);
                }
            } else {
                console.log('      triggerInfo.triggerHeaders is NOT an object');
            }

            if (timeout > 0) {
                console.log('Setting timeout to: ' + timeout + 'ms');

                p = p.timeout(timeout);
            }
            p.send(triggerInfo.data)
                .end(cb);


        } else {

            this.serializer.deleteAsFailedTriggerMoment(triggerInfo, {
                message: 'UNSUPPORTED HTTP METHOD: ' + triggerInfo.triggerMethod + '.  Only PUT and POST are supported at this time'
            });
        }

        console.log('      DONE Sending notification for notificationId: ' + triggerInfo.notificationId);



    }.bind(this);

    Recurrent.prototype.doTrigger = function(triggerInfo) {

        var currentUtc = moment.tz('UTC').format();

        console.log('=============ENTERED TO PROCESS doTrigger ==========================');

        console.log('Processing notification for notificationId: ' + triggerInfo.notificationId);


        var sched = null;
        var handle = null;
        later.date.UTC();
        var theMoment = null;

        var cb = function(theErr, doc, res) {
            if (theErr) {
                console.log('ERROR sending document: ' + JSON.stringify(doc) + '\nERROR: ' + JSON.stringify(theErr));
            } else {
                console.log('DOCUMENT SENT OK, response: ' + JSON.stringify(res));
            }
        };


        if (triggerInfo.triggerMoment <= currentUtc) {
            // already delayed, send immediately
            console.log('   Already delayed, execute immediately');
            console.log('   Should have executed at :' + triggerInfo.triggerMoment);
            console.log('   Executing at            :' + currentUtc);

            this.doSendTrigger(triggerInfo, cb);

        } else {
            // schedule

            theMoment = moment.tz(triggerInfo.triggerMoment, 'UTC');
            console.log('   Current time in UTC :' + currentUtc);
            console.log('   Should schedule for :' + triggerInfo.triggerMoment);
            console.log('   Will schedule for   :' + theMoment.format());
            sched = {
                schedules: [{
                    h: [theMoment.hours()],
                    m: [theMoment.minutes()],
                    s: [theMoment.seconds()]
                }]
            };


            handle = later.setTimeout(
                function() {
                    var curItem = triggerInfo;
                    this.doSendTrigger(curItem, cb);
                }.bind(this),
                sched);
        }

    }.bind(this);

    Recurrent.prototype.getScheduleTimeRange = function(time) {

        var startTime = moment.tz(time.format(), 'UTC');
        var min = startTime.get('minute');
        var endTime = moment.tz(startTime.format(), 'UTC');

        if (min >= 30) {
            // second half of the hour
            startTime.set('minute', 30);
            startTime.set('second', 0);
            startTime.set('millisecond', 0);

            endTime.set('minute', 59);
            endTime.set('second', 59);
            endTime.set('millisecond', 999);

        } else {
            // first half of the hour
            startTime.set('minute', 0);
            startTime.set('second', 0);
            startTime.set('millisecond', 0);

            endTime.set('minute', 29);
            endTime.set('second', 59);
            endTime.set('millisecond', 999);
        }
        return {
            startTime: startTime,
            endTime: endTime
        };
    }.bind(this);


    Recurrent.prototype.scheduleCallback = function(time) {
        var timeRange = this.getScheduleTimeRange(time);
        console.log('TIMERANGE: ', timeRange.startTime.format(), timeRange.endTime.format());
        this.scheduleCallbackBetween(timeRange.startTime, timeRange.endTime);
    }.bind(this);



    Recurrent.prototype.scheduleCallbackBetween = function(startTime, endTime) {
        console.log('Executing scheduler');

        // get triggerMoments due next half an hour
        this.serializer.checkoutTriggersBetween(startTime.format(), endTime.format(),
            function(err, results) {
                if (err) {
                    console.log('ERROR reading triggers' + JSON.stringify(err));
                } else {
                    console.log('CHECKOUT SUCCESSFUL, results:' + results.length + '\n' + JSON.stringify(results) + '\n================================\n');

                    for (var i = 0; i < results.length; i++) {
                        //console.log('DOCUMENT: \n' + JSON.stringify(results[i]) + '\n============================\n');

                        this.doTrigger(results[i],
                            function(e1, doc, res) {
                                if (e1) {
                                    console.log('ERROR sending document: ' + JSON.stringify(doc) + '\nERROR: ' + JSON.stringify(e1));
                                } else {
                                    console.log('DOCUMENT SENT OK, response: ' + JSON.stringify(res));
                                }
                            }
                        );

                    }


                }
            }.bind(this)
        );

        // iterate and send them


    }.bind(this);


    Recurrent.prototype.startSchedulingJob = function() {

        this.logger('Entered Recurrent.startSchedulingJob');

        if (this.runningSchedule) {
            try {
                this.runningSchedule.clear();
            } catch (e) {};
        }


        later.date.UTC();

        // then start the scheduler
        // schedule job to start at next half hour block

        var now = moment.tz('UTC');
        //var min = now.get('minute');


        var sched = null;
        sched = later.parse.recur().every(30).minute().startingOn(0);
        /*
        if (min >= 30) {
            // next schedule starts at 0 minutes mark
            sched = later.parse.recur().every(30).minute().startingOn(0);
        } else {
            // next schedule starts at 30 minutes mark
            sched = later.parse.recur().every(30).minute().startingOn(30);
        }
        */

        this.runningSchedule = later.setInterval(function() {
            var time = moment.tz('UTC').add(30, 'second').startOf('minute');
            this.scheduleCallback(time);
        }.bind(this), sched);

        // Do the first run immediately
        this.scheduleCallback(now);

        this.logger('Scheduler started OK');

    }.bind(this);

    this.init();


};

module.exports = Recurrent;
