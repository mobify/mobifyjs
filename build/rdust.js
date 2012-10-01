/**
 * AMD implementation for dust.js
 * This is based on require-cs code.
 * see: http://github.com/jrburke/require-cs for details
 */

define(["module"], function(module) {

    var dust = require.nodeRequire('dustjs-linkedin/lib/dust')
      , fs = require.nodeRequire('fs')
      , glob = require.nodeRequire('glob')
      , buildMap = {}
      , maybeCompress = module.config().minify;      

    dust.parser = require.nodeRequire('dustjs-linkedin/lib/parser');
    dust.compiler = require.nodeRequire('dustjs-linkedin/lib/compiler');

    dust.compiler.parse = dust.parser.parse;
    dust.compile = dust.compiler.compile;
    dust.nextTick = process.nextTick;

    var oldPragmaOptimizer = dust.compiler.optimizers['%'];

    dust.compiler.optimizers['%'] = function(context, node) {
        var pragmaName = node[1][1];
        var pragmaValue = node[2][1];
        
        pragmaValue = pragmaValue && pragmaValue[1];

        var wantWhitespace = (pragmaName === "script")
            || (pragmaName === "whitespace" && pragmaValue === "true");

        var usedToWantWhitespace = context.preserveWhitespace;
        context.preserveWhitespace = wantWhitespace;
        var out = oldPragmaOptimizer.call(this, context, node);
        context.preserveWhitespace = usedToWantWhitespace;

        return out;
    }

    // By default, Dust skips over whitespace nodes by processing
    // them with a nullifying optimizer. We allow them to stay if pragma
    // optimizer is kind to them.
    dust.compiler.optimizers.format = function(context, node) {
        if (context.preserveWhitespace) {
            return ['buffer', node[1] + node[2]];
        }
    }

    function compileParts(context, body) {
        var parts = '';
        for (var i = 1, len=body.length; i < len; i += 1) {
            parts += dust.compiler.compileNode(context, body[i]);
        }
        return parts;
    }

    // preserveWhitespace flag is set via a {%whitespace:true}...{/whitespace} 
    // pragma, and unset with {%whitespace:false}...{/whitespace}. Whitespace 
    // preservation state is changed while generating output for content within 
    // pragma, and then restored to original, allowing multiple whitespace pragmas 
    // to be nested within each other.
    dust.compiler.pragmas.whitespace = function(compiler, context, bodies, params) {
        var out = compileParts(compiler, bodies.block);
        return out;
    }

    // {%script}...{/script} will output a <script>...</script> and preserve line 
    // wraps (but not other whitespace) inside.
    dust.compiler.pragmas.script = function(compiler, context, bodies, params) {
        var text = []
          , out;
        
        if (bodies.block.every(function(el, i) {
            if (i == 0) return true;
            if (el[0].match(/^(buffer|format)$/)) {
                text.push(el[1]);
                return true;
            }
        })) {
            var result = maybeCompress(text.join(''));
            var err = result[0] && ('<script>console&&console.warn("' + dust.escapeJs(result[0]) + '");</script>\n');
            out = ".write(\"" + dust.escapeJs(result[0])
                + "<script>"  + dust.escapeJs(result[1]) + "</script>\")";
        } else {
            bodies.block.push(['buffer', '</script>']);
            bodies.block.splice(1, 0, ['buffer', '<script>']);
            out = compileParts(compiler, bodies.block);
        }
        return out;
    };    

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
