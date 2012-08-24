(function($, Mobify) {
    
if (!window.enableStudioJS) return;

var _tagIndex = 0;
var indexTags = function(html) {
    var tagIndex = /<![\s\S]*?>|[^<]+|<!--[\s\S]*?-->|(<script)([\s\S]*?<\/script>)|(<\w+)((?:[^>'"]*|'[^']*?'|"[^"]*?")*\/?>)/gi
      , result = html.replace(tagIndex, function(all, scriptName, scriptTail, name, tail) {
            name = name || scriptName;
            tail = tail || scriptTail;
            if (!name) return all;
            return name + ' mobifyjsindex="src' + tagIndex++ + '"' + tail;
        });
    return result;
}; 

var get = function(key, callback) {
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
};

var set = function(key, value) {
    window.postMessage({
        dest : 'extension',
        command : 'html',
        key: key,
        value: value
    }, '*');
};

var oldEmitMarkup = Mobify.emitMarkup;
Mobify.emitMarkup = function(markup) {
    Mobify.studioJS.get('renderHTML', function(markup) {
        oldEmitMarkup(markup);
    });
    Mobify.studioJS.set('resultHTML', markup);
};

var oldExtract = Mobify.html.extract;
Mobify.html.extract = function() {
    var captured = oldExtract.call(Mobify.html, markup);
    $.each(captured, function(key, value) {
        captured[key] = indexTags(value);
    });

    Mobify.studioJS.set('sourceHTML', captured.html());
    return result;
};

})(Mobify.$, Mobify);