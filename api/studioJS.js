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
     * Send a message to the app.
     */
  , set = function(key, value) {
        parent.postMessage({action: key, value: value}, '*');
    };


if (mode == Modes.Source) {
    /**
     * In `Source` mode, we render the `source` markup with our special choosey 
     * JavaScript and send the `result` to the App.
     */
    var oldEmitMarkup = Mobify.transform.emitMarkup;
    Mobify.transform.emitMarkup = function(markup) {    
      var original = Mobify.html.extractHTML().all();
      var index = original.indexOf("</body>");
      original = original.substring(0, index) + "<link rel='stylesheet' href='http://cloud-dev.mobify.com:8000/static/choose/assets/css/index.css'><script data-main='http://cloud-dev.mobify.com:8000/static/choose/app/config' src='http://cloud-dev.mobify.com:8000/static/choose/assets/js/libs/require.js'></script>" + original.substring(index)
      set('result', markup);
      oldEmitMarkup(original);
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
     * In `Preview` mode, the frame waits for the `result` HTML from the
     * app. We render it when it comes in. 
     */
    Mobify.transform.run = function() {
        var onMessage = function(event) {
                // console.log('PreviewFrame: Got Message:', event);
                var data = event.data;
                if (data.action !== 'result') return;
                document.open();
                document.write(data.value);
                document.close();
            }

        window.addEventListener('message', onMessage, false);
        // console.log('PreviewFrame: Waiting for result from App.')'
    }
}

})(this, Mobify);