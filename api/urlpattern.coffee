###
`UrlPattern` objects represent a set of free and fixed bits that can be used
to classify and match urls.
###
declareUrlPattern = ->
    # Returns a parsed url object.
    parse = do ->
        anchor = document.createElement "a"

        (url) ->
            anchor.href = url
            protocol: anchor.protocol
            host: anchor.hostname
            path: anchor.pathname
            querystring: anchor.search

    # Returns an Array of path bits.
    splitPath = (path) ->
        (x for x in (path.split "/") when x isnt "")

    # Returns an Array of possible paths based on `@url`.
    possiblePaths = (path) ->
        bits = splitPath path

        # Handle the empty path.
        if not bits.length
            return [
                [{fixed: true, value: ""}], 
                [{fixed: false}]
            ]

        possible = []

        # Create increasingly free paths.
        for i in [0..bits.length]
            parts = ({fixed: true, value: x} for x in bits[0..(-i - 1)])
            if i > 0 
                parts.push fixed: false

            possible.push parts

        possible
    

    ###
    @protocol
    @host
    @path
    @querystring
    @url
    @parsed
    ###
    class UrlPattern
        constructor: (@protocol, @host, @path, @querystring, @url) ->
            @parsed = parse @url

        # Returns `true` if `path` matches our `@path`.
        pathMatches: (path) ->
            bits = splitPath path
            if not bits.length
                bits = [""]

            for bit, i in bits
                part = @path[i]

                if not part
                    return false

                if not part.fixed
                    return true

                if bit isnt part.value
                    return false

            if @path.length > bits.length
                return false

            true

        # Returns `true` if `url` matches.
        matches: (url) ->
            parsed = parse url
            @pathMatches parsed.path


        # Returns `true` if `path` matches all parts of `@path`.
        pathEquals: (path) ->
            if path.length isnt @path.length
                return false

            for part, i in @path
                if path[i].fixed isnt part.fixed or path[i].value isnt part.value
                    return false
            
            true

        toString: ->
            @pathToString @path

        toJSON: ->
            protocol: @protocol
            host: @host
            path: @path
            querystring: @querystring
            url: @url

        pathToString: (path) ->
            path = path or @path
            "/" + (for part in path
                if part.fixed
                    part.value
                else
                    "*"
            ).join("/")

        possiblePaths: ->
            possiblePaths @parsed.path

        # Returns the last `bit` of @url's path.
        lastPathPartString: ->
            bits = splitPath @parsed.path
            bits[bits.length - 1]

        # Returns a `UrlPattern` with a single degree of freedom on the path.
        @create: (url) ->
            parsed = parse url
            protocol = {fixed: false}
            host = [{fixed: false}]
            querystring = [{fixed: false}]
            path = possiblePaths(parsed.path)[0]
            new UrlPattern protocol, host, path, querystring, url

        # Returns a `UrlPattern` constructed from object `o`.
        @fromObject: (o) ->
            new UrlPattern o.protocol, o.host, o.path, o.querystring, o.url

# Load using define() if it is present
if define? and ('function' is typeof define) 
    define([], declareUrlPattern)
# Or add it to the Mobify object if present
else if window.Mobify? and (window.Mobify instanceof Object)
    window.Mobify.UrlPattern = declareUrlPattern()
# Otherwsie make a global definition
else
    false