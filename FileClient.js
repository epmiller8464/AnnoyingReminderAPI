/**
 * Created by root on 10/2/15.
 */

//var config = require('config'),
var path = require('path'),
    fs = require('fs'),
    util = require('util'),
    debug = require('debug'),
    Emitter = require('events').EventEmitter;
/**
 *Module Exports
 */
function FileClient(config) {

    var self = this;
    self.config = config,
        self.hasTargetFile = false,
        self.ext = self.config.get('ext'),
        self.dirPath = path.normalize(self.config.get('sourceFilePath')),
        self.np = self.config.get('namePattern'),
        self.hasTargetFile = false,
        self.targetFile = undefined,
        self.socket = undefined,
        self.fileWatcher = undefined,
        self.directoryWatcher = undefined;
}


//FileClient.prototype.__proto__ = Emitter.prototype;


FileClient.prototype.beginWatch = function (socket, callback) {

    var self = this;
    try {

        self.socket = socket;
        self.watchTargetDirectory();
        self.findTargetFile(function (targetFile, err) {

            if (err) {
                callback(err);
            } else if (!targetFile) {
                console.log('no files found.');
                callback();
            } else {

                self.setTargetAndWatchFile(targetFile);
                callback();
            }
        });

        //throw  new Error('testing');
    } catch (e) {
        //throw e;
        callback(e);
    }
    return self;
};

FileClient.prototype.endWatch = function () {

    var self = this;
    self.unwatchTargetFile();
    self.unwatchTargetDirectory();
    return self;
};

FileClient.prototype.findTargetFile = function (callback) {

    var self = this;
    var nameRegex = RegExp(self.np);
    fs.readdir(self.dirPath, function (err, files) {
        if (err) {
            debug('error finding files or paths to stream %s', err.message);
            console.log(util.format('error finding target file: %s', err.message));
            callback(null, err);
            return;
        }
        var targetFile,
            watchFiles;// = undefined;
        files.forEach(function (f) {

            debug('file: %s', f);

            if (/\.log$/.test(f) && nameRegex.test(f)) {
                if (!watchFiles)
                    watchFiles = [];

                var fp = self.getFilePath(f);
                var stats = fs.statSync(fp);
                watchFiles.push({fp: fp, stats: stats, name: f});
                //watchFiles[f] = {fp: fp, stats: undefined, name: f};
            }
        });

        if (watchFiles) {

            watchFiles.forEach(function (pt) {
                var curr = this.targetFile;
                if (!curr) {
                    curr = pt;
                } else {
                    if (curr.stats.birthtime.getTime() < pt.stats.birthtime.getTime()) {
                        curr = pt;
                    } else if (curr.stats.birthtime.getTime() == pt.stats.birthtime.getTime()) {
                        if (curr.stats.mtime.getTime() < pt.stats.mtime.getTime()) {
                            curr = pt;
                        }
                    }
                }
                this.targetFile = curr;
            });
        }
        callback(this.targetFile, err);
        return;
    });
};

FileClient.prototype.setTargetAndWatchFile = function (file) {
    var self = this;

    if (file) {
        self.unwatchTargetFile();
        self.hasTargetFile = true;
        //var oldFile = self.targetFile;
        self.targetFile = file;
        self.fileWatcher = self.watchTargetFile();
        self.sendData();
    }
};

FileClient.prototype.unwatchTargetFile = function () {
    var self = this;
    if (self.fileWatcher) {
        self.fileWatcher.close();
        self.fileWatcher = undefined;
        self.hasTargetFile = false;
    }
    return self;
};

FileClient.prototype.unwatchTargetDirectory = function () {
    var self = this;
    if (self.directoryWatcher) {
        self.directoryWatcher.close();
        self.directoryWatcher = undefined;
    }
    return self;
};

FileClient.prototype.watchTargetFile = function () {
    var self = this;
    var currFile = self.targetFile;
    return fs.watch(currFile.fp, {persistent: true, recursive: false}, function (event, changedFileName) {

        if (event === 'change') {
            self.sendData(changedFileName);
        }
    });
};


FileClient.prototype.sendData = function (changedFileName) {
    var self = this;
    //{fp: fp, stats: stats, name: f}

    var prevFile = self.targetFile,
        currFile = {
            fp: prevFile.fp,
            stats: fs.statSync(prevFile.fp),
            name: prevFile.name
        };

    var curr = currFile.stats,
        prev = prevFile.stats,
        o = {encoding: 'utf8', start: 0},
        bytesSent = 0;

    if (curr.size > prev.size) {
        o.start = prev.size;// prev.size == 0 ? prev.size : curr.size - prev.size;
    }
    var rr = fs.createReadStream(currFile.fp, o);

    rr.pause();
    rr.on('readable', function () {
        var chunk,
            chunksize = 0x3ff;
        while (null !== (chunk = rr.read(chunksize))) {
            //wsr.write(chunk);
        }
    });

    rr.on('data', function (data) {
        bytesSent += Buffer.byteLength(data);
        console.log(data);
        //var mem = process.memoryUsage();
        //console.log(util.format('%s kb %s mb', mem.heapTotal / 1e4, mem.heapTotal / 1e6));
        //console.log(util.inspect(process.memoryUsage()));
        self.socket.emit('news', data);
    });
    rr.on('end', function () {
        console.log(util.format('done sending data: %s, bytes: %s', currFile.fp, bytesSent));
        fs.stat(prevFile.fp, function (err, stats) {
            if (err) {
                console.log(util.format('error updating %s, stats %s', err.message, util.inspect(self.targetFile)));

            } else {
                self.targetFile.stats = stats;
                console.log(util.format('updating stats %s', util.inspect(self.targetFile)));
            }
        });
    });
};


FileClient.prototype.watchTargetDirectory = function () {
    var self = this;
    console.log(util.format('watching directory %s changed', self.dirPath));

    function onDirChanged(evt, fileName) {

        console.log('directory changed');
        console.log(util.inspect(evt));
        console.log(util.inspect(fileName));
        var newFilePath = self.getFilePath(fileName);
        if (evt === 'rename') {
            self.findTargetFile(function (targetFile, err) {

                if (err) {
                    console.log('error in onDirChanged:' + err.message);
                    self.endWatch();
                } else if (!targetFile) {
                    console.log('no files found.');
//                    self.endWatch();
                } else {
                    console.log('wathing new file for changes.' + targetFile.fp);
                    self.setTargetAndWatchFile(targetFile);
                }
            });
        }
    }

    self.directoryWatcher = fs.watch(self.dirPath, {persistent: true, recursive: false}, onDirChanged);

    return self;
};

FileClient.prototype.getFilePath = function (fileName) {

    var self = this;
    return path.normalize(path.format({
        root: "/",
        dir: self.dirPath,
        base: fileName,
        ext: self.ext,
        name: fileName
    }));
}

module.exports = FileClient;