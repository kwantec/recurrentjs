/**
 * Created by dcastane on 18/07/16.
 */
'use strict';

var path = require('path');

var isFunction = function(fun) {
    return 'function' === typeof fun;
};


function FileSerializer(options)
{
    this.options = options;

    this.logger = console.log;


    FileSerializer.prototype.init = function(){

        if (isFunction(options.logger))
        {
            this.logger = options.logger;
        }

        this.logger('Starting initialization of FileSerializer...');


        this.logger('Completed initialization of FileSerializer');

    }.bind(this);

    this.init();

    FileSerializer.prototype.save = function(obj){
        this.logger('Entered FileSerializer.save');


        this.logger('Exited FileSerializer.save');
    }.bind(this);

    FileSerializer.prototype.read = function(query){
        this.logger('Entered FileSerializer.read');


        this.logger('Exited FileSerializer.read');
    }.bind(this);


};

module.exports = FileSerializer;



