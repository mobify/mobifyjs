(function () {
var mobifyjs_utils = function () {
        var Utils = {};
        Utils.extend = function (target) {
            [].slice.call(arguments, 1).forEach(function (source) {
                for (var key in source)
                    if (source[key] !== undefined)
                        target[key] = source[key];
            });
            return target;
        };
        Utils.keys = function (obj) {
            var result = [];
            for (var key in obj) {
                if (obj.hasOwnProperty(key))
                    result.push(key);
            }
            return result;
        };
        Utils.values = function (obj) {
            var result = [];
            for (var key in obj) {
                if (obj.hasOwnProperty(key))
                    result.push(obj[key]);
            }
            return result;
        };
        Utils.clone = function (obj) {
            var target = {};
            for (var i in obj) {
                if (obj.hasOwnProperty(i)) {
                    target[i] = obj[i];
                }
            }
            return target;
        };
        var _absolutifyAnchor = document.createElement('a');
        Utils.absolutify = function (url) {
            _absolutifyAnchor.href = url;
            return _absolutifyAnchor.href;
        };
        var _httpUrlRE = /^https?/;
        Utils.httpUrl = function (url) {
            return _httpUrlRE.test(url);
        };
        Utils.outerHTML = function (el) {
            if (el.outerHTML) {
                return el.outerHTML;
            } else {
                var div = document.createElement('div');
                div.appendChild(el.cloneNode(true));
                var contents = div.innerHTML;
                div = null;
                return contents;
            }
        };
        Utils.getDoctype = function (doc) {
            doc = doc || document;
            var doctypeEl = doc.doctype || [].filter.call(doc.childNodes, function (el) {
                    return el.nodeType == Node.DOCUMENT_TYPE_NODE;
                })[0];
            if (!doctypeEl)
                return '';
            return '<!DOCTYPE HTML' + (doctypeEl.publicId ? ' PUBLIC "' + doctypeEl.publicId + '"' : '') + (doctypeEl.systemId ? ' "' + doctypeEl.systemId + '"' : '') + '>';
        };
        Utils.removeBySelector = function (selector, doc) {
            doc = doc || document;
            var els = doc.querySelectorAll(selector);
            return Utils.removeElements(els, doc);
        };
        Utils.removeElements = function (elements, doc) {
            doc = doc || document;
            for (var i = 0, ii = elements.length; i < ii; i++) {
                var el = elements[i];
                el.parentNode.removeChild(el);
            }
            return elements;
        };
        var cachedLocalStorageSupport;
        Utils.supportsLocalStorage = function () {
            if (cachedLocalStorageSupport !== undefined) {
                return cachedLocalStorageSupport;
            }
            var mod = 'modernizr';
            try {
                localStorage.setItem(mod, mod);
                localStorage.removeItem(mod);
                cachedLocalStorageSupport = true;
            } catch (e) {
                cachedLocalStorageSupport = false;
            }
            return cachedLocalStorageSupport;
        };
        Utils.matchMedia = function (doc) {
            
            var bool, docElem = doc.documentElement, refNode = docElem.firstElementChild || docElem.firstChild, fakeBody = doc.createElement('body'), div = doc.createElement('div');
            div.id = 'mq-test-1';
            div.style.cssText = 'position:absolute;top:-100em';
            fakeBody.style.background = 'none';
            fakeBody.appendChild(div);
            return function (q) {
                div.innerHTML = '&shy;<style media="' + q + '"> #mq-test-1 { width: 42px; }</style>';
                docElem.insertBefore(fakeBody, refNode);
                bool = div.offsetWidth === 42;
                docElem.removeChild(fakeBody);
                return {
                    matches: bool,
                    media: q
                };
            };
        };
        Utils.domIsReady = function (doc) {
            var doc = doc || document;
            return doc.attachEvent ? doc.readyState === 'complete' : doc.readyState !== 'loading';
        };
        Utils.getPhysicalScreenSize = function (devicePixelRatio) {
            function multiplyByPixelRatio(sizes) {
                var dpr = devicePixelRatio || window.devicePixelRatio || 1;
                sizes.width = Math.round(sizes.width * dpr);
                sizes.height = Math.round(sizes.height * dpr);
                return sizes;
            }
            var iOS = navigator.userAgent.match(/ip(hone|od|ad)/i);
            var androidVersion = (navigator.userAgent.match(/android (\d)/i) || {})[1];
            var sizes = {
                    width: window.outerWidth,
                    height: window.outerHeight
                };
            if (!iOS) {
                if (androidVersion > 3)
                    return multiplyByPixelRatio(sizes);
                return sizes;
            }
            var isLandscape = window.orientation % 180;
            if (isLandscape) {
                sizes.height = screen.width;
                sizes.width = screen.height;
            } else {
                sizes.width = screen.width;
                sizes.height = screen.height;
            }
            return multiplyByPixelRatio(sizes);
        };
        return Utils;
    }();
var mobifyjs_capture = function (Utils) {
        if (window.Mobify && !window.Mobify.capturing && document.getElementsByTagName('plaintext').length) {
            window.Mobify.capturing = true;
        }
        var openingScriptRe = /(<script[\s\S]*?>)/gi;
        var tagDisablers = {
                style: ' media="mobify-media"',
                script: ' type="text/mobify-script"'
            };
        var tagEnablingRe = new RegExp(Utils.values(tagDisablers).join('|'), 'g');
        var disablingMap = {
                img: ['src'],
                source: ['src'],
                iframe: ['src'],
                script: [
                    'src',
                    'type'
                ],
                link: ['href'],
                style: ['media']
            };
        var affectedTagRe = new RegExp('<(' + Utils.keys(disablingMap).join('|') + ')([\\s\\S]*?)>', 'gi');
        var attributeDisablingRes = {};
        var attributesToEnable = {};
        for (var tagName in disablingMap) {
            if (!disablingMap.hasOwnProperty(tagName))
                continue;
            var targetAttributes = disablingMap[tagName];
            targetAttributes.forEach(function (value) {
                attributesToEnable[value] = true;
            });
            attributeDisablingRes[tagName] = new RegExp('\\s+((?:' + targetAttributes.join('|') + ')\\s*=\\s*(?:(\'|")[\\s\\S]+?\\2))', 'gi');
        }
        function nodeName(node) {
            return node.nodeName.toLowerCase();
        }
        function escapeQuote(s) {
            return s.replace('"', '&quot;');
        }
        function extractHTMLStringFromElement(container) {
            if (!container)
                return '';
            return [].map.call(container.childNodes, function (el) {
                var tagName = nodeName(el);
                if (tagName == '#comment')
                    return '<!--' + el.textContent + '-->';
                if (tagName == 'plaintext')
                    return el.textContent;
                if (tagName == 'script' && (/mobify/.test(el.src) || /mobify/i.test(el.textContent))) {
                    return '';
                }
                return el.outerHTML || el.nodeValue || Utils.outerHTML(el);
            }).join('');
        }
        var cachedDiv = document.createElement('div');
        var Capture = function (sourceDoc, prefix) {
            this.sourceDoc = sourceDoc;
            this.prefix = prefix || 'x-';
            if (window.Mobify)
                window.Mobify.prefix = this.prefix;
        };
        Capture.init = Capture.initCapture = function (callback, doc, prefix) {
            var doc = doc || document;
            var createCapture = function (callback, doc, prefix) {
                var capture = new Capture(doc, prefix);
                var capturedStringFragments = capture.createDocumentFragmentsStrings();
                Utils.extend(capture, capturedStringFragments);
                var capturedDOMFragments = capture.createDocumentFragments();
                Utils.extend(capture, capturedDOMFragments);
                callback(capture);
            };
            if (Utils.domIsReady(doc)) {
                createCapture(callback, doc, prefix);
            } else {
                var created = false;
                var create = function () {
                    if (!created) {
                        created = true;
                        iid && clearInterval(iid);
                        createCapture(callback, doc, prefix);
                    }
                };
                var iid = setInterval(function () {
                        if (Utils.domIsReady(doc)) {
                            create();
                        }
                    }, 100);
                doc.addEventListener('readystatechange', create, false);
            }
        };
        Capture.removeClosingTagsAtEndOfString = function (html) {
            var match = html.match(/((<\/[^>]+>)+)$/);
            if (!match)
                return html;
            return html.substring(0, html.length - match[0].length);
        };
        Capture.removeTargetSelf = function (html) {
            return html.replace(/target=("_self"|\'_self\')/gi, '');
        };
        Capture.cloneAttributes = function (sourceString, dest) {
            var match = sourceString.match(/^<(\w+)([\s\S]*)$/i);
            cachedDiv.innerHTML = '<div' + match[2];
            [].forEach.call(cachedDiv.firstChild.attributes, function (attr) {
                try {
                    dest.setAttribute(attr.nodeName, attr.nodeValue);
                } catch (e) {
                    console.error('Error copying attributes while capturing: ', e);
                }
            });
            return dest;
        };
        Capture.disable = function (htmlStr, prefix) {
            var self = this;
            var disableAttributes = function () {
                    return function (whole, tagName, tail) {
                        lowercaseTagName = tagName.toLowerCase();
                        return result = '<' + lowercaseTagName + (tagDisablers[lowercaseTagName] || '') + tail.replace(attributeDisablingRes[lowercaseTagName], ' ' + prefix + '$1') + '>';
                    };
                }();
            var splitRe = /(<!--[\s\S]*?-->)|(?=<\/script)/i;
            var tokens = htmlStr.split(splitRe);
            var ret = tokens.map(function (fragment) {
                    var parsed;
                    if (!fragment)
                        return '';
                    if (/^<!--/.test(fragment))
                        return fragment;
                    parsed = fragment.split(openingScriptRe);
                    parsed[0] = parsed[0].replace(affectedTagRe, disableAttributes);
                    if (parsed[1])
                        parsed[1] = parsed[1].replace(affectedTagRe, disableAttributes);
                    return parsed;
                });
            return [].concat.apply([], ret).join('');
        };
        Capture.enable = function (htmlStr, prefix) {
            var attributeEnablingRe = new RegExp('\\s' + prefix + '(' + Utils.keys(attributesToEnable).join('|') + ')', 'gi');
            return htmlStr.replace(attributeEnablingRe, ' $1').replace(tagEnablingRe, '');
        };
        Capture.openTag = function (element) {
            if (!element)
                return '';
            if (element.length)
                element = element[0];
            var stringBuffer = [];
            [].forEach.call(element.attributes, function (attr) {
                stringBuffer.push(' ', attr.name, '="', escapeQuote(attr.value), '"');
            });
            return '<' + nodeName(element) + stringBuffer.join('') + '>';
        };
        Capture.prototype.createDocumentFragmentsStrings = function () {
            var doc = this.sourceDoc;
            var headEl = doc.getElementsByTagName('head')[0] || doc.createElement('head');
            var bodyEl = doc.getElementsByTagName('body')[0] || doc.createElement('body');
            var htmlEl = doc.getElementsByTagName('html')[0];
            captured = {
                doctype: Utils.getDoctype(doc),
                htmlOpenTag: Capture.openTag(htmlEl),
                headOpenTag: Capture.openTag(headEl),
                bodyOpenTag: Capture.openTag(bodyEl),
                headContent: extractHTMLStringFromElement(headEl),
                bodyContent: extractHTMLStringFromElement(bodyEl)
            };
            captured.all = function (inject) {
                return this.doctype + this.htmlOpenTag + this.headOpenTag + (inject || '') + this.headContent + this.bodyContent;
            };
            var bodySnatcher = /<!--(?:[\s\S]*?)-->|(<\/head\s*>|<body[\s\S]*$)/gi;
            var rawHTML = captured.bodyContent = captured.headContent + captured.bodyContent;
            captured.headContent = '';
            for (var match; match = bodySnatcher.exec(rawHTML); match) {
                if (!match[1])
                    continue;
                if (match[1][1] == '/') {
                    captured.headContent = rawHTML.slice(0, match.index);
                    captured.bodyContent = rawHTML.slice(match.index + match[1].length);
                } else {
                    captured.headContent = captured.head || rawHTML.slice(0, match.index);
                    captured.bodyContent = match[0];
                    var parseBodyTag = /^((?:[^>'"]*|'[^']*?'|"[^"]*?")*>)([\s\S]*)$/.exec(captured.bodyContent);
                    if (parseBodyTag) {
                        captured.bodyOpenTag = parseBodyTag[1];
                        captured.bodyContent = parseBodyTag[2];
                    }
                    break;
                }
            }
            return captured;
        };
        Capture.prototype.restore = function () {
            var self = this;
            var doc = self.sourceDoc;
            var restore = function () {
                doc.removeEventListener('readystatechange', restore, false);
                setTimeout(function () {
                    doc.open();
                    doc.write(self.all());
                    doc.close();
                }, 15);
            };
            if (Utils.domIsReady(doc)) {
                restore();
            } else {
                doc.addEventListener('readystatechange', restore, false);
            }
        };
        Capture.prototype.setElementContentFromString = function (el, htmlString) {
            for (cachedDiv.innerHTML = htmlString; cachedDiv.firstChild; el.appendChild(cachedDiv.firstChild));
        };
        Capture.prototype.createDocumentFragments = function () {
            var docFrags = {};
            var doc = docFrags.capturedDoc = document.implementation.createHTMLDocument('');
            var htmlEl = docFrags.htmlEl = doc.documentElement;
            var headEl = docFrags.headEl = htmlEl.firstChild;
            var bodyEl = docFrags.bodyEl = htmlEl.lastChild;
            Capture.cloneAttributes(this.htmlOpenTag, htmlEl);
            Capture.cloneAttributes(this.headOpenTag, headEl);
            Capture.cloneAttributes(this.bodyOpenTag, bodyEl);
            bodyEl.innerHTML = Capture.disable(this.bodyContent, this.prefix);
            var disabledHeadContent = Capture.disable(this.headContent, this.prefix);
            try {
                headEl.innerHTML = disabledHeadContent;
            } catch (e) {
                var title = headEl.getElementsByTagName('title')[0];
                title && headEl.removeChild(title);
                this.setElementContentFromString(headEl, disabledHeadContent);
            }
            htmlEl.appendChild(headEl);
            htmlEl.appendChild(bodyEl);
            return docFrags;
        };
        Capture.prototype.escapedHTMLString = function () {
            var doc = this.capturedDoc;
            var html = Capture.enable(Utils.outerHTML(doc.documentElement), this.prefix);
            var htmlWithDoctype = this.doctype + html;
            return htmlWithDoctype;
        };
        Capture.prototype.render = function (htmlString) {
            var escapedHTMLString;
            if (!htmlString) {
                escapedHTMLString = this.escapedHTMLString();
            } else {
                escapedHTMLString = Capture.enable(htmlString);
            }
            var doc = this.sourceDoc;
            if (window.Mobify)
                window.Mobify.capturing = false;
            setTimeout(function () {
                doc.open('text/html', 'replace');
                doc.write(escapedHTMLString);
                doc.close();
            });
        };
        Capture.prototype.getCapturedDoc = function (options) {
            return this.capturedDoc;
        };
        Capture.getMobifyLibrary = function (doc) {
            var doc = doc || document;
            var mobifyjsScript = doc.getElementById('mobify-js');
            if (!mobifyjsScript) {
                mobifyjsScript = doc.getElementsByTagName('script')[0];
                mobifyjsScript.id = 'mobify-js';
                mobifyjsScript.setAttribute('class', 'mobify');
            }
            return mobifyjsScript;
        };
        Capture.getMain = function (doc) {
            var doc = doc || document;
            var mainScript = undefined;
            if (window.Mobify && window.Mobify.mainExecutable) {
                mainScript = document.createElement('script');
                mainScript.innerHTML = 'var main = ' + window.Mobify.mainExecutable.toString() + '; main();';
                mainScript.id = 'main-executable';
                mainScript.setAttribute('class', 'mobify');
            } else {
                mainScript = doc.getElementById('main-executable');
            }
            return mainScript;
        };
        Capture.insertMobifyScripts = function (sourceDoc, destDoc) {
            var mobifyjsScript = Capture.getMobifyLibrary(sourceDoc);
            var head = destDoc.head;
            var mainScript = Capture.getMain(sourceDoc);
            if (mainScript) {
                var mainClone = destDoc.importNode(mainScript, false);
                if (!mainScript.src) {
                    mainClone.innerHTML = mainScript.innerHTML;
                }
                head.insertBefore(mainClone, head.firstChild);
            }
            var mobifyjsClone = destDoc.importNode(mobifyjsScript, false);
            head.insertBefore(mobifyjsClone, head.firstChild);
        };
        Capture.prototype.renderCapturedDoc = function (options) {
            Capture.insertMobifyScripts(this.sourceDoc, this.capturedDoc);
            if (window.Mobify && window.Mobify.points) {
                var body = this.bodyEl;
                var date = this.capturedDoc.createElement('div');
                date.id = 'mobify-point';
                date.setAttribute('style', 'display: none;');
                date.innerHTML = window.Mobify.points[0];
                body.insertBefore(date, body.firstChild);
            }
            this.render();
        };
        return Capture;
    }(mobifyjs_utils);
var mobifyjs_resizeImages = function (Utils) {
        var ResizeImages = window.ResizeImages = {};
        var localStorageWebpKey = 'Mobify-Webp-Support-v2';
        function persistWebpSupport(supported) {
            if (Utils.supportsLocalStorage()) {
                var webpSupport = {
                        supported: supported,
                        date: Date.now()
                    };
                localStorage.setItem(localStorageWebpKey, JSON.stringify(webpSupport));
            }
        }
        ResizeImages.userAgentWebpDetect = function (userAgent) {
            var supportedRe = /(Android\s|Chrome\/|Opera9.8*Version\/..\.|Opera..\.)/i;
            var unsupportedVersionsRe = new RegExp('(Android\\s(0|1|2|3|(4(?!.*Chrome)))\\.)|(Chrome\\/[0-8]\\.)' + '|(Chrome\\/9\\.0\\.)|(Chrome\\/1[4-6]\\.)|(Android\\sChrome\\/1.\\.)' + '|(Android\\sChrome\\/20\\.)|(Chrome\\/(1.|20|21|22)\\.)' + '|(Opera.*(Version/|Opera\\s)(10|11)\\.)', 'i');
            if (!supportedRe.test(userAgent)) {
                return false;
            }
            if (unsupportedVersionsRe.test(userAgent)) {
                return false;
            }
            return true;
        };
        ResizeImages.dataUriWebpDetect = function (callback) {
            var image = new Image();
            image.onload = function () {
                var support = image.width === 1 ? true : false;
                persistWebpSupport(support);
                if (callback)
                    callback(support);
            };
            image.src = 'data:image/webp;base64,UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAABBxAR/Q9ERP8DAABWUDggGAAAADABAJ0BKgEAAQABgBwlpAADcAD+/gbQAA==';
        };
        ResizeImages.supportsWebp = function (callback) {
            if (Utils.supportsLocalStorage()) {
                var webpSupport;
                var storedSupport = localStorage.getItem(localStorageWebpKey);
                storedSupport && (webpSupport = JSON.parse(storedSupport));
                if (webpSupport && Date.now() - webpSupport.date < 604800000) {
                    return webpSupport.supported;
                }
            }
            ResizeImages.dataUriWebpDetect(callback);
            var support = ResizeImages.userAgentWebpDetect(navigator.userAgent);
            persistWebpSupport(support);
            return support;
        };
        ResizeImages.getImageURL = function (url, options) {
            var opts = options;
            if (!opts) {
                opts = ResizeImages.processOptions();
            }
            var bits = [opts.proto + opts.host];
            if (opts.projectName) {
                var projectId = 'project-' + opts.projectName;
                bits.push(projectId);
            }
            if (opts.cacheHours) {
                bits.push('c' + opts.cacheHours);
            }
            if (opts.format) {
                bits.push(opts.format + (opts.quality || ''));
            }
            if (opts.maxWidth) {
                bits.push(opts.maxWidth);
                if (opts.maxHeight) {
                    bits.push(opts.maxHeight);
                }
            }
            bits.push(url);
            return bits.join('/');
        };
        ResizeImages._rewriteSrcAttribute = function (element, opts, srcVal) {
            srcVal = element.getAttribute(opts.sourceAttribute) || srcVal;
            if (srcVal) {
                var url = Utils.absolutify(srcVal);
                if (Utils.httpUrl(url)) {
                    if (opts.onerror) {
                        element.setAttribute('onerror', opts.onerror);
                    }
                    element.setAttribute(opts.targetAttribute, ResizeImages.getImageURL(url, opts));
                    element.setAttribute('data-orig-src', srcVal);
                    if (!capturing && opts.sourceAttribute != opts.targetAttribute) {
                        element.removeAttribute(opts.sourceAttribute);
                    }
                }
            }
        };
        ResizeImages._resizeSourceElement = function (element, opts, rootSrc) {
            var width = element.getAttribute('data-width');
            var localOpts = opts;
            if (width) {
                localOpts = Utils.clone(opts);
                localOpts.maxWidth = width;
            }
            ResizeImages._rewriteSrcAttribute(element, localOpts, rootSrc);
        };
        ResizeImages._crawlPictureElement = function (el, opts) {
            var sources = el.getElementsByTagName('source');
            if (sources.length === 0 || el.hasAttribute('mobify-optimized')) {
                return;
            }
            el.setAttribute('mobify-optimized', '');
            var rootSrc = el.getAttribute('data-src');
            for (var i = 0, len = sources.length; i < len; i++) {
                ResizeImages._resizeSourceElement(sources[i], opts, rootSrc);
            }
        };
        var targetDims = [
                320,
                640,
                768,
                1080,
                1536,
                2048,
                4000
            ];
        ResizeImages._getBinnedDimension = function (dim) {
            var resultDim = 0;
            for (var i = 0, len = targetDims.length; i < len; i++) {
                resultDim = targetDims[i];
                if (resultDim >= dim) {
                    break;
                }
            }
            return resultDim;
        };
        ResizeImages.processOptions = function (options) {
            var opts = Utils.clone(ResizeImages.defaults);
            if (options) {
                Utils.extend(opts, options);
            }
            var dpr = opts.devicePixelRatio || window.devicePixelRatio;
            var screenSize = Utils.getPhysicalScreenSize(dpr);
            var width = opts.maxWidth || ResizeImages._getBinnedDimension(screenSize.width);
            var height = opts.maxHeight || undefined;
            if (dpr && opts.maxWidth) {
                width = width * dpr;
                if (opts.maxHeight) {
                    height = height * dpr;
                }
            }
            opts.maxWidth = Math.ceil(width);
            if (opts.maxHeight && height) {
                opts.maxHeight = Math.ceil(height);
            }
            if (!opts.format && opts.webp) {
                opts.format = 'webp';
            }
            return opts;
        };
        ResizeImages.resize = function (elements, options) {
            var opts = ResizeImages.processOptions(options);
            for (var i = 0; i < elements.length; i++) {
                var element = elements[i];
                if (element.nodeName === 'IMG' && !element.hasAttribute('mobify-optimized')) {
                    element.setAttribute('mobify-optimized', '');
                    ResizeImages._rewriteSrcAttribute(element, opts);
                } else if (element.nodeName === 'PICTURE') {
                    ResizeImages._crawlPictureElement(element, opts);
                }
            }
            return elements;
        };
        ResizeImages.restoreOriginalSrc = function (event) {
            var origSrc;
            event.target.removeAttribute('onerror');
            origSrc = event.target.getAttribute('data-orig-src');
            if (origSrc) {
                event.target.setAttribute('src', origSrc);
            }
        };
        var capturing = window.Mobify && window.Mobify.capturing || false;
        ResizeImages.defaults = {
            proto: '//',
            host: 'ir0.mobify.com',
            projectName: 'oss-' + location.hostname.replace(/[^\w]/g, '-'),
            sourceAttribute: 'x-src',
            targetAttribute: capturing ? 'x-src' : 'src',
            webp: ResizeImages.supportsWebp(),
            onerror: 'ResizeImages.restoreOriginalSrc(event);'
        };
        return ResizeImages;
    }(mobifyjs_utils);
var mobifyjs_jazzcat = function (Utils, Capture) {
        var httpCache = {
                cache: {},
                options: {},
                utils: {}
            };
        var localStorageKey = 'Mobify-Jazzcat-Cache-v1.0';
        httpCache.reset = function (val) {
            httpCache.cache = val || {};
        };
        httpCache.get = function (key, touch) {
            var resource = httpCache.cache[key.split('#')[0]];
            if (resource && touch) {
                resource.lastUsed = Date.now();
            }
            return resource;
        };
        httpCache.set = function (key, val) {
            httpCache.cache[key] = val;
        };
        httpCache.load = function (options) {
            var data = localStorage.getItem(localStorageKey);
            var key;
            var staleOptions;
            if (options && options.overrideTime !== undefined) {
                staleOptions = { overrideTime: options.overrideTime };
            }
            if (!data) {
                return;
            }
            try {
                data = JSON.parse(data);
            } catch (err) {
                return;
            }
            for (key in data) {
                if (data.hasOwnProperty(key) && !httpCache.utils.isStale(data[key], staleOptions)) {
                    httpCache.set(key, data[key]);
                }
            }
        };
        var canSave = true;
        httpCache.save = function (callback) {
            var attempts = 10;
            var resources;
            var key;
            if (!canSave) {
                return callback && callback('Save currently in progress');
            }
            canSave = false;
            (function persist() {
                var store = function () {
                    var resource;
                    var serialized;
                    var lruTime = 9007199254740991;
                    var lruKey;
                    resources = resources || Utils.clone(httpCache.cache);
                    try {
                        serialized = JSON.stringify(resources);
                    } catch (e) {
                        canSave = true;
                        return callback && callback(e);
                    }
                    try {
                        localStorage.setItem(localStorageKey, serialized);
                    } catch (e) {
                        if (!--attempts) {
                            canSave = true;
                            return callback && callback(e);
                        }
                        for (var key in resources) {
                            if (!resources.hasOwnProperty(key))
                                continue;
                            resource = resources[key];
                            if (resource.lastUsed) {
                                if (resource.lastUsed <= lruTime) {
                                    lruKey = key;
                                    lruTime = resource.lastUsed;
                                }
                            } else {
                                lruKey = key;
                                lruTime = 0;
                                break;
                            }
                        }
                        delete resources[lruKey];
                        return persist();
                    }
                    canSave = true;
                    callback && callback();
                };
                if (Utils.domIsReady()) {
                    store();
                } else {
                    setTimeout(persist, 15);
                }
            }());
        };
        var ccDirectives = /^\s*(public|private|no-cache|no-store)\s*$/;
        var ccMaxAge = /^\s*(max-age)\s*=\s*(\d+)\s*$/;
        httpCache.utils.ccParse = function (directives) {
            var obj = {};
            var match;
            directives.split(',').forEach(function (directive) {
                if (match = ccDirectives.exec(directive)) {
                    obj[match[1]] = true;
                } else if (match = ccMaxAge.exec(directive)) {
                    obj[match[1]] = parseInt(match[2], 10);
                }
            });
            return obj;
        };
        httpCache.utils.isStale = function (resource, options) {
            var ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
            var headers = resource.headers || {};
            var cacheControl = headers['cache-control'];
            var now = Date.now();
            var date = Date.parse(headers['date']);
            var expires;
            var lastModified = headers['last-modified'];
            var age;
            var modifiedAge;
            var overrideTime;
            if (date && now < date + 600 * 1000) {
                return false;
            }
            if (options && (overrideTime = options.overrideTime) && date) {
                return now > date + overrideTime * 60 * 1000;
            }
            if (cacheControl && date) {
                cacheControl = httpCache.utils.ccParse(cacheControl);
                if (cacheControl['max-age'] && !cacheControl['no-store'] && !cacheControl['no-cache']) {
                    return now > date + cacheControl['max-age'] * 1000;
                } else {
                    return true;
                }
            }
            if (headers.expires && (expires = Date.parse(headers.expires))) {
                return now > expires;
            }
            if (lastModified && (lastModified = Date.parse(lastModified)) && date) {
                modifiedAge = date - lastModified;
                age = now - date;
                if (age < 0.1 * modifiedAge && age < ONE_DAY_IN_MS) {
                    return false;
                }
            }
            return true;
        };
        var Jazzcat = window.Jazzcat = {
                httpCache: httpCache,
                write: document.write
            };
        Jazzcat.isIncompatibleBrowser = function (userAgent) {
            var match = /(firefox)[\/\s](\d+)|(opera[\s\S]*version[\/\s](11|12))/i.exec(userAgent || navigator.userAgent);
            if (match && match[1] && +match[2] < 12 || match && match[3] || !Utils.supportsLocalStorage() || !window.JSON) {
                return true;
            }
            return false;
        };
        Jazzcat.cacheLoaderInserted = false;
        Jazzcat.optimizeScripts = function (scripts, options) {
            if (options && options.cacheOverrideTime !== undefined) {
                Utils.extend(httpCache.options, { overrideTime: options.cacheOverrideTime });
            }
            scripts = Array.prototype.slice.call(scripts);
            if (!scripts.length || Jazzcat.isIncompatibleBrowser()) {
                return scripts;
            }
            options = Utils.extend({}, Jazzcat.defaults, options || {});
            var jsonp = options.responseType === 'jsonp';
            var concat = options.concat;
            var insertLoader = function (script, urls) {
                if (script) {
                    var loader = Jazzcat.getLoaderScript(urls, options);
                    script.parentNode.insertBefore(loader, script);
                }
            };
            var url;
            var toConcat = {
                    'head': {
                        firstScript: undefined,
                        urls: []
                    },
                    'body': {
                        firstScript: undefined,
                        urls: []
                    }
                };
            for (var i = 0, len = scripts.length; i < len; i++) {
                var script = scripts[i];
                if (script.hasAttribute('mobify-optimized') || script.hasAttribute('skip-optimize') || /mobify/i.test(script.className)) {
                    continue;
                }
                url = script.getAttribute(options.attribute);
                if (!url) {
                    continue;
                }
                url = Utils.absolutify(url);
                if (!Utils.httpUrl(url)) {
                    continue;
                }
                if (jsonp && !Jazzcat.cacheLoaderInserted) {
                    httpCache.load(httpCache.options);
                    var httpLoaderScript = Jazzcat.getHttpCacheLoaderScript();
                    script.parentNode.insertBefore(httpLoaderScript, script);
                    Jazzcat.cacheLoaderInserted = true;
                }
                var parent = script.parentNode.nodeName === 'HEAD' ? 'head' : 'body';
                if (jsonp) {
                    if (!httpCache.get(url)) {
                        if (!concat) {
                            insertLoader(script, [url]);
                        } else {
                            if (toConcat[parent].firstScript === undefined) {
                                toConcat[parent].firstScript = script;
                            }
                            toConcat[parent].urls.push(url);
                        }
                    }
                    script.type = 'text/mobify-script';
                    if (script.hasAttribute('onload')) {
                        var onload = script.getAttribute('onload');
                        script.innerHTML = options.execCallback + '(\'' + url + '\', \'' + onload.replace(/'/g, '\\\'') + '\');';
                        script.removeAttribute('onload');
                    } else {
                        script.innerHTML = options.execCallback + '(\'' + url + '\');';
                    }
                    script.removeAttribute(options.attribute);
                } else {
                    if (!concat) {
                        var jazzcatUrl = Jazzcat.getURL([url], options);
                        script.setAttribute(options.attribute, jazzcatUrl);
                    } else {
                        if (toConcat[parent].firstScript === undefined) {
                            toConcat[parent].firstScript = script;
                        }
                        toConcat[parent].urls.push(url);
                    }
                }
            }
            if (concat) {
                insertLoader(toConcat['head'].firstScript, toConcat['head'].urls);
                insertLoader(toConcat['body'].firstScript, toConcat['body'].urls);
            }
            if (!jsonp && concat) {
                for (var i = 0, len = scripts.length; i < len; i++) {
                    var script = scripts[i];
                    if (script.getAttribute(options.attribute)) {
                        script.parentNode.removeChild(script);
                    }
                }
            }
            return scripts;
        };
        Jazzcat.getHttpCacheLoaderScript = function () {
            var loadFromCacheScript = document.createElement('script');
            loadFromCacheScript.type = 'text/mobify-script';
            loadFromCacheScript.innerHTML = httpCache.options.overrideTime ? 'Jazzcat.httpCache.load(' + JSON.stringify(httpCache.options) + ');' : 'Jazzcat.httpCache.load();';
            return loadFromCacheScript;
        };
        Jazzcat.getLoaderScript = function (urls, options) {
            var loadScript;
            if (urls && urls.length) {
                loadScript = document.createElement('script');
                loadScript.setAttribute('mobify-optimized', '');
                loadScript.setAttribute(options.attribute, Jazzcat.getURL(urls, options));
            }
            return loadScript;
        };
        Jazzcat.getURL = function (urls, options) {
            var options = Utils.extend({}, Jazzcat.defaults, options || {});
            return options.base + (options.projectName ? '/project-' + options.projectName : '') + '/' + options.responseType + (options.responseType === 'jsonp' ? '/' + options.loadCallback : '') + '/' + encodeURIComponent(JSON.stringify(urls.slice().sort()));
        };
        var scriptSplitRe = /(<\/scr)(ipt\s*>)/gi;
        Jazzcat.exec = function (url, onload) {
            var resource = httpCache.get(url, true);
            var out;
            var onloadAttrAndVal = '';
            if (onload) {
                onload = ';' + onload + ';';
                onloadAttrAndVal = ' onload="' + onload + '"';
            } else {
                onload = '';
            }
            if (!resource) {
                out = 'src="' + url + '"' + onloadAttrAndVal + '>';
            } else {
                out = 'data-orig-src="' + url + '"';
                out += '>' + resource.body.replace(scriptSplitRe, '$1\\$2') + onload;
            }
            Jazzcat.write.call(document, '<script ' + out + '</script>');
        };
        Jazzcat.load = function (resources) {
            var resource;
            var i = 0;
            var save = false;
            if (!resources) {
                return;
            }
            while (resource = resources[i++]) {
                if (resource.status == 'ready' && resource.statusCode >= 200 && resource.statusCode < 300) {
                    save = true;
                    httpCache.set(encodeURI(resource.url), resource);
                }
            }
            if (save) {
                httpCache.save();
            }
        };
        Jazzcat.defaults = {
            selector: 'script',
            attribute: 'x-src',
            base: '//jazzcat.mobify.com',
            responseType: 'jsonp',
            execCallback: 'Jazzcat.exec',
            loadCallback: 'Jazzcat.load',
            concat: false,
            projectName: ''
        };
        return Jazzcat;
    }(mobifyjs_utils, mobifyjs_capture);
var mobifyjs_unblockify = function (Utils, Capture) {
        var Unblockify = {};
        Unblockify.moveScripts = function (scripts, doc) {
            Utils.removeElements(scripts, doc);
            for (var i = 0, ii = scripts.length; i < ii; i++) {
                var script = scripts[i];
                doc.body.appendChild(script);
            }
        };
        Unblockify.unblock = function (scripts) {
            var oldInsert = Capture.prototype.insertMobifyScripts;
            Capture.prototype.insertMobifyScripts = function () {
                oldInsert.call(this);
                var doc = this.capturedDoc;
                Unblockify.moveScripts(scripts, doc);
            };
        };
        return Unblockify;
    }(mobifyjs_utils, mobifyjs_capture);
var mobifyjs_cssOptimize = function (Utils) {
        var CssOptimize = window.cssOptimize = {};
        CssOptimize.getCssUrl = function (url, options) {
            var opts = Utils.extend({}, defaults, options);
            var bits = [opts.protoAndHost];
            if (opts.projectName) {
                bits.push('project-' + opts.projectName);
            }
            bits.push(opts.endpoint);
            bits.push(url);
            return bits.join('/');
        };
        CssOptimize._rewriteHref = function (element, options) {
            var attributeVal = element.getAttribute(options.targetAttribute);
            var url;
            if (attributeVal) {
                url = Utils.absolutify(attributeVal);
                if (Utils.httpUrl(url)) {
                    element.setAttribute('data-orig-href', attributeVal);
                    element.setAttribute(options.targetAttribute, CssOptimize.getCssUrl(url, options));
                    if (options.onerror) {
                        element.setAttribute('onerror', options.onerror);
                    }
                }
            }
        };
        CssOptimize.optimize = function (elements, options) {
            var opts = Utils.extend({}, defaults, options);
            var element;
            for (var i = 0, len = elements.length; i < len; i++) {
                element = elements[i];
                if (element.nodeName === 'LINK' && element.getAttribute('rel') === 'stylesheet' && element.getAttribute(opts.targetAttribute) && !element.hasAttribute('mobify-optimized')) {
                    element.setAttribute('mobify-optimized', '');
                    CssOptimize._rewriteHref(element, opts);
                }
            }
        };
        var restoreOriginalHref = CssOptimize.restoreOriginalHref = function (event) {
                var origHref;
                event.target.removeAttribute('onerror');
                if (origHref = event.target.getAttribute('data-orig-href')) {
                    event.target.setAttribute('href', origHref);
                }
            };
        var defaults = CssOptimize._defaults = {
                protoAndHost: '//jazzcat.mobify.com',
                endpoint: 'cssoptimizer',
                projectName: 'oss-' + location.hostname.replace(/[^\w]/g, '-'),
                targetAttribute: 'x-href',
                onerror: 'Mobify.CssOptimize.restoreOriginalHref(event);'
            };
        return CssOptimize;
    }(mobifyjs_utils);
var mobifyjs_external_picturefill = function (Utils, Capture) {
        var capturing = window.Mobify && window.Mobify.capturing || false;
        if (capturing) {
            var oldRenderCapturedDoc = Capture.prototype.renderCapturedDoc;
            Capture.prototype.renderCapturedDoc = function (options) {
                var imgsInPicture = this.capturedDoc.querySelectorAll('picture img');
                for (var i = 0, len = imgsInPicture.length; i < len; i++) {
                    var disableImg = imgsInPicture[i];
                    var srcAttr = window.Mobify && window.Mobify.prefix + 'src';
                    disableImg.setAttribute('data-orig-src', disableImg.getAttribute(srcAttr));
                    disableImg.removeAttribute(srcAttr);
                }
                oldRenderCapturedDoc.apply(this, arguments);
            };
            return;
        }
        window.matchMedia = window.matchMedia || Utils.matchMedia(document);
        (function (w) {
            
            var prefHD = false || w.localStorage && w.localStorage['picturefill-prefHD'] === 'true', hasHD;
            if (!!(w.document.createElement('picture') && w.document.createElement('source') && w.HTMLPictureElement)) {
                return;
            }
            w.picturefill = function () {
                var ps = w.document.getElementsByTagName('picture');
                for (var i = 0, il = ps.length; i < il; i++) {
                    var sources = ps[i].getElementsByTagName('source'), picImg = null, matches = [];
                    if (!sources.length) {
                        var picText = ps[i].innerHTML, frag = w.document.createElement('div'), srcs = picText.replace(/(<)source([^>]+>)/gim, '$1div$2').match(/<div[^>]+>/gim);
                        frag.innerHTML = srcs.join('');
                        sources = frag.getElementsByTagName('div');
                    }
                    for (var j = 0, jl = sources.length; j < jl; j++) {
                        var media = sources[j].getAttribute('media');
                        if (!media || w.matchMedia && w.matchMedia(media).matches) {
                            matches.push(sources[j]);
                        }
                    }
                    picImg = ps[i].getElementsByTagName('img')[0];
                    if (matches.length) {
                        var match = matches.pop(), srcset = match.getAttribute('srcset');
                        if (!picImg) {
                            picImg = w.document.createElement('img');
                            picImg.alt = ps[i].getAttribute('alt');
                            ps[i].appendChild(picImg);
                        }
                        if (srcset) {
                            var screenRes = prefHD && w.devicePixelRatio || 1, sources = srcset.split(',');
                            hasHD = w.devicePixelRatio > 1;
                            for (var res = sources.length, r = res - 1; r >= 0; r--) {
                                var source = sources[r].replace(/^\s*/, '').replace(/\s*$/, '').split(' '), resMatch = parseFloat(source[1], 10);
                                if (screenRes >= resMatch) {
                                    if (picImg.getAttribute('src') !== source[0]) {
                                        var newImg = document.createElement('img');
                                        newImg.src = source[0];
                                        newImg.onload = function () {
                                            this.width = this.cloneNode(true).width / resMatch;
                                        };
                                        picImg.parentNode.replaceChild(newImg, picImg);
                                    }
                                    break;
                                }
                            }
                        } else {
                            picImg.src = match.getAttribute('src');
                        }
                    }
                }
            };
            if (w.addEventListener) {
                w.addEventListener('resize', w.picturefill, false);
                w.addEventListener('DOMContentLoaded', function () {
                    w.picturefill();
                    w.removeEventListener('load', w.picturefill, false);
                }, false);
                w.addEventListener('load', w.picturefill, false);
            } else if (w.attachEvent) {
                w.attachEvent('onload', w.picturefill);
            }
        }(this));
        return;
    }(mobifyjs_utils, mobifyjs_capture);
(function (Utils, Capture, ResizeImages, Jazzcat, Unblockify, CssOptimize, mobifyjs_external_picturefill) {
    var Mobify = window.Mobify = window.Mobify || {};
    Mobify.Utils = Utils;
    Mobify.Capture = Capture;
    Mobify.ResizeImages = ResizeImages;
    Mobify.Jazzcat = Jazzcat;
    Mobify.CssOptimize = CssOptimize;
    Mobify.Unblockify = Unblockify;
    Mobify.api = '2.0';
    return Mobify;
}(mobifyjs_utils, mobifyjs_capture, mobifyjs_resizeImages, mobifyjs_jazzcat, mobifyjs_unblockify, mobifyjs_cssOptimize, mobifyjs_external_picturefill));
define("mobify-library", function(){});
}());