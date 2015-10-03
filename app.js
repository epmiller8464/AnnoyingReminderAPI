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
var app = express();
//var app = express();
//var server = require('http').Server(app);
//var io = require('socket.io')(server);
//
////server.listen(8181);
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

console.log(util.inspect(process.memoryUsage()));

app.initio = function (http) {


    io = io(http);
    io.on('connection', function (socket) {

        //fs.readFile('tmp.txt', 'utf8',
        //    function (err, data) {
        //        if (err) {
        //            socket.emit('news', err.message);
        //
        //        } else {
        //            socket.emit('news', data);
        //        }
        //    });

        fs.watchFile('tmp.txt', {persistent: true, interval: 3000}, function (curr, prev) {
            //console.log('the current mtime is: ' + curr.mtime);
            //console.log('the previous mtime was: ' + prev.mtime);
            //console.log(curr.atime,prev.atime);
            //console.log(curr.size,prev.size);
            if (curr.size > prev.size) {
                //fs.readFile('tmp.txt', 'utf8',
                //    function (err, data) {
                //        if (err) {
                //            socket.emit('news', err.message);
                //
                //        } else {
                //            socket.emit('news', data);
                //
                //        }
                //    });
                var size = prev.size == 0 ? prev.size : curr.size - prev.size;
                var o = {encoding: 'utf8', start: size};//, end: curr.size};
                var rr = fs.createReadStream('tmp.txt', o);
                //rr.on('readable', function () {
                //    console.log('readable:', rr.read());
                //});
                rr.on('data', function (data) {
                    console.log('read data:', data.length);
                    /*   if (err) {
                     socket.emit('news', err.message);

                     */
                    //} else {
                    socket.emit('news', data);
                    var mem = process.memoryUsage();
                    console.log(util.format('%s kb %s mb',mem.heapTotal / 1e4,mem.heapTotal / 1e6));
                    console.log(util.inspect(process.memoryUsage()));
                    //}
                });
                rr.on('end', function () {
            //        console.log('end');
                });

                rr.on('close', function () {
           //         console.log('close');
                });
            }

            //var l = (curr.size > prev.size ? curr : prev);
            //var r = (curr.size < prev.size ? curr : prev);
            //var d = l - r;
            //var b = new Buffer(d);
            //var offset = curr.size < prev.size ?;
            //var l = 0;
            //// wsr.cork();
            //
            //var log = 'pid: ' + process.pid + ' t: ' + process.uptime() + '\n';
            //var i = fs.read(b, offset, log.length, 'utf8');
            //offset += i;
            //console.log(log.length);
            //console.log(Buffer.byteLength(log, 'utf8');
            //if ((offset + Buffer.byteLength(log)) >= (b.length + 1)) {
            //    stats = fs.statSync('tmp.txt');
            //
            //    wsr.write(b, 'utf8', function () {
            //        console.log('stats', stats.size);
            //    });
            //    b = new Buffer(256);
            //    // wsr.end('this is the end\n');
            //    //  wsr.uncork();
            //    //wsr.cork();
            //    offset = l = 0;
            //}
            //
            //l += 1;

        });


    });
};

var os = require('os');
(function (c) {
    //async.nextTick(function () {
    //    console.log('thread 1 :' + process.pid);
    //    console.log('thread 1 :' + process.uptime());
    //});

    //rr.setEncoding('utf8');
    var wsr = fs.createWriteStream('tmp.txt', {encoding: 'utf8'});
    wsr.on('finish', function () {
        console.error('all writes are now complete.');
    });
    wsr.once('drain', function (x) {
     //   console.log('draining');
        l = 0;
    });
    var offset = 0;
    var l = 0;
    // wsr.cork();
    setInterval(function () {

        var stats = fs.statSync('tmp.txt');
        //fs.read('tmp.txt', b, offset, l, p, function (e, br, buf) {
        //    console.log('read: ' + br, buf.length);
        //
        //});
        //rr.read();

        var log = 'pid: ' + process.pid + ' t: ' + process.uptime() + '';
        //wsr.write(log, 'utf8', function () {
        //    //l = stats.size / 1024;
        //    console.log('stats', stats.size / 1e4);
        //});
        //console.log(log);
        fs.appendFile('tmp.txt', log, 'utf8', function (err) {
            if (err) {
                console.log(err.message);
            }
        });
        //var i = b.write(log, offset, log.length, 'utf8');
        //offset += i;
        //console.log(log.length);
        //console.log(Buffer.byteLength(log, 'utf8'));
        //if ((offset + Buffer.byteLength(log)) >= (b.length + 1)) {
        //    stats = fs.statSync('tmp.txt');
        //
        //    wsr.write(b, 'utf8', function () {
        //        console.log('stats', stats.size);
        //    });
        //    b = new Buffer(256);
        //    // wsr.end('this is the end\n');
        //    //  wsr.uncork();
        //    //wsr.cork();
        //    offset = l = 0;
        //}
        //
        //l += 1;

    }, 500);

})(config);
//(function setup(c){
//}(config));

module.exports = app;
