/**
 * Created by dcastane on 18/07/16.
 */
'use strict';

var path = require('path');

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


        this.logger('Completed initialization of MongoSerializer');

    }.bind(this);

    this.init();

    MongoSerializer.prototype.save = function(obj){
        this.logger('Entered MongoSerializer.save');


        this.logger('Exited MongoSerializer.save');
    }.bind(this);

    MongoSerializer.prototype.read = function(query){
        this.logger('Entered MongoSerializer.read');


        this.logger('Exited MongoSerializer.read');
    }.bind(this);


};

module.exports = MongoSerializer;



