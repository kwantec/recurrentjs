/**
 * Created by dcastane on 18/07/16.
 */
'use strict';

var express = require('express');
var path = require('path');
var config = require(path.resolve('./config/config'));
var later = require('later');
var moment = require('moment-timezone');

var reqAgent = require('superagent');



var isInteger = function(val) {
    if (Number.isInteger(val))
    {
        return true;
    }
    if (NaN === Number.parseInt(val))
    {
        return false;
    }
    return true;
};

var isNumber = function(val){
    if (NaN === Number.parseFloat(val))
    {
        return false;
    }
    return true; // FIXME using a RegExp - this will return true for things like 3.14kskhsu as it parses to 3.14
};

var isString = function(val){
    return 'string' === typeof val;
};

var isFunction = function(fun) {
    return 'function' === typeof fun;
};


var isValue = function(val){
    if ((null !== val)&&(NaN !== val)&&(undefined !== val))
    {
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

function Recurrent(app, opt)
{
    this.app = app;
    this.options = opt;
    this.runningSchedule = null;

    if ((undefined === opt)||(null === opt))
    {
        this.options = config;
    }

    this.serializer = null;
    this.logger = console.log;

    Recurrent.prototype.validatePutScheduleInput = function(input){


        if (!isString(input.notificationId))
        {
            return 'Invalid notificationId, MUST be a string';
        }

        if (!moment(input.expires).isValid())
        {
            return 'Invalid expiration date format, MUST be parseable by the momentjs library';
        }



        if (!isString(input.triggerUrl))
        {
            return 'Invalid triggerUrl, MUST be a URL';
        }else{

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

        if (!isString(input.triggerMethod))
        {
            return 'Invalid triggerMethod, only PUT and POST are supported at this time';
        }

        var foundIt = false;

        input.triggerMethod = input.triggerMethod.trim().toUpperCase();

        for(var i = 0;i < supportedHttpMethods.length;i++){
            if (supportedHttpMethods[i] === input.triggerMethod)
            {
                foundIt = true;
                break;
            }
        }
        if (false === foundIt)
        {
            return 'Invalid triggerMethod, MUST be a valid HTTP method: GET, POST, PUT, DELETE, etc';
        }

        for(var i = 0;i < input.triggerMoments.length;i++){

            if (!moment(input.triggerMoments[i]).isValid())
            {
                return 'Invalid triggerMoment: ' + input.triggerMoments[i] + ' MUST be parseable date by momentjs library';
            }
        }

        if (true === input.isRecurring)
        {
            if (typeof input.recurrent === 'object')
            {
                // TODO validate time zone string
                // TODO validate expressionFormat
                // TODO validate expression

            }else{
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

        return null;// null indicates OK (some string would return the error otherwise)

    }.bind(this);



    Recurrent.prototype.putSchedule = function(req, res, next){

        this.logger('Entered Recurrent.putSchedule');

        var payload = req.body;
        var valid = this.validatePutScheduleInput(payload);


        if (valid === null)
        {
            // OK to continue (no error on JSON)
            this.logger('Received JSON: \n' + JSON.stringify(payload));

            // ensure we save onlyas UTC (so that we can easily find due ones
            payload.expires = moment(payload.expires).tz('UTC').format();

            this.serializer.save(payload);


            for(var i = 0;i < payload.triggerMoments.length;i++){

                var newRec = {};
                newRec.notificationId = payload.notificationId;
                newRec.notificationType = payload.notificationType;
                newRec.triggerMoment =  moment(payload.triggerMoments [i]).tz('UTC').format();
                newRec.triggerUrl = payload.triggerUrl;
                newRec.triggerMethod = payload.triggerMethod;
                newRec.status = 0; // 0-unprocessed, 1-processing, 2-sent
                newRec.data = payload.data;

                console.log('PROCESSING REC: \n' + JSON.stringify(newRec));
                console.log('===========================================');

                this.serializer.saveTriggerMoment(newRec);

            }

            res.status(200).send({message:'OK'});

        }else{
            // some error ocurred
            this.logger('Error: ' + valid);

            res.status(400).send({message:'ERROR'});
        }


    }.bind(this);

    Recurrent.prototype.getSchedule = function(req, res, next){

        this.logger('Entered Recurrent.getSchedule');

        res.render('index', { title: 'Schedules' });

    }.bind(this);


    Recurrent.prototype.postTest = function(req, res, next){

        var payload = req.body;
        this.logger('====== Entered POST Test ============================================');
        this.logger('Received JSON: \n' + JSON.stringify(payload));
        this.logger('====== About to respond and exit putTest ==========================');
        res.status(200).send({message:'OK'});

    }.bind(this);

    Recurrent.prototype.putTest = function(req, res, next){
        var payload = req.body;
        this.logger('====== Entered PUT Test ============================================');
        this.logger('Received JSON: \n' + JSON.stringify(payload));
        this.logger('====== About to respond and exit putTest ==========================');
        res.status(200).send({message:'OK'});

    }.bind(this);


    Recurrent.prototype.createRouter = function(){

        this.logger('Entered Recurrent.createRouter');
        var router = express.Router();


        router.put('/schedules', this.putSchedule);
        router.get('/schedules', this.getSchedule);

        router.post('/test', this.postTest);
        router.put('/test', this.putTest);

        this.logger('Exited Recurrent.createRouter');
        return router;
    }.bind(this);



    Recurrent.prototype.init = function(){

        if (isFunction(this.options.logger))
        {
            this.logger = this.options.logger;
        }

        this.logger('Entered Recurrent.init');

        var TheSerializer = null;
        if (isString(this.options.serializer.type))
        {
            this.logger('Using MONGO serializer');
            TheSerializer = require(path.resolve('./config/serializers/' + this.options.serializer.type));
        }else{
            this.logger('Using FILE serializer');
            TheSerializer = require(path.resolve('./config/serializers/file'));
        }
        this.serializer = new TheSerializer(this.options);

        if (!isFunction(this.serializer.save))
        {
            throw 'ERROR IN SERIALIZER';
        }

        var router = this.createRouter();
        
        app.use(this.options.apiPath , router);


        this.logger('Exited Recurrent.init');

    }.bind(this);

    Recurrent.prototype.doTrigger = function(triggerInfo){

        console.log('=============ENTERED TO PROCESS doTrigger ==========================');
        console.log(JSON.stringify(triggerInfo));


        var m = 'POST';// default to post

        if (isString(triggerInfo.triggerMethod))
        {
            m = triggerInfo.triggerMethod.trim().toUpperCase();
        }else{
            console.log('No HTTP method specified, defaulting to POST');
        }

        var timeout = 1000;// default if not specified
        if (isNumber(triggerInfo.triggerTimeout))
        {
            timeout = Number.parseInt(triggerInfo.triggerTimeout);
        }

        var cb = function(err, results){
            if (err)
            {
                if (isNumber(err.timeout))
                {
                    console.log('FAILED TO GET RESPONSE AFTER SENDING '+ triggerInfo.triggerMethod +' NOTIFICATION to ' + triggerInfo.triggerUrl);
                    console.log('REQUEST TIMED OUT AFTER ' + timeout + ' ms');
                    console.log('ERROR: ' + JSON.stringify(err));
                }else{
                    console.log('ERROR SENDING '+ triggerInfo.triggerMethod +' NOTIFICATION to ' + triggerInfo.triggerUrl);
                    console.log('ERROR: ' + JSON.stringify(err));
                }

            }else{
                console.log('SUCCESS SENDING '+ triggerInfo.triggerMethod +' NOTIFICATION to ' + triggerInfo.triggerUrl);

            }

        };

        if ('PUT' ===  m){
            console.log('===>PUT');

            var p = reqAgent.put(triggerInfo.triggerUrl);

            if ('object' === typeof triggerInfo.triggerHeaders )
            {
                for(var prop in triggerInfo.triggerHeaders)
                {
                    console.log('Setting header "' + prop + '" to "' + triggerInfo.triggerHeaders[prop] + '"');
                    p = p.set(prop, triggerInfo.triggerHeaders[prop]);
                }
            }else{
                console.log('triggerInfo.triggerHeaders is NOT an object');
            }

            if (timeout > 0){
                console.log('Setting timeout to: ' + timeout + 'ms');
                p = p.timeout(timeout);
            }
            p.send(triggerInfo.data)
                .end(cb);

        }else if ('POST' ===  m){
            console.log('===>POST');

            var p = reqAgent.post(triggerInfo.triggerUrl);

            if ('object' === typeof triggerInfo.triggerHeaders )
            {
                for(var prop in triggerInfo.triggerHeaders)
                {
                    console.log('Setting header "' + prop + '" to "' + triggerInfo.triggerHeaders[prop] + '"');
                    p = p.set(prop, triggerInfo.triggerHeaders[prop]);
                }
            }else{
                console.log('triggerInfo.triggerHeaders is NOT an object');
            }

            if (timeout > 0){
                console.log('Setting timeout to: ' + timeout + 'ms');

                p = p.timeout(timeout);
            }
            p.send(triggerInfo.data)
                .end(cb);


        }else {
            console.log('UNSUPPORTED HTTP METHOD: ' + triggerInfo.triggerMethod + '.  Only PUT and POST are supported at this time');
        }

        console.log('=======================================\nPROCESSED:\n'+ JSON.stringify(triggerInfo) +'\n================================');

        this.serializer.deleteTriggerMoment(triggerInfo);



    }.bind(this);

    Recurrent.prototype.scheduleCallback = function(){
        console.log('Executing scheduler');


        var startTime = moment.tz('UTC');
        startTime.set('second', 0);

        var min = startTime.get('minute');

        var endTime = moment.tz(startTime.format(),'UTC');

        if (min >= 30)
        {
            // second half of the hour
            startTime.set('minute', 30);
            startTime.set('second', 0);
            startTime.set('millisecond', 0);

            endTime.set('minute', 59);
            endTime.set('second', 59);
            endTime.set('millisecond', 999);

        }else{
            // first half of the hour
            startTime.set('minute', 0);
            startTime.set('second', 0);
            startTime.set('millisecond', 0);

            endTime.set('minute', 29);
            endTime.set('second', 59);
            endTime.set('millisecond', 999);

        }

        
        
        // get triggerMoments due next half an hour
        this.serializer.checkoutTriggersBetween(startTime.format(), endTime.format(),
            function(err, results){
                if (err)
                {
                    console.log('ERROR reading triggers' + JSON.stringify(err));
                }else{
                    console.log('CHECKOUT SUCCESSFUL, results:' + results.length +'\n' + JSON.stringify(results) + '\n================================\n');

                    for(var i = 0;i < results.length;i++)
                    {
                        console.log('DOCUMENT: \n' + JSON.stringify(results[i]) + '\n============================\n');

                        this.doTrigger(results[i],
                            function(e1, doc, res){
                                if (e1){
                                    console.log('ERROR sending document: ' + JSON.stringify(doc) + '\nERROR: ' + JSON.stringify(e1));
                                }else{
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

    Recurrent.prototype.startSchedulingJob = function(){

        this.logger('Entered Recurrent.startSchedulingJob');

        if (this.runningSchedule)
        {
            try{
                this.runningSchedule.clear();
            }catch(e){};
        }


        later.date.UTC();


        // Do the first run immediately
        this.scheduleCallback();


        // then start the scheduler

        var sched = later.parse.recur().every(5).minute().startingOn(0);
        //var sched = later.parse.recur().every(1).minute();

        this.runningSchedule = later.setInterval(this.scheduleCallback, sched);

        this.logger('Scheduler started OK');


        // determine next half hour block

        // schedule job to start at next half hour block

        // run job to schedule tasks from now until next half hour block




    }.bind(this);

    this.init();


};

module.exports = Recurrent;



