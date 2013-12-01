var compressor = require("node-minify");
var Q = require("q");

module.exports = function (settings) {
	var output = settings.output;
	
	var doCompile = function (concatPrereqs, minifyApp, concatPrereqsAndApp) {
		var deferred = Q.defer();
		
		var localConcatPrereqs = function () {
			var localDefer = Q.defer();
			
			concatPrereqs(localDefer);
			
			return localDefer.promise;
		};
		
		var localMinifyApp = function () {
			var localDefer = Q.defer();
			
			minifyApp(localDefer);
			
			return localDefer.promise;
		};
		
		var localConcatPrereqsAndApp = function () {
			var localDefer = Q.defer();
			
			concatPrereqsAndApp(localDefer);
			
			return localDefer.promise;
		};
		
		localConcatPrereqs().then(function () {
			localMinifyApp().then(function () {
				localConcatPrereqsAndApp().then(function () {
					deferred.resolve();
				}, function (err) {
					deferred.reject(err);
				}, function (progress) {
					deferred.notify(progress);
				});
			}, function (err) {
				deferred.reject(err);
			}, function (progress) {
				deferred.notify(progress);
			});
		}, function (err) {
			deferred.reject(err);
		}, function (progress) {
			deferred.notify(progress);
		});
		
		return deferred.promise;
	};
	
	var compileScripts = function (settings) {
		var localSettings = settings.scripts;
		
		return doCompile(function (defer) {
			new compressor.minify({
			    type: 'no-compress',
			    fileIn: localSettings.prerequisites,
			    fileOut: settings.buildPath + "prereqs.scripts.concat.js",
			    callback: function(err, min){
			        if (err != null) {
						defer.notify("Script Build: Error while concatenating prerequisites.");
			        	defer.reject(err);
			        } else {
						defer.notify("Script Build: Concatenated prerequisites...");
			        	defer.resolve();
			        }
			    }
			});
		}, function (defer) {
			new compressor.minify({
			    type: 'no-compress',
			    fileIn: localSettings.app,
			    fileOut: settings.buildPath + "app.scripts.concat.js",
			    callback: function(err, min){
			        if (err != null) {
						defer.notify("Script Build: Error while concatenating app.");
			        	defer.reject(err);
			        } else {
						defer.notify("Script Build: Concatenated app.");
						new compressor.minify({
						    type: 'uglifyjs',
						    fileIn: settings.buildPath + "app.scripts.concat.js",
						    fileOut: settings.buildPath + "app.scripts.concat.min.js",
						    callback: function(err, min){
						        if (err != null) {
									defer.notify("Script Build: Error while minifying app.");
						        	defer.reject(err);
						        } else {
									defer.notify("Script Build: Minified app.");
						        	defer.resolve();
						        }
						    }
						});
			        }
			    }
			});
		}, function (defer) {
			new compressor.minify({
			    type: 'no-compress',
			    fileIn: [
					settings.buildPath + "prereqs.scripts.concat.js", 
					settings.buildPath + "app.scripts.concat.min.js"
				],
			    fileOut: settings.buildPath + localSettings.output,
			    callback: function(err, min){
			        if (err != null) {
						defer.notify("Script Build: Error while concatenating prerequisites and minified app.");
			        	defer.reject(err);
			        } else {
						defer.notify("Script Build: Concatenated prerequisites and minified app.");
			        	defer.resolve();
			        }
			    }
			});
		});
	};
	
	var compileStyles = function (settings) {
		var localSettings = settings.styles;
		
		return doCompile(function (defer) {
			new compressor.minify({
			    type: 'no-compress',
			    fileIn: localSettings.prerequisites,
			    fileOut: settings.buildPath + "prereqs.styles.concat.css",
			    callback: function(err, min){
			        if (err != null) {
						defer.notify("Styles Build: Error while concatenating prerequisites.");
			        	defer.reject(err);
			        } else {
						defer.notify("Styles Build: Concatenated prerequisites...");
			        	defer.resolve();
			        }
			    }
			});
		}, function (defer) {
			new compressor.minify({
			    type: 'no-compress',
			    fileIn: localSettings.app,
			    fileOut: settings.buildPath + "app.styles.concat.css",
			    callback: function(err, min){
			        if (err != null) {
						defer.notify("Styles Build: Error while concatenating app.");
			        	defer.reject(err);
			        } else {
						defer.notify("Styles Build: Concatenated app.");
						new compressor.minify({
						    type: 'sqwish',
						    fileIn: settings.buildPath + "app.styles.concat.css",
						    fileOut: settings.buildPath + "app.styles.concat.min.css",
						    callback: function(err, min){
						        if (err != null) {
									defer.notify("Styles Build: Error while minifying app.");
						        	defer.reject(err);
						        } else {
									defer.notify("Styles Build: Minified app.");
						        	defer.resolve();
						        }
						    }
						});
			        }
			    }
			});
		}, function (defer) {
			new compressor.minify({
			    type: 'no-compress',
			    fileIn: [
					settings.buildPath + "prereqs.styles.concat.css", 
					settings.buildPath + "app.styles.concat.min.css"
				],
			    fileOut: settings.buildPath + localSettings.output,
			    callback: function(err, min){
			        if (err != null) {
						defer.notify("Styles Build: Error while concatenating prerequisites and minified app.");
			        	defer.reject(err);
			        } else {
						defer.notify("Styles Build: Concatenated prerequisites and minified app.");
			        	defer.resolve();
			        }
			    }
			});
		});
	}; 
	
	return {
		compile: function (type) {
			switch (type) {
				case "scripts":
					return compileScripts(settings);
					break;
				case "styles":
					return compileStyles(settings);
					break;
			}
		}
	}
};