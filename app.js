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
var debug = require('debug');
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

var ext = config.get('ext'),
    dirPath = config.get('sourceFilePath'),
    np = config.get('namePattern');

dirPath = path.normalize(dirPath);

app.initio = function (http) {
    io = io(http);
    io.on('connection', function (socket) {
        var watchFiles;// = {};

        var nameRegex = new RegExp(np);
        if (fs.existsSync(dirPath)) {

            fs.readdir(dirPath, function (err, files) {
                if (err) {
                    debug('error finding files or paths to stream', err.message);
                    return;
                }

                files.forEach(function (f) {
                    debug('file', f);
                    //.test("test.logs")
                    if (!watchFiles)
                        watchFiles = {};

                    if (/\.log$/.test(f) && nameRegex.test(f)) {

                        var fp = path.format({
                            root: "/",
                            dir: dirPath,
                            base: f,
                            ext: ext,
                            name: f
                        });
                        watchFiles[f] = {fp: fp, stat: undefined, name: f};
                    }
                });

                if (watchFiles) {
                    for (var index in watchFiles) {
                        var file = watchFiles[index];
                        fs.watch(file.fp, {persistent: true, recursive: false}, function (e, fileName) {
                            var lf = watchFiles[fileName];
                            if (!watchFiles[fileName]) {
                                debug('something is wrong watching the file', fileName);
                                return;
                            }
                            var curr = fs.statSync(lf.fp),
                                prev = lf.stat;
                            var o = {encoding: 'utf8', start: 0};//, end: curr.size};
                            if (prev && curr.size > prev.size) {
                                o.start = prev.size;// prev.size == 0 ? prev.size : curr.size - prev.size;
                            }
                            var rr = fs.createReadStream(lf.fp, o);
                            rr.on('data', function (data) {
                                console.log('read data:', data.length);
                                socket.emit('news', data);
                                var mem = process.memoryUsage();
                                console.log(util.format('%s kb %s mb', mem.heapTotal / 1e4, mem.heapTotal / 1e6));
                                console.log(util.inspect(process.memoryUsage()));
                            });
                            rr.on('end', function () {
                            });

                            rr.on('close', function () {
                            });
                            lf.stat = curr;
                        });

                    }
                }
            });
        }
    });
};

var os = require('os');
(function () {
    var dSize = fs.statSync('data.json').size;
    var offset = 0;
    var l = 0;
    setInterval(function () {
        offset = offset < dSize ? offset : 0;
        var stop = Math.floor((Math.random() * 20) + 1);
        var o = {encoding: 'utf8', start: offset, end: offset + stop};

        var path = dirPath + "media-server_2015-10-02_15-01-36.00001.pid1164.log";
        var wsr = fs.createWriteStream(path, {encoding: 'utf8'});
        wsr.on('finish', function () {
            //  console.error('all writes are now complete.');
        });
        wsr.once('drain', function (x) {
        });

        var rr = fs.createReadStream('data.json', o);
        rr.pipe(wsr);
        //rr.on('readable', function () {
        //    var vr = rr.read(1);
        //    offset = null == vr ? offset = 0 : offset;
        //});
        //rr.on('data', function (data) {
        //    console.log('write data:', data);
        //    //wsr.write(data);
        //    //fs.appendFile(path, data, 'utf8', function (err) {
        //    //    if (err) {
        //    //        console.log(err.message);
        //    //    }
        //    //});
        //});
        //rr.on('end', function () {
        //});
        //
        //rr.on('close', function () {
        //});


        offset += stop + 1;// Math.floor((Math.random() * 20) + 1);


    }, Math.floor((Math.random() * 3000) + 1));
    //}, 0);

})();

module.exports = app;
