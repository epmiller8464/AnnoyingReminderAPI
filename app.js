var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var routes = require('./routes/index');
var users = require('./routes/users');
var config = require('config');
var async = require('async');
var debug = require('debug');
var app = express();
var FileClient = require('./FileClient');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
var io = require('socket.io');


var util = require('util');

//console.log(util.inspect(process.memoryUsage()));

//var ext = config.get('ext'),
//    dirPath = config.get('sourceFilePath'),
//    np = config.get('namePattern');
//
//dirPath = path.normalize(dirPath);
var fc = new FileClient(config);

app.initio = function (http) {
    io = io(http);
    io.on('connection', function (socket) {
        fc.beginWatch(socket, function (err) {

            if (err) {
                debug('error occured on beginwatch. %s', err.message);
                fc.endWatch();
                return;
            }
            debug(util.inspect(fc));
            debug('watching for file and dir changes.');
            //process.nextTick(function () {
            var count = 0;
            var interval = Math.floor((Math.random() * 3000) + 1);
            var c = setInterval(function () {

                if (count >= 5) {

                    dropNewTestFiles();
                    writeTestData(fc.targetFile.fp);
                    console.log(util.inspect(fc.targetFile));
                    if (count == 20)
                        clearTimeout(c);
                }
                else {
                    writeTestData(fc.targetFile.fp);
                }
                count += 1;
                if (count >= 5) {
                    interval = 5000;
                }
            }, interval);

            function dropNewTestFiles() {

                var o = {encoding: 'utf8', start: 0};
                var date = new Date();
                var path = fc.getFilePath(util.format('media-server_%s-%s-%s_%s-%s-%s.%s.log', date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getTime()));
                var wsr = fs.createWriteStream(path, {encoding: 'utf8'});
                wsr.on('finish', function () {
                    console.log('all writes are now complete.' + path);
                    // writeTestData(fc.targetFile.fp);
                });
                wsr.once('drain', function (x) {
                    console.log('drain');

                });
                wsr.on('pipe', function (src) {
                    console.log('piping');

                });
                wsr.on('error', function () {
                    console.log('error occured writing data');

                });
                var rr = fs.createReadStream(fc.getFilePath('media-server_2015-10-02_15-01-36.00001.pid1164.log'), o);
                //rr.pipe(wsr);
                rr.pause();
                rr.on('readable', function () {

                    var chunk;
                    while (null !== (chunk = rr.read())) {
                        //wsr.write(chunk);
                    }
                });
                rr.on('data', function (data) {
                    console.log('got %d bytes of data', data.length);
                    console.log(data);
                    wsr.write(data);
                });
                rr.on('end', function () {
                    wsr.end(util.format('<br/><p style="color:red;">%s</p>', path));
                });
            }

            return;
        });
    });
};


var os = require('os');

function writeTestData(newTargetFile) {
    var dSize = fs.statSync('data.json').size;

    var offset = 0;
    var l = 0;
    //setTimeout(function () {
    var wfSize = fs.statSync(newTargetFile).size;
    offset = offset < dSize ? offset : 0;
    var stop = Math.floor((Math.random() * 0x1ff) + 1);
    var o = {encoding: 'utf8', start: 0};// offset, end: offset + stop};

    var wsr = fs.createWriteStream(newTargetFile, {flags: 'r+', defaultEncoding: 'utf8', start: wfSize});
    //if (offset == 0) {
    //    wsr.write('****************************************************************************\n');
    //}
    wsr.on('finish', function () {
        debug('all writes are now complete.');
    });
    wsr.once('drain', function (x) {
    });

    var rr = fs.createReadStream('data.json', o);
    //rr.pipe(wsr);
    //offset += stop + 1;
    rr.pause();
    rr.on('readable', function () {

        var chunk;
        while (null !== (chunk = rr.read(0xff))) {
            //wsr.write(chunk);
        }
    });
    rr.on('data', function (data) {
        console.log('got %d bytes of data', data.length);
        console.log(data);
        wsr.write(data);
    });
    rr.on('end', function () {
        wsr.end(util.format('<br/><p style="color:red;">%s</p>', newTargetFile));
    });
    //}, Math.floor((Math.random() * 2000) + 1));
    //}, 3000);
    //return clear;
};

module.exports = app;
