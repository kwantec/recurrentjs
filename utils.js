/**
 * Created by dcastane on 25/07/16.
 */
'use strict';

var moment = require('moment-timezone');

function Utils() {

    // DO NOT MODIFY THIS parseISODateToUTC FUNCTION
    // WIHTOUT MY PERMISSION -Daniel Castañeda
    Utils.prototype.parseISODateToUTC = function(val) {
        // IMPORTANT: DO NOT MODIFY THIS PATTERN! -Daniel Castañeda
        //var pattern = 'YYYY-MM-DDTHH:mmZ';
        //var m = moment.tz(val, pattern, 'UTC');
        var m = moment.tz(val, 'UTC');

        if (!m.isValid()) {
            return null;
        }
        return m.format();
    }.bind(this);

    Utils.prototype.isObject = function(o) {
        return 'object' === typeof o;
    }.bind(this);

    Utils.prototype.has = function(field) {
        if (field === undefined) {
            return false;
        }
        return true;
    }.bind(this);

    Utils.prototype.hasValue = function(field) {
        if ((field === undefined) || (null === field)) {
            return false;
        }
        return true;
    }.bind(this);


    Utils.prototype.isInteger = function(val) {
        if (Number.isInteger(val)) {
            return true;
        }
        if (isNaN(Number.parseInt(val))) {
            return false;
        }
        return true;
    }.bind(this);

    Utils.prototype.isNumber = function(val) {
        if (isNaN(Number.parseFloat(val))) {
            return false;
        }
        return true; // FIXME using a RegExp - this will return true for things like 3.14kskhsu as it parses to 3.14
    }.bind(this);

    Utils.prototype.isString = function(val) {
        return 'string' === typeof val;
    }.bind(this);

    Utils.prototype.isFunction = function(fun) {
        return 'function' === typeof fun;
    }.bind(this);

    Utils.prototype.isField = function(val) {
        if (!this.hasValue(val)) {
            return false;
        }
        if (this.isFunction(val)) {
            return false; // it is a function, not a field
        }
        return true;
    }.bind(this);

    Utils.prototype.nn = function(str) {
        if (!this.has(str)) {
            return '';
        }
        return str;
    }.bind(this);

    Utils.prototype.hasStringValue = function(field) {
        if ((field === undefined) || (null === field)) {
            return false;
        }
        if (!this.isString(field)) {
            return false;
        }
        if (field.trim() === '') {
            return false;
        }

        return true;

    }.bind(this);

    Utils.prototype.isBoolean = function(o) {
        return 'boolean' === typeof o;
    }.bind(this);

    Utils.prototypeisValue = function(val) {
        if ((null !== val) && (isNaN(val)) && (undefined !== val)) {
            return true;
        }
        return false;
    }.bind(this);
}

var retValue = new Utils();

module.exports = retValue;
