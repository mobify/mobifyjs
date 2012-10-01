define(["module"], function(module) {
    var development = module.config().development;   
    var buildMap = {};

    return {
    	write: function (pluginName, name, write) {
            if (buildMap.hasOwnProperty(name)) {
                var text;
                if (development) {
                	text = buildMap[name];
                } else {
                	text = 'define("' + pluginName + "!" + name + '", {});\n';
                }
                write.asModule(pluginName + "!" + name, text);
            }
        },

		load: function (name, parentRequire, load, config) {
		    var path = parentRequire.toUrl(name);
		    var text = fs.readFileSync(path + '.js', 'utf8');

		    buildMap[name] = text;
		    load.fromText('dev!' + name, text); 
        }
    };
});
