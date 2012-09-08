(function(Mobify) {

var openingScriptRe = /(<script[\s\S]*?>)/gi

    // Inline styles are scripts are disabled using a unkonwn type.
  , tagDisablers = {
        style: ' media="mobify-media"'
      , script: ' type="text/mobify-script"'
    }
  , tagEnablingRe = new RegExp(Mobify.iter.values(tagDisablers).join('|'), 'g')
  , disablingMap = { 
        img:    ['src']
      , iframe: ['src']
      , script: ['src', 'type']
      , link:   ['href']
      , style:  ['media']
    }
  , affectedTagList = Mobify.iter.keys(disablingMap)
  , affectedTagRe = new RegExp('<(' + affectedTagList.join('|') + ')([\\s\\S]*?)>', 'gi')
  , attributeDisablingRes = {}
  , attributesToEnable = {}
  , attributeEnablingRe;

// Populate `attributesToEnable` and `attributesToEnable`.
for (var tagName in disablingMap) {
    if (!disablingMap.hasOwnProperty(tagName)) continue;
    var targetAttributes = disablingMap[tagName];

    targetAttributes.forEach(function(value) {
        attributesToEnable[value] = true;
    });

    // <space><attr>='...'|"..."
    attributeDisablingRes[tagName] = new RegExp(
        '\\s+((?:'
        + targetAttributes.join('|')
        + ")\\s*=\\s*(?:('|\")[\\s\\S]+?\\2))", 'gi');
}

attributeEnablingRe = new RegExp('\\sx-(' + Mobify.iter.keys(attributesToEnable).join('|') + ')', 'gi');

function disableAttributes(whole, tagName, openingTag, rest) {
    if (!tagName) return whole;

    tagName = tagName.toLowerCase();
    return '<' + tagName + (tagDisablers[tagName] || '')
        + openingTag.replace(attributeDisablingRes[tagName], ' x-$1') + '>';
}
    
// Returns a string with all disabled external attributes enabled.
Mobify.html.enable = function(htmlStr) {    
    return htmlStr.replace(attributeEnablingRe, ' $1').replace(tagEnablingRe, '');
};

// Returns a string with all external attributes disabled.
// Includes special handling for resources referenced in scripts and inside
// comments.
Mobify.html.disableString = function(htmlStr) {
    var splitRe = /(<!--[\s\S]*?-->)|(?=<\/script)/i
      , tokens = htmlStr.split(splitRe)
      , ret = tokens.map(function(fragment) {
            var parsed;
 
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
}

Mobify.html.disable = function(htmlObj) {
    if (!htmlObj.htmlTag) {
        return Mobify.html.disableString(htmlObj);
    }

    var disabled = Mobify.iter.extend({}, htmlObj);
    disabled.headContent = Mobify.html.disableString(disabled.headContent);
    disabled.bodyContent = Mobify.html.disableString(disabled.bodyContent);

    return disabled;
};
    
})(Mobify);