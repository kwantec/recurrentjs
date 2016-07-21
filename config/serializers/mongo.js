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



