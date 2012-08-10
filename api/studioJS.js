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

  , _tagIndex = 0

    /**
     * Adds a unique `mobifyjsindex` attribute to nodes found in `html`.
     */
  , indexTags = function(html) {
        var tagIndex = /<![\s\S]*?>|[^<]+|<!--[\s\S]*?-->|(<script)([\s\S]*?<\/script>)|(<\w+)((?:[^>'"]*|'[^']*?'|"[^"]*?")*\/?>)/gi
        
        return html.replace(tagIndex, function(all, scriptName, scriptTail, name, tail) {
            name = name || scriptName;
            tail = tail || scriptTail;
            if (!name) return all;
            return name + ' mobifyjsindex="src' + tagIndex++ + '"' + tail;
        });
    }

    // Get the page content and pass it along.
  , get = function(key, callback) {

        // ???
        var handler = function(event) {
                if ((event.data.command === 'html')
                 && (event.data.dest === 'page')
                 && (event.data.key === key)
                 && (event.source === window)) {
                    
                    window.removeEventListener("message", handler, false);

                    callback(event.data.value, event.data.key);    
                }
            };

        window.addEventListener("message", handler, false);
    }

    /**
     * Send a message to Studio.
     */
  , set = function(key, value) {
        parent.postMessage({action: key, value: value}, '*');
    };


if (mode == Modes.Source) {


    /**
     * In `Source` mode, we render the `source` markup with our special choosey 
     * JavaScript and send the `result` to the App.
     */
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
        var data = Mobify.evaluatedData;

        var json = dataToJson(data);

        // console.log('SourceViewIframe: Ready to message - ', json);

        var sourceHtml = Mobify.html.extractHTML().all();
        var index = sourceHtml.indexOf("</body>");
        // These scripts will also be responsible for binding 'after docwrite'
        // listeners.
        sourceHtml = sourceHtml.substring(0, index) 
                   + "<link rel='stylesheet' href='http://cloud-dev.mobify.com:8000/static/choose/assets/css/index.css'>"
                   + "<script data-main='http://cloud-dev.mobify.com:8000/static/choose/app/config' src='http://cloud-dev.mobify.com:8000/static/choose/assets/js/libs/require.js'></script>" 
                   + sourceHtml.substring(index);
        
        // We could get rid of some things here.
        set('result', {html: adaptedHtml, data: json});
        
        oldEmitMarkup(sourceHtml);
    };

    /**
      * Index the tags in the extracted HTML. Message the page's source HTML to the
      * controller.
      */
    // var oldExtractHTML = Mobify.html.extractHTML;
    // Mobify.html.extractHTML = function() {
    //   var captured = oldExtractHTML();
    //   set('sourceHTML', captured.all());
    //   //$.each(captured, function(key, value) {
    //   //    captured[key] = indexTags(value);
    //   //});
    //   // Mobify.studioJS.set('sourceHTML', captured.all());
    //   return captured;
    // };

} else {
    /**
     * In `Preview` mode, this window awaits `result` HTML from the App.
     * We render it using `document.write` when it comes in and then setup
     * to recieve more messages.
     */
    Mobify.transform.run = function() {
        var onMessage = function onMessage(event) {
                // console.log('PreviewFrame: Got Message:', event);
                var data = event.data;
                if (data.action !== 'result') return;

                var html = data.value
                var index = html.indexOf('</body')
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