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
  , affectedTagRe = new RegExp('/<!--[\\s\\S]*?-->'
      + '|<(script)([\\s\\S]*?)>([\\s\\S]*?<\\/script)'
      + '|<(img|iframe|link|style)([\\s\\S]*?)>()'
    , "gi")
  , attributeDisablingRes = {}
  , attributesToEnable = {}
  , attributeEnablingRe;

// Populate `attributesToEnable` and `attributesToEnable`.
$.each(disablingMap, function(tagName, targetAttributes) {
    $.each(targetAttributes, function(key, value) {
        attributesToEnable[value] = true;
    });

    // <space><attr>='...'|"..."
    attributeDisablingRes[tagName] = new RegExp(
        '\\s+((?:'
        + targetAttributes.join('|')
        + ")\\s*=\\s*(?:'([\\s\\S])+?'|\"([\\s\\S])+?\"))", 'gi');
})

attributeEnablingRe = new RegExp('\\sx-(' + keys(attributesToEnable).join('|') + ')', 'gi');

function disableAttributes(whole, tagName, openingTag, rest) {
    if (!tagName) return whole;

    tagName = tagName.toLowerCase();
    return result = '<' + tagName + (tagDisablers[tagName] || '')
        + openingTag.replace(attributeDisablingRes[tagName], ' x-$1') + '>' + rest;
}
    
// Returns a string with all external attributes disabled.
// Includes special handling for resources referenced in scripts and inside
// comments.
Mobify.html.disable = function(htmlStr) {    
    return htmlStr.replace(affectedTagRe, disableAttributes);
};

// Returns a string with all disabled external attributes enabled.
Mobify.html.enable = function(htmlStr) {
    return htmlStr.replace(attributeEnablingRe, ' $1').replace(tagEnablingRe, '');
};
    
})(Mobify.$, Mobify);