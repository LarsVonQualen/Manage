var _ = require("underscore");
var fs = require("fs");
var Compiler = require("./compiler.js");
var TaskQueue = require("./taskqueue.js");
var watchr = require("watchr");

var WatchrObject = function (paths, changeCallback) {
	return {
	    paths: paths,
		preferredMethods: ['watchFile','watch'],
		interval: 1000,
	    listeners: {
			error: function (err) {
				console.log(err);
			},
	        watching: function(err, watcherInstance, isWatching){
	            if (err) {
	                console.log("Watching: " + watcherInstance.path + " - failed with error", err);
	            } else {
	                console.log("Watching: " + watcherInstance.path);
	            }
	        },
	        change: function(changeType, filePath, fileCurrentStat, filePreviousStat){
				if (_.isFunction(changeCallback)) {
					changeCallback();
				}
	        }
	    }
	}
};

var changeEventHandler = function (type, compiler, queue) {
	console.log("Change detected, scheduled compile task.")

	queue.push(function (id) {
		compiler.compile(type).then(function (data) {
			console.log("<Task-#" + id + "> Done")
		}, function (err) {
			console.log("<Task-#" + id + "> " + err);
		}, function (progress) {
			console.log("<Task-#" + id + "> " + progress);
		});
	});
};

try {
	var settingsFile = (process.argv[2] != undefined ? process.argv[2] : "lam.json");
	var settings = JSON.parse(fs.readFileSync(settingsFile));
	var compiler = new Compiler(settings);
	var queue = new TaskQueue();
	queue.run();

	watchr.watch(new WatchrObject(settings.scripts.prerequisites, function () {
		changeEventHandler("scripts", compiler, queue);
	}));

	watchr.watch(new WatchrObject(settings.scripts.app, function () {
		changeEventHandler("scripts", compiler, queue);
	}));

	watchr.watch(new WatchrObject(settings.styles.prerequisites, function () {
		changeEventHandler("styles", compiler, queue);
	}));

	watchr.watch(new WatchrObject(settings.styles.app, function () {
		changeEventHandler("styles", compiler, queue);
	}));
} catch (e) {
	console.log(e);
}