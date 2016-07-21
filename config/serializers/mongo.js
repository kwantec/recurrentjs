/**
 * Created by dcastane on 18/07/16.
 */
'use strict';

var path = require('path');

var MongoClient = require('mongodb').MongoClient;

var isFunction = function(fun) {
    return 'function' === typeof fun;
};


function MongoSerializer(opt)
{
    this.options = opt;

    this.logger = console.log;


    MongoSerializer.prototype.dbConnect = function(callback)
    {
        //if ((undefined !== this.database)&&(null !== this.database))
        //{
        //   callback(null, this.database);
        //}else{

            MongoClient.connect( this.options.serializer.config.dburl , function(err, db) {
                if (err)
                {
                    callback(err, null);

                }else{
                    callback(null, db);
                }

            }.bind(this));

       // }


    }.bind(this);

    MongoSerializer.prototype.init = function(){

        if (isFunction(this.options.logger))
        {
            this.logger = this.options.logger;
        }

        this.logger('Starting initialization of MongoSerializer...');

        this.logger('Attempting connection to database at: ' + this.options.serializer.config.dburl);

        MongoClient.connect( this.options.serializer.config.dburl , function(err, db) {
            if (err)
            {
                this.logger('DATABASE ERROR: ' + JSON.stringify(err) );
                throw 'DATABASE CONNECTION ERROR';
            }
            console.log("Connected successfully to database");

            this.database = db;

            /*
            // TODO investigate why these 2 methods are causing
            // that we can not stop the app with ctrl+c
            process.on('SIGINT', function(){
                try{
                    db.close();
                }catch(e){};
            });
            process.on('SIGTERM', function(){
                try{
                    db.close();
                }catch(e){};
            });
            */

        }.bind(this));

        this.logger('Completed initialization of MongoSerializer');

    }.bind(this);

    this.init();

    MongoSerializer.prototype.deleteTriggerMoment = function(obj){
        this.logger('Entered deleteTriggerMoment.save');
        this.logger('WILL DELETE: ' + JSON.stringify(obj));

    }


    MongoSerializer.prototype.save = function(obj){
        this.logger('Entered MongoSerializer.save');

        var collection = this.database.collection(this.options.serializer.config.ordersCollection);
        collection.insertOne(obj, function(err, r) {
            if (err){
                this.logger('ERROR on inserting to Database: ' + JSON.stringify(err));
            }else{
                this.logger('SAVED TO DATABASE: ' + JSON.stringify(obj));
            }
        }.bind(this));


        this.logger('Exited MongoSerializer.save');
    }.bind(this);







    MongoSerializer.prototype.checkoutTriggersBetween = function(startTime, endTime, callback)
    {

        console.log('Retrieving triggers between:  ' + startTime + '  and  ' + endTime);

        this.dbConnect(function(err, db){

            if (err)
            {
                console.log('FAILED TO CONNECT TO DB' + JSON.stringify(err));
            }else{

                var collection = db.collection(this.options.serializer.config.scheduledCollection);


                var q1 = { "status": 0, "triggerMoment": { $lte: endTime, $gte: startTime }};


                var updateSt = {
                    $set: { status: 1 }
                };

                collection.updateMany(
                    q1,
                    updateSt,
                    function(err, results) {

                        if (err){
                            console.log('Error updating status: \n' + JSON.stringify(err));
                        }else{
                            console.log('UPDATED DOCUMENTS RESULTS: ' + JSON.stringify( results ));
                        }

                        var q2 = { "triggerMoment": { $lte: endTime, $gte: startTime }, "status": 1 };

                        console.log('QUERY: ' + JSON.stringify(q1));

                        collection.find( q2 ).toArray(
                            function(err2, docs){

                                if (err2){
                                    console.log('ERROR during FIND');

                                }else{
                                    console.log('FOUND: ' + docs.length + ' documents:');

                                }
                                callback(err2, docs);

                            });

                    });


/*
                console.log('QUERY: ' + JSON.stringify(q1));

                collection.find( q1 ).toArray(
                    function(err2, docs){

                        if (err2){
                            console.log('ERROR during FIND');

                        }else{
                            console.log('FOUND: ' + docs.length + ' documents:');

                        }
                        callback(err2, docs);

                    });
*/
            }


        }.bind(this));

        /*
        this.logger('Entered MongoSerializer.checkoutTriggersBetween');
        console.log('Retrieving triggers between:  ' + startTime + '  and  ' + endTime);

        var collection = this.database.collection(this.options.serializer.config.scheduledCollection);

        var query = {
                        triggerMoment :{
                            '$gte': startTime,
                            '$lte': endTime
                        }
                    };

        collection.find( query ).toArray(
            function(err, docs){

                if (err){
                    console.log('ERROR during FIND');
                }else{
                    console.log('FOUND: ' + docs.length + ' documents:');
                    for(var i = 0;i < docs.length;i++)
                    {
                        console.log('DOCUMENT: \n' + JSON.stringify(docs[i]) + '\n============================\n');
                    }
                }

            });

        */

    }.bind(this);

    MongoSerializer.prototype.saveTriggerMoment = function(obj){
        this.logger('Entered MongoSerializer.saveTriggerMoment');

        var collection = this.database.collection(this.options.serializer.config.scheduledCollection);
        collection.insertOne(obj, function(err, r) {
            if (err){
                this.logger('ERROR on inserting to Database: ' + JSON.stringify(err));
            }else{
                this.logger('SAVED TO DATABASE: ' + JSON.stringify(obj));
            }
        }.bind(this));


        this.logger('Exited MongoSerializer.saveTriggerMoment');
    }.bind(this);

    
    
    MongoSerializer.prototype.read = function(query){
        this.logger('Entered MongoSerializer.read');


        this.logger('Exited MongoSerializer.read');
    }.bind(this);


};

module.exports = MongoSerializer;



