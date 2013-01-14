// Hold on there cowboy. Are you thinking of updating this script?
// All changes must be tested and then pushed to mobify.s3.amazonaws.com/unmobify.js
// and portal/mobifyjs/reset.js
//
// This script can be loaded two ways:
// 1. As a fallback for when mobify.js didn't load correctly.
// 2. As part of mobify.js.
//
// If loaded as a fallback, it will restore the escaped content.
(function (document, Mobify, undefined) {

/** 
  Continue to unmobify for 5 minutes. 
  Compatibility: tag v3 and better 
  Set mobify-js=0 cookie for older tags (versions 5 and below).  
*/
var unmobifyFor = '; path=/; expires=' + (new Date((new Date).getTime() + (1000 * 60 * 5))).toUTCString();
document.cookie = 'mobify-js=0' + unmobifyFor;
document.cookie = 'mobify-path=//cdn.mobify.com/unmobify.js' + unmobifyFor;

// V4: Remove listeners. (iOS 4.3 does not clear listeners on `document`)
Mobify.beforeload && document.removeEventListener('beforeload', Mobify.beforeload, true);

// V4: Restore DOM methods.
Mobify.restoreMethods && Mobify.restoreMethods();

// V3/5: Prevent any further damage.
Mobify.snippet = function(){};

// V6: We've loaded.
Mobify.api = true;

var tagVersion = parseInt(Mobify.tagVersion && Mobify.tagVersion[0] || Mobify.config.tagVersion)

    // Are we in Studio mode.
  , studio = Mobify.studioJS

    // Do we support capturing of content with <textarea>s as well as <style>s?
  , textareaHead = tagVersion >= 4

    // V4 content types start with mobify, which makes more sense,
    // as class names start the same way.
    // v3 tags use 'text/mobify' type
  , grabStyleType = textareaHead ? 'mobify/grab' : 'text/mobify'

    // JB: This is duplicated in `jquery.outerhtml.js`.
    // el.outerHTML comptability for firefox.
  , outerHTML = !!document.createElement('div').outerHTML 
        ? function(el) {
            return el.outerHTML;
          }
        : (function() {
            var wrap = document.createElement('div');
            return function(el) {
                wrap.appendChild(el.cloneNode(true))
                var ret = wrap.innerHTML;
                wrap.removeChild(wrap.firstChild);
                return ret;
            }
          })()

    // Given DOM node `element`, return a string for its opening tag.
  , openTag = function(element) {
        var acc = []
          , attrs = element.attributes
          , name, value;

        for (var i = 0; i < attrs.length; i++) {
            name = attrs[i].name;
            value = attrs[i].value;
            acc.push(' ', name, '="', value.replace('"', '&quot;'), '"');
        }

        return '<' + element.nodeName.toLowerCase() + acc.join('') + '>';
    }

    // Given DOM node `element`, return a string for its closing tag.
  , closeTag = function(element) {
        return '</' + element.nodeName.toLowerCase() + '>';
    }

    // Given document `doc`, return a string for its doctype.
  , doctype = function() {
        var doctypeEl = [].slice.apply(document.childNodes).filter(function(el) {
                return el.nodeType == Node.DOCUMENT_TYPE_NODE
            })[0],
            doctypeStr = '';
        
        if (doctypeEl) {
            doctypeStr = '<!DOCTYPE HTML'
            + (doctypeEl.publicId ? ' PUBLIC "' + doctypeEl.publicId + '"' : '')
            + (doctypeEl.systemId ? ' "' + doctypeEl.systemId + '"' : '')
            + '>';            
        }

        return doctypeStr;
    }

  , _tagIndex = 0
  , indexTags = function(html) {
        var result
          , tagIndex = /<![\s\S]*?>|[^<]+|<!--[\s\S]*?-->|(<script)([\s\S]*?<\/script>)|(<\w+)((?:[^>'"]*|'[^']*?'|"[^"]*?")*\/?>)/gi
          , result = html.replace(tagIndex, function(all, scriptName, scriptTail, name, tail) {
                name = name || scriptName;
                tail = tail || scriptTail;
                if (!name) return all;
                return name + ' mobifyjsindex="src' + (_tagIndex++) + '"' + tail;
            });

        return result;
    }

    // Returns unesacped content from escaped `container` by extracting
    // the content of <style|textarea|plaintext> tags.
  , singleElementUnescape = function(container) {
        if (container && container.length) {
            container = container[0];
        }

        // Terminating </style> or </textarea> are wrapped in boilerplate
        // for validationClean it from the captured content.
        // V4: <script type="mobify/skip"><![CDATA[</style><script type="mobify/skip">
        // V3:
        var cleanTerminators = textareaHead
                //? new RegExp(
                //    '(<script type="mobify/skip"></style>)?' +
                //    '<script type="mobify/skip">$')
                ? new RegExp('<script type="mobify/skip"><!\\[CDATA\\[</style><script type="mobify/skip">$')
                : /<\/?noscript>(<!--<!\[CDATA\[-->|<style>)?$/

          , result = [].slice.apply(container.childNodes).map(function(el) {
                var nodeName = el.nodeName && el.nodeName.toLowerCase();

                if (nodeName == '#comment') {
                    // JB: el.nodevalue || el.textContent?
                    return '<!-- ' + el.nodeValue + '-->';
                
                // V5+ tags play beautifully yippy!
                } else if ((nodeName == 'plaintext') && (el.className == 'mobify-grab' || tagVersion > 5)) {
                    return el.textContent;            

                } else if (nodeName == 'style' && el.type == grabStyleType) {
                    // Remove terminator boilerplate.
                    var content = el.innerHTML;
                    content = content.replace(cleanTerminators, '');
                    // Escaped content ends on </style>, so legitimate <style> are
                    // not closed. Close them!
                    if (/<style/i.test(content)) content += '</style>';
                    return content;
                
                } else if (nodeName == 'textarea' && el.className == 'mobify-grab') {
                    // `innerText` doesn't need to be escaped, unlike `innerHTML`.
                    // http://clubajax.org/plain-text-vs-innertext-vs-textcontent/
                    var content = el.innerText || el.textContent;
                    content = content.replace(cleanTerminators, '');
                    if (/<textarea/i.test(content)) content += '</textarea>';
                    return content;

                // V5+: Catches leading nodes before our tag and anything we inserted.
                // Skip nodes that we added: 
                // <script class="mobify-skip">
                // <script class="mobify-ignore">
                // <script src="mobify.js">
                // <script src="unmobify.js">
                // Skip the bootstrap:
                // <script>window.Mobify
                // Add leading nodes. Firefox checks `wholeText` for TextNodes.
                } else {
                    if (/ mobify-(?:skip|ignore) /.test(' ' + el.className + ' ')
                        || /^mobify/.test(el.type) 
                        || /mobify/.test(el.src)) {
                        return '';
                    }
                    
                    var content = el.nodeType === Node.ELEMENT_NODE
                        ? outerHTML(el)
                        : el.wholeText || el.nodeValue;
                    
                    if (/Mobify/.test(content)) return '';
                    return content;
                }
            }).join('');

        if (studio) result = indexTags(result);

        // JB: To confirm: do V6 tags suffer from this?
        if (tagVersion > 5) return result;

        // In iOS4.x async inserted `detect.js` may end up in an invalid location.
        // Eg. inside VIEWSTATE attribute. This ensures that the tag is removed, 
        // even if it appears far from home.
        result = result.replace(/<script class="mobify-(skip|ignore)" src="([^"]*)"><\/script>/gi, '');

        return result;
    }

    // This function used to be called with just one element to unescape.
    // However, v4 tags mix up things a little. When content is escaped with v4
    // tags, opening <body> tag will typically end up contained, and <textarea>
    // tag that wraps the <head>...</head> content will fall into body due to 
    // browsers not tolerating content within head. So, in case of v4 tags, we
    // will have to look at both head and body in conjunction to find where one
    // starts and the other ends. Meanwhile, v3 tags fall back to separate
    // treatment of head and body.
    //
    // Returns either:
    // 1. A single string.
    // 2. An Array of [headInnerHTML, bodyInnerHTML, ?openBodyTag]
  , unescapeStyleHacks = function(head, body) {
        var headHTML = singleElementUnescape(head)
          , bodyHTML = body && singleElementUnescape(body)
          , start, end;

        if (studio) {
            start = doctype() + openTag(document.documentElement).replace(/visibility:\s*hidden/, '') + openTag(head[0]);
            end = closeTag(body[0]) + closeTag(document.documentElement);
        }

        // Called by Mobify API variants from before 4.0 tags
        if (arguments.length == 1) {
            studio && studio.set('sourceHTML', start + headHTML);
            return headHTML;
        }
        
        // Called by 4.0-aware API running 3.x tags.
        if (!textareaHead) {
            studio && studio.set('sourceHTML',
                start + headHTML + closeTag(head[0]) + openTag(body[0]) + bodyHTML + end);
            return [headHTML, bodyHTML];
        }
        
        // V4+ escaped DOM:
        // <html>
        //   <head>
        //     <script>Mobify...</script>
        //   </head>
        //   <body>
        //     <plaintext>
        //       ...</head>
        //       <body>...</body>
        //       </html>
        //     </plaintext>
        //   </body>
        // </html>
        var rawHTML = headHTML + bodyHTML
            // Consume comments without grouping to avoid catching
            // <body> inside a comment, common with IE conditional comments.
          , bodySnatcher = /<!--(?:[\s\S]*?)-->|(<\/head\s*>|<body[\s\S]*$)/gi
          , match
          , headEndIndex
          , newHeadHTML = '';

        studio && studio.set('sourceHTML', start + rawHTML);

        // Search`rawHTML` for the head/body split.
        for (var match; match = bodySnatcher.exec(rawHTML); match) {
            // Hit comment. Skip!
            if (!match[1]) {
                continue;
            }

            // Hit </head. Gather <head> innerHTML.
            if (match[1][1] == '/') {
                headEndIndex = match.index + match[1].length;
                newHeadHTML = rawHTML.slice(0, match.index);

            // Hit <body. Gather <body> innerHTML.
            } else {

                // Missing </head. Everything to this point should be in <head>.
                if (!newHeadHTML) {
                    newHeadHTML = rawHTML.slice(0, match.index);
                }

                // Find the end of <body.
                var parseRest = /^((?:[^>'"]*|'[^']*?'|"[^"]*?")*>)([\s\S]*)$/.exec(match[0]);
                // Missing > for body. (theoretical)
                if (!parseRest) {
                    break;
                }

                // [headInnerHTML, bodyInnerHTML, bodyOpenTag]
                return [newHeadHTML, parseRest[2], parseRest[1]];
            }
        }

        // JB: WHEN WOULD THIS HAPPEN?
        // <body Body tag was leaked into the page. We should use it directly.
        if (headEndIndex) return [newHeadHTML, rawHTML.slice(headEndIndex)];
        
        // Missing <body.
        return ['', rawHTML]
    }

    // When the `document` is ready, begin unmobifying.
    // V4 tags use this property name. Do not change.
    // Set once `unmobify` begins to prevent double loading.
    // v3 tags use this property. Do not change.
  , unmobify = Mobify.unmobify = function() {
        Mobify.bail = true;

        // IE/Opera need a second.
        // Testing with Chrome, sometimes `readyState` will be `interactive` and
        // then `DOMContentLoaded` will not fire.
        if (/complete|loaded|interactive/.test(document.readyState)) {
            unmobifier();
        } else {
            document.addEventListener('DOMContentLoaded', unmobifier, false);
        }
    }

    // Gather escaped content from the DOM, unescaped it, and then use 
    // `document.write` to revert to the original page.
  , unmobifier = function() {
        document.removeEventListener('DOMContentLoaded', unmobifier, false);

        var headEl = document.getElementsByTagName('head')[0] || document.createElement('head')
          , bodyEl = document.getElementsByTagName('body')[0] || document.createElement('body')
          , htmlEl = document.getElementsByTagName('html')[0]
            // If used as part of the API, content will be ready, otherwise find it.
          , headMarkup = Mobify.headMarkup
          , bodyMarkup = Mobify.bodyMarkup
          , bodyOpenTag = openTag(bodyEl)
          , rawMarkup;

        if (!Mobify.headMarkup && !Mobify.bodyMarkup) {
            rawMarkup = unescapeStyleHacks(headEl, bodyEl);
            headMarkup = rawMarkup[0];
            bodyMarkup = rawMarkup[1];
            // V4+ tags capture <body> while older tags use `document.body`.
            bodyOpenTag = rawMarkup[2] || bodyOpenTag;
        }

        var headHTML = openTag(headEl) + headMarkup + closeTag(headEl)
          , bodyHTML = bodyOpenTag + bodyMarkup + closeTag(bodyEl)
          , htmlHTML = openTag(htmlEl) + headHTML + bodyHTML + closeTag(htmlEl)
          , result = doctype() + htmlHTML;

        // Wait up for IE, which isn't ready to do this just yet.
        // JB: This will occasionally fail on IE.
        setTimeout(function() {
            document.open();
            document.write(result);
            document.close();

            // JB: Not needed in V5+.
            document.getElementsByTagName('html')[0].style.visibility = 'visible';

            // Record that we unmobified - deprecated.
            Mobify.fireAnalytics && Mobify.fireAnalytics();

        }, 15);
    }

  , externals = Mobify.externals;

// If loaded as part of the API, expose methods.
if (externals && !externals.unescapeStyleHacks) {
    externals.unescapeStyleHacks = unescapeStyleHacks;
    externals.singleElementUnescape = singleElementUnescape;

// If loaded standalone then unmobify if we aren't already.
} else if (!Mobify.bail) {
    unmobify();
}

})(document, Mobify);