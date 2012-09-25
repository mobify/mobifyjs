/**
 * AMD implementation for dust.js
 * This is based on require-cs code.
 * see: http://github.com/jrburke/require-cs for details
 */

define(function() {

    var dust = require.nodeRequire('dustjs-linkedin')
      , fs = require.nodeRequire('fs')
      , glob = require.nodeRequire('glob')
      , buildMap = {};

    return {
        write: function (pluginName, name, write) {
            if (buildMap.hasOwnProperty(name)) {
                var text = buildMap[name];
                write.asModule(pluginName + "!" + name, text);
            }
        }

      , load: function (name, parentRequire, load, config) {
            var path = parentRequire.toUrl(name);
            var compiled = [];

            glob(path, { sync: true }, function(err, files) {
                if (err) throw err;
                if (!files.length) throw 'No matches for ' + path;

                files.forEach(function(file) {
                    try {
                        var text = fs.readFileSync(file, 'utf8');
                        var templateName = file.split('/').pop().replace(/\.[^.]*$/, '');

                        text = text.replace(
                            /(<script[\s\S]*?>[\s\S]*?<\/script\s*>)/gi,
                            '{%whitespace:true}$1{/whitespace}'
                        );
                        text = '\n    ' + dust.compile(text, templateName);
                    } catch (err) {
                        err.message = "In " + file + ", " + err.message;
                        throw err;
                    }

                    compiled.push(text);
                });            
                buildMap[name] = "define(['dust', 'mobifyjs/tmpl'],function(dust){"
                    + compiled.join('\n') + "\n});";

                load.fromText('rdust!' + name, "define(['dust', 'mobifyjs/tmpl'],{});"); 
            });
        }
    };
});
