/**
 * Created by dcastane on 18/07/16.
 */
'use strict';

var express = require('express');
var path = require('path');
var config = require(path.resolve('./config/config'));
var later = require('later');
var moment = require('moment');

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

        // TODO better validation of URL
        if (!isString(input.triggerUrl))
        {
            return 'Invalid triggerUrl, MUST be a URL';
        }

        var httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'CONNECT', 'TRACE', 'HEAD'];

        if (!isString(input.triggerMethod))
        {
            return 'Invalid triggerMethod, MUST be a valid HTTP method: GET, POST, PUT, DELETE, etc';
        }

        var foundIt = false;

        input.triggerMethod = input.triggerMethod.trim().toUpperCase();

        for(var i = 0;i < httpMethods.length;i++){
            if (httpMethods[i] === input.triggerMethod)
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
        /*
        try{
            payload = JSON.parse(req.body);
        }catch(e){
            this.logger('Error parsong JSON');
            payload = null;
        }
        */

        var valid = this.validatePutScheduleInput(payload);

        if (valid === null)
        {
            // OK to continue (no error on JSON)
            this.logger('Received JSON: \n' + JSON.stringify(payload));


            this.serializer.save(payload);


            for(var i = 0;i < payload.triggerMoments.length;i++){

                var newRec = {};
                newRec.notificationId = payload.notificationId;
                newRec.notificationType = payload.notificationType;
                newRec.triggerMoment = payload.triggerMoments [i];
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


    Recurrent.prototype.createRouter = function(){

        this.logger('Entered Recurrent.createRouter');
        var router = express.Router();


        router.put('/schedules', this.putSchedule);
        router.get('/schedules', this.getSchedule);

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


    Recurrent.prototype.startSchedulingJob = function(){

        this.logger('Entered Recurrent.startSchedulingJob');

        // get current time
        var curTime = Date.now();


        // determine next half hour block

        // schedule job to start at next half hour block

        // run job to schedule tasks from now until next half hour block




    }.bind(this);

    this.init();


};

module.exports = Recurrent;



