/**
 * Working API for StudioJS.
 *
 * 1. Transformation takes place. Page HTML is stored.
 * 2. When we're done, send the transformation onward.
 */
(function(window, Mobify) {
    
// Do it... just do it!
// if (!window.enableStudioJS) return;

// if you are in an iframe... and its studio.. then load.
var Modes = {
        Source: "source"
      , Preview: "preview"
    }
  , mode = Modes.Preview

if (/mobify-studiojs=source/.test(window.location.hash)){
    mode = Modes.Source;
}

var $ = Mobify.$

    /**
     * Send a message to Studio.
     */
  , postMessage = function(key, value) {
        parent.postMessage({action: key, value: value}, '*');
    };


/**
 * In `Source` mode, we render the `source` markup with our special choosey 
 * JavaScript and send the `result` to the App.
 */
if (mode == Modes.Source) {
    var dataToJson = function(data) {
            var json = {};

            for (var key in data) {
                if (!data.hasOwnProperty(key)) return;

                var value = data[key];
                var type = typeof value;

                if (type == undefined || type == "undefined") {
                    // console.log('undefined')
                } else if (type == "string") {
                    json[key] = value;
                } else if (value.__proto__ == Array.prototype) {
                    json[key] = dataToJson(value);
                } else if (Object.prototype.toString.call(value) === '[object Object]') {
                    json[key] = dataToJson(value);
                } else if (value instanceof Mobify.$.fn.constructor) {
                    json[key] = "" + value;
                } else {
                    json[key] = "" + value;
                }   
            }

            return json
        }

    var oldEmitMarkup = Mobify.transform.emitMarkup;
    Mobify.transform.emitMarkup = function(adaptedHtml) {
        // console.log('SourceViewIframe: All ready to go!');
        var data = Mobify.evaluatedData;
        var json = dataToJson(data);
        var sourceHtml = Mobify.html.extractHTML().all();
        var index = sourceHtml.indexOf("</body>");
        if (!index) return console.error('Cannot find </body>.')

        // Load the StudioJS interface. Remove `requirejs` so we can continue
        // to use our side effect dependant module loading anti-pattern :)
        sourceHtml = sourceHtml.substring(0, index) 
                   + "<link rel='stylesheet' href='http://cloud-dev.mobify.com:8000/static/choose/assets/css/index.css'>"
                   + "<script>requirejs = require = define = undefined</script>"
                   + "<script data-main='http://cloud-dev.mobify.com:8000/static/choose/app/config' src='http://cloud-dev.mobify.com:8000/static/choose/assets/js/libs/require.js'></script>"
                   + sourceHtml.substring(index);

        postMessage('result', {html: adaptedHtml, data: json});
        
        oldEmitMarkup(sourceHtml);
    };

/**
 * In `Preview` mode, await `result` message from the App for rendering.
 * We render it using `document.write` when it comes in and then setup
 * to recieve more messages.
 */
} else {
    Mobify.transform.run = function() {
        var onMessage = function onMessage(event) {
                // console.log('PreviewFrame: Got Message:', event);
                var data = event.data;
                if (data.action !== 'result') return;

                var html = data.value
                var index = html.indexOf('</body>')
                if (!index) return console.error('Cannot find </body>.')

                // Rebind to receive the next message.
                html = html.substring(0, index)
                     + "<script>window.addEventListener('message', " + onMessage.toString() + ", '*');<\/script>" 
                     + html.substring(index);

                document.open();
                document.write(html);
                document.close();
            }

        window.addEventListener('message', onMessage, false);
        // console.log('PreviewFrame: Waiting for result from App.');
    }
}

})(this, Mobify);