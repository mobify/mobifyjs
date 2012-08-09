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
        parent.postMessage({key: key, value: value}, '*');
        // window.postMessage({
        //     dest: 'extension'
        //   , command: 'html'
        //   , key: key
        //   , value: value
        // }, '*');
    };

/**
 * Rather than just writing the emitted markup to the document... do something
 * else with it! Mwahahah!
 */
var oldEmitMarkup = Mobify.emitMarkup;
Mobify.emitMarkup = function(markup) {
    console.log('new emitMarkup');
    return oldEmitMarkup(markup);

    // debugger;
    // Mobify.studioJS.get('renderHTML', function(markup) {
    //     oldEmitMarkup(markup);
    // });
    // Mobify.studioJS.set('resultHTML', markup);
};

/**
 * Index the tags in the extracted HTML. Message the page's source HTML to the
 * controller.
 */
var oldExtractHTML = Mobify.html.extractHTML;
Mobify.html.extractHTML = function() {
    var captured = oldExtractHTML();

    // Send markup to main window!
    set('sourceHTML', captured.all());

    //$.each(captured, function(key, value) {
    //    captured[key] = indexTags(value);
    //});

    // Mobify.studioJS.set('sourceHTML', captured.all());
    return captured;
};

})(this, Mobify);