---
layout: doc
title: Matching Templates to URLs | Mobify.js Framework Documentation
---

# Matching Templates to URLs

Though you're encouraged to match templates in Mobify.js by locating unique DOM
elements, you can also match templates against URLs.

Mobify.js provides the `Mobify.urlmatch()` helper function to enable this. In
your konf, you pass it a string containing a Mobify path matching pattern, or a
regular expression, and it will return a function to be used to check whether
the URL of the page matches that pattern or expression.

For example, in your konf, in a call to the choose function, you could cause the
about template to be selected like so:

        {
            'templateName': 'about'
            , '!match': Mobify.urlmatch("/about/")
            , 'aboutus': function(context) {
                return $('#aboutus')
            }
        }

<h2 id="path-expressions"> Mobify.urlmatch() Path Expressions </h2>

Path expressions let you match templates to URL paths of pages on your site.

### Placeholder Matching

For example, a blog article might have the path
`/articles/2012/376562/15-ways-to-make-great-lists/`, but you could express the
paths for all articles using the pattern `"/articles/*/*/*/"`, or only articles
from 2012 with `"/articles/2012/*/*/"`. Here we see that `*` is used to mark a
path component as a variable that is allowed to differ, but must be present.

If our URL structure were different, and we used a category as the first
component of the URL like `/science/articles/72633/` and
`/politics/articles/95828`, but would like to match articles regardless of
category, we could use the expression `"/*/articles/*/"` to match both of these.

### Wildcard Matching

Other times, we would like to match all URLs prefixed with a common path, to do
this we use wildcard matching. For example, in a blog, a post without titles
would have a path such as `/post/29803152490` and a post with a title would have
a path of `/post/29800908081/10-best-10-best-lists of all-time`.

We can match both of these with the expression `"/post/*"`. Note the lack of a
trailing slash in comparison to the placeholder match: ending the expression
with `*` will cause any path components after the one specified to match.

### Examples


| Path Expression | Matching Path Examples |
|-----------------|------------------------|
| `"/"`           | `/`                    |
| `"/*"`          | Any path*              |
| `"/*/"`         | `/foo`, `/bar/`        |
| `"/foo"`        | `/foo`, `/foo/`        |
| `"/foo/*"`      | `/foo/bar`, `/foo/baz/`, `/foo/bar/baz`|
| `"/foo/bar"`    | `/foo/bar`, `/foo/bar/`|
| `"/*/bar"`      | `/foo/bar/`, `/baz/bar` |
| `"/foo/*/baz"`  | `/foo/bar/baz`, `/foo/qux/baz` |
| `"/foo/*/baz/*"`| `/foo/bar/baz/qux`, `/foo/qux/baz/quux/bar` |


\* The expression `"/*"` is a special case of the wildcard expression, it will
match any and every path, including `/`, other paths ending in the wildcard
match require _at least_ one path component present in place of the `*`.

## Matching with Regular Expressions

You can also pass in a JavaScript `RegExp` object, the returned function will
call the `RegExp`'s `.test()` method against `window.location.pathname` and if
it matches, return the expression, and otherwise return false.