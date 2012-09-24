/*
`UrlPattern` objects represent a set of free and fixed bits that can be used
to classify and match urls.
*/

Mobify.UrlPattern = (function() {
  var UrlPattern, parse;
  parse = (function() {
    var anchor;
    anchor = document.createElement("a");
    return function(url) {
      anchor.href = url;
      return {
        protocol: anchor.protocol,
        host: anchor.hostname,
        path: anchor.pathname,
        querystring: anchor.search
      };
    };
  })();
  /*
      @protocol
      @host
      @path
      @querystring
      @url
      @parsed
  */

  return UrlPattern = (function() {

    function UrlPattern(protocol, host, path, querystring, url) {
      this.protocol = protocol;
      this.host = host;
      this.path = path;
      this.querystring = querystring;
      this.url = url;
      this.parsed = parse(this.url);
    }

    UrlPattern.prototype.pathMatches = function(path) {
      var bit, bits, i, part, x, _i, _len;
      bits = (function() {
        var _i, _len, _ref, _results;
        _ref = path.split("/");
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          x = _ref[_i];
          if (x !== "") {
            _results.push(x);
          }
        }
        return _results;
      })();
      if (!bits.length) {
        bits = [""];
      }
      for (i = _i = 0, _len = bits.length; _i < _len; i = ++_i) {
        bit = bits[i];
        part = this.path[i];
        if (!part) {
          return false;
        }
        if (!part.fixed) {
          return true;
        }
        if (bit !== part.value) {
          return false;
        }
      }
      if (this.path.length > bits.length) {
        return false;
      }
      return true;
    };

    UrlPattern.prototype.matches = function(url) {
      var parsed;
      parsed = parse(url);
      return this.pathMatches(parsed.path);
    };

    UrlPattern.prototype.possiblePaths = function() {
      var bits, i, parts, possible, x, _i, _ref;
      possible = [];
      bits = (function() {
        var _i, _len, _ref, _results;
        _ref = this.parsed.path.split("/");
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          x = _ref[_i];
          if (x !== "") {
            _results.push(x);
          }
        }
        return _results;
      }).call(this);
      if (!bits.length) {
        return [
          [
            {
              fixed: true,
              value: ""
            }
          ], [
            {
              fixed: false
            }
          ]
        ];
      }
      for (i = _i = 0, _ref = bits.length; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
        parts = (function() {
          var _j, _len, _ref1, _results;
          _ref1 = bits.slice(0, (-i - 1) + 1 || 9e9);
          _results = [];
          for (_j = 0, _len = _ref1.length; _j < _len; _j++) {
            x = _ref1[_j];
            _results.push({
              fixed: true,
              value: x
            });
          }
          return _results;
        })();
        if (i > 0) {
          parts.push({
            fixed: false
          });
        }
        possible.push(parts);
      }
      return possible;
    };

    UrlPattern.prototype.pathEquals = function(path) {
      var bit, i, _i, _len, _ref;
      if (path.length !== this.path.length) {
        return false;
      }
      _ref = this.path;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        bit = _ref[i];
        if (path[i].fixed !== bit.fixed || path[i].value !== bit.value) {
          return false;
        }
      }
      return true;
    };

    UrlPattern.prototype.toString = function() {
      var part, path, _i, _len, _ref;
      path = [];
      _ref = this.path;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        part = _ref[_i];
        if (part.fixed) {
          path.push(part.value);
        } else {
          path.push("*");
        }
      }
      return "/" + path.join("/");
    };

    UrlPattern.prototype.toJSON = function() {
      return {
        protocol: this.protocol,
        host: this.host,
        path: this.path,
        querystring: this.querystring,
        url: this.url
      };
    };

    UrlPattern.create = function(url) {
      var bit, bits, host, parsed, path, protocol, querystring, x;
      parsed = parse(url);
      protocol = {
        fixed: false
      };
      host = [
        {
          fixed: false
        }
      ];
      querystring = [
        {
          fixed: false
        }
      ];
      bits = (function() {
        var _i, _len, _ref, _results;
        _ref = parsed.path.split("/");
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          x = _ref[_i];
          if (x !== "") {
            _results.push(x);
          }
        }
        return _results;
      })();
      path = (function() {
        var _i, _len, _ref, _results;
        _ref = bits.slice(0, -1);
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          bit = _ref[_i];
          _results.push({
            fixed: true,
            value: bit
          });
        }
        return _results;
      })();
      path.push({
        fixed: false
      });
      return new UrlPattern(protocol, host, path, querystring, url);
    };

    UrlPattern.fromObject = function(o) {
      return new UrlPattern(o.protocol, o.host, o.path, o.querystring, o.url);
    };

    return UrlPattern;

  })();
})();