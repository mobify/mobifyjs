/*

Processing order description

1. Escaping

The Mobify tags identities whether a browser should recieve the transformation.
If so, it escapes the document, allowing for markup capture without loading
external resources.

2. Source DOM Construction

The escaped markup is retrieved from the DOM as a string. The escaped markup is 
transformed into a DOM node after resource loading attributes are escaped.

3. Data select

A data object is created by select nodes from the source DOM using DOM methods.

4. Markup generation.

A dust template is rendered with the data as a context, producing the final HTML.

5. Document replacement

The current document is replaced by using document.open/write/close. This makes 
the browser behave as if the templated HTML was the regular source.

*/
(function(window, document, Mobify, undefined) {
    var config = Mobify.config
      , $ = Mobify.$
      , _ = Mobify._
      , timing = Mobify.timing;

    $.extend(config, {
        isDebug: $.cookie('mobify-debug'),
        location: window.location
    });
    
    // V6 tags don't set state, so we set it here.
    // https://github.com/mobify/portal_app/issues/186
    //
    // mobify-path=<mobifyjs-path>
    // mobify-all
    // mobify-debug=<int>
    if (config.tagVersion > 5) {
        var hash = location.hash
          , match

        match = /mobify-path=([^&;]+)/g.exec(hash)
        if (match) {
            if (/mobify-all/.test(hash)) {
                document.cookie = 'mobify-path=' + match[1] + '; path=/'
            } else {
                document.cookie = 'mobify-path=1; path=/'
                sessionStorage['mobify-path'] = match[1]
            }
        }

        match = /mobify-debug=([^&;]+)/g.exec(hash)
        if (match) {
            document.cookie = 'mobify-debug=' + match[1] + '; path=/'
        }
    }

    // If loaded with tagInjector or Preview, set debug, otherwise debug is off.
    // Setting `mobify-debug` cookie overrides defaults.
    if (config.isDebug === null) {
        config.isDebug = /^(?:https?:\/\/[^\/]+)?\/__\/|^\/\/(trust|preview).mobify.com\//.test(config.path)
            ? 2 : 0;
    }
    config.isDebug = +config.isDebug;

    // configFile my already exists if rendering server side, so only grab mobify.js script tag 
    // if configFile is undefined.
    if (!config.configFile) {
        // V6 moved mobify.js to the first script.
        config.configFile = config.tagVersion > 5
            ? $('script[src*="mobify.js"]').first().attr('src')
            : $('script[src*="mobify.js"]').last().attr('src');
    }

    config.configDir = config.configFile.replace(/\/[^\/]*$/, '/');

    if (window.enableStudioJS) {
        Mobify.studioJS = {
            get : function(key, callback) {
                var handler = function(ev) {
                    if ((ev.data.command === 'html')
                        && (ev.data.dest === 'page')
                        && (ev.data.key === key)
                        && (ev.source === window)) {
                        window.removeEventListener("message", handler, false);
                        callback(ev.data.value, ev.data.key);    
                    }
                }
                window.addEventListener("message", handler, false);
            },
            set: function(key, value) {
                Mobify.studioJS[key] = value;
                window.postMessage({
                    dest : 'extension',
                    command : 'html',
                    key: key,
                    value: value
                }, '*');
            }
        };
    }
    
    Mobify.load = function(evaluationSource) {
        var conf = Mobify.conf = Mobify.conf.call(Mobify.data2 && Mobify.data2.M, Mobify.data && Mobify.data.M)

        timing.addPoint('Setup Conf');

        // if evaluatedSource is undefined, grabContent, and if that is also undefined, unmobify
        if (evaluationSource === undefined) {
            evaluationSource = Mobify.externals.grabContent();
            if (evaluationSource === undefined) return Mobify.unmobify();
        }

        evaluationSource.config = config;

        // Deprecated.
        if (Mobify.data) {
            evaluationSource.mobileViewport = "width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=no";
        }

        Mobify.conf.data = $.extend(evaluationSource, conf.data);
        Mobify.evaluatedData = undefined;

        // `DOMContentLoaded` will fire for the original `document` so hold the
        // ready event until the new document loads.
        $.holdReady(true);
        
        // Extract data (interesting DOM nodes, or nested arrays, objects and primitives)
        // See data.js for description of data extraction process and configuration map.
        if (Mobify.data2) {
            
            var cont = Mobify.data2
                .makeCont({source: evaluationSource})
                .on('complete', Mobify.acceptData);
            
            Mobify.timing.addPoint('Prepared conf for evaluation');
            Mobify.timing.addSelector('Start');
            cont.eval();
        } else {
            Mobify.templateData(Mobify.data.evaluate({ data: evaluationSource }));    
        }
    };

    // acceptData added to the Mobify object so it can be overridden in server-side transformations.
    Mobify.acceptData = function(data, cont) {     
        if (!Mobify.evaluatedData) {
            Mobify.evaluatedData = data;
            Mobify.evaluatedCont = cont;
            timing.addPoint('Evaluated Conf');
        }
        
        var enabled = Mobify.externals.enable(data.OUTPUTHTML || '');
        timing.addPoint('Enabled Markup');

        // JB: When would the `DOMContentLoaded` branch be fired?
        // If we requested more data to render the template, the document.readyState
        // may be set before we render.
        if (/complete|loaded|interactive/.test(document.readyState)) {
            emitMarkup(enabled);
        } else {
            document.addEventListener('DOMContentLoaded', function DOMContentLoaded() {
                document.removeEventListener('DOMContentLoaded', DOMContentLoaded, false);            
                emitMarkup(enabled);
            }, false);
        }        
    };

    var emitMarkup = function(markup) {
        timing.addPoint('DOMContentLoaded');

        // If SASS compilation fails, the stylesheet will be blank except a SASS error.
        // Set the document to visible to see these errors.
        // if (config.isDebug) $('html').css('visibility', 'visible');
        $('html').css('visibility', 'visible');

        // iOS 4.3 does not clear listeners on `document` after `document.open`.
        // Manually remove listeners added by the v4 tags.
        Mobify.beforeload && document.removeEventListener('beforeload', Mobify.beforeload, true);

        if (!markup) {
            debug.warn('OUTPUTHTML is empty, unmobifying.');
            return Mobify.unmobify();
        }

        // `document.open` clears events bound to `document`.
        document.open();

        // On `DOMContentLoaded` of the new `document`, fire the ready event on our
        // jQuery. (the `DOMContentLoaded` it binds to fires early)
        document.addEventListener('DOMContentLoaded', function DOMContentLoaded() {
            document.removeEventListener('DOMContentLoaded', DOMContentLoaded, false);            
            $.holdReady(false);
        }, false);

        // In Webkit, `document.write` immediately executes inline scripts 
        // not preceded by an external resource.
        document.write(markup);
        timing.addPoint('Wrote Document');

        Mobify.postDocWrite();

        // Positioning this after the last `document.write`.
        document.close();
        if (Mobify.studioJS) {
            Mobify.studioJS.get('renderHTML', function(markup) {
                oldEmitMarkup(markup);
            });
        }

        // Bind `orientationchange` listener and add `html` classes.
        Mobify.enhance();

    };
    var oldEmitMarkup;
    if (Mobify.studioJS) {
        oldEmitMarkup = emitMarkup;
        emitMarkup = function(markup) {
            Mobify.studioJS.get('renderHTML', function(markup) {
                oldEmitMarkup(markup);
            });
            Mobify.studioJS.set('resultHTML', markup || Mobify.studioJS.sourceHTML);
        }
    }

    // Data1's templating func.
    Mobify.templateData = function(evaluatedData) {       
        Mobify.evaluatedData = evaluatedData;
        timing.addPoint('Evaluated Conf');
        
        if (evaluatedData.unmobify) return Mobify.unmobify();
               
        // Render data into template, receiving an HTML string.
        dust.render('root', evaluatedData, function(err, out) {
            if (err) debug.die(err);
            evaluatedData.OUTPUTHTML = out;
            Mobify.acceptData(evaluatedData);
        });
    };

    // Bookkeeping after document.write is complete.
    Mobify.postDocWrite = function() {
        // Legacy google analytics call
        if (Mobify.ga && Mobify.ga.init) {
            Mobify.ga.init();        
        }

        if (config.isDebug) {
            timing.logPoints();
        }

        // JB: Livereload crashes Mobile Safari.
        if (config.isDebug > 1) {
            var m = (config.configFile.match(/^(?:https?:)?\/\/([^\/:]*)/) || '');

            var hostname = m[1] || location.hostname;

            if (!window.LiveReload) {
                document.write('<script defer src="//cdn.mobify.com/livereload.js#'
                + hostname + '"></script>');
            }
            
            if (config.isDebug > 2) {
                Mobify.weinre(hostname + ':8081');   
            }
        }
    }

    Mobify.weinre = function(host) {
        if (window.WeinreServerURL) return;
        
        var weinreScript = document.createElement('script');
        weinreScript.src = 'http://' + host + '/target/target-script-min.js#anonymous';
        document.body.appendChild(weinreScript);
    }

    // Kickstart processing, and submit analytics upon its success or failure
    Mobify.init = function(mode) {
        if (!/complete|loaded/.test(document.readyState)) {
            window.setTimeout(Mobify.init, 100);
            return;
        }

        if (mode == "livereload") {
            window.setTimeout(Mobify.load, 0);
            return;
        }
        config.started = true;

        // Protection against Mobify.snippet calling `document.write` after
        // `DOMContentLoaded`.
        Mobify.snippet = $.noop;
        
        Mobify.load();
    };

    if (Mobify.config.configFile.match(/\?livereload=\d+$/)) {
        setTimeout(Mobify.load, 0);
    }

})(this, document, Mobify);

Mobify.timing.addPoint('Walked Mobify.js');
