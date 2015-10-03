/**
 * Created by root on 10/2/15.
 */

var config = require('config'),
    path = require('path'),
    fs = require('fs'),
    util = require('util'),
    Emitter = require('events').EventEmitter;
/**
 *Module Exports
 */
function DataClient(config) {

    var self = this;
    self.config = config;
    self.watchFiles = [];

}


//DataClient.prototype.__proto__ = Emitter.prototype;


DataClient.prototype.setup = function () {

};