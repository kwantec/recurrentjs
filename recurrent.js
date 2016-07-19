/**
 * Created by dcastane on 18/07/16.
 */
'use strict';

var express = require('express');
var path = require('path');
var config = require(path.resolve('./config/config'));



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

    this.init();


};

module.exports = Recurrent;



