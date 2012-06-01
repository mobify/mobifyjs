(function($, Mobify) {

var keys = function(obj) { return $.map(obj, function(val, key) { return key }) }
  , values = function(obj) { return $.map(obj, function(val, key) { return val }) }

  , openingScriptRe = new RegExp('(<script[\\s\\S]*?>)', 'gi')

    // Inline styles are scripts are disabled using a unkonwn type.
  , tagDisablers = {
        style: ' media="mobify-media"'
      , script: ' type="text/mobify-script"'
    }
  , tagEnablingRe = new RegExp(values(tagDisablers).join('|'), 'g')
  , disablingMap = { 
        img:    ['src']
      , iframe: ['src']
      , script: ['src', 'type']
      , link:   ['href']
      , style:  ['media']
    }
  , affectedTagRe = new RegExp('<(' + keys(disablingMap).join('|') + ')([\\s\\S]*?)>', 'gi')
  , attributeDisablingRes = {}
  , attributesToEnable = {}
  , attributeEnablingRe
  , HTML = Mobify.html = Mobify.html || {};

// Populate `attributesToEnable` and `attributesToEnable`.
$.each(disablingMap, function(tagName, targetAttributes) {
    $.each(targetAttributes, function(key, value) {
        attributesToEnable[value] = true;
    });

    // Special treatment for images - disable existing width/height attributes.
    if (tagName === 'img') {
        targetAttributes = targetAttributes.concat('width', 'height')
    }

    // <space><attr>='...'|"..."
    attributeDisablingRes[tagName] = new RegExp(
        '\\s+((?:'
        + targetAttributes.join('|')
        + ")\\s*=\\s*(?:'([\\s\\S])+?'|\"([\\s\\S])+?\"))", 'gi');
})

attributeEnablingRe = new RegExp('\\sx-(' + keys(attributesToEnable).join('|') + ')', 'gi');


function disableAttributes(whole, tagName, tail) {
    tagName = tagName.toLowerCase();
    return result = '<' + tagName + (tagDisablers[tagName] || '')
        + tail.replace(attributeDisablingRes[tagName], ' x-$1') + '>';
}

$.extend(HTML, {       
    // Returns a string with all external attributes disabled.
    // Includes special handling for resources referenced in scripts and inside
    // comments.
    disable: function(htmlStr) {            
        var splitRe = /(<!--[\s\S]*?-->)|(?=<\/script)/i
          , tokens = htmlStr.split(splitRe)
          , ret = tokens.map(function(fragment) {
                var parsed

                // Fragment may be empty or just a comment, no need to escape those.
                if (!fragment) return '';
                if (/^<!--/.test(fragment)) return fragment;

                // Disable before and the <script> itself.
                // parsed = [before, <script>, script contents]
                parsed = fragment.split(openingScriptRe);
                parsed[0] = parsed[0].replace(affectedTagRe, disableAttributes);
                if (parsed[1]) parsed[1] = parsed[1].replace(affectedTagRe, disableAttributes);
                return parsed;
            });

        return [].concat.apply([], ret).join('');
    },

    // Returns a string with all disabled external attributes enabled.
    enable: function(htmlStr) {
        return htmlStr.replace(attributeEnablingRe, ' $1').replace(tagEnablingRe, '');
    }
});
    
})(Mobify.$, Mobify);