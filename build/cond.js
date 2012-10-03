define(["module"], function(module) {
    var config = module.config();   
    var buildMap = {};
    var wroteDate = false;
    var fs = require.nodeRequire('fs')

    return {
    	write: function (pluginName, fullName, write) {
            if (buildMap.hasOwnProperty(fullName)) {
                var fileDesc = buildMap[fullName];
                var text = fileDesc.text;

                if (!fileDesc.cond || config[fileDesc.cond]) {
                    if (fileDesc.ext == "json") {
                        text = 'define("' + pluginName + "!" + fullName + '", '
                            + text + ');\n';
                    }
                } else {
                	text = 'define("' + pluginName + "!" + fullName + '", {});\n';
                }
                write.asModule(pluginName + "!" + fullName, text);
            }
            if (!wroteDate) {
                write.asModule("buildDate", '\ndefine("buildDate", ' + +new Date + ');');
                wroteDate = true;
            }
        },

		load: function (fullName, parentRequire, load, config) {
            var parts = fullName.split('?');
            var fileDesc = {};
            fileDesc.name = parts.shift();
            fileDesc.cond = parts.shift();

		    fileDesc.path = parentRequire.toUrl(fileDesc.name);
            
            fileDesc.ext = "js";
            if (fileDesc.path.match(/\.json$/i)) {
                fileDesc.ext = "json";
            } else {
                fileDesc.path += '.js';
            }
		    fileDesc.text = fs.readFileSync(fileDesc.path, 'utf8');
		    buildMap[fullName] = fileDesc;
            if (fileDesc.ext === "json") console.log(fileDesc);

		    load.fromText('cond!' + fullName,
                (fileDesc.ext === "json") ? '(' + fileDesc.text + ')' : fileDesc.text); 
        }
    };
});
