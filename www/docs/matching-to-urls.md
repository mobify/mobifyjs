---
layout: doc
title: Matching Tempaltes to URLs
---

# Matching Templates to URLs

Though you're encouraged to match tempaltes in Mobify.js by locating unique DOM 
elements, you can also match templates against URLs.

Mobify.js provides the `Mobify.urlmatch()` helper function to enable this. In 
your konf, you pass it a string containing a Mobify path matching pattern, or a
regular expression, and it will return a function to be used to check whether the URL of the page matches that pattern or expression.

## Mobify Path Expressions

Path expressions let you match templates to URL paths of a certain form on your 
site. 

### Placeholder Matching

For example, a blog article might have the path 
`/articles/2012/376562/15-ways-to-make-great-lists/`, but you could express the 
paths for all articles using the pattern `"/articles/*/*/*/"`, or only articles 
from 2012 with `"/articles/2012/*/*/"`. Here we see that `*` is used to mark a 
path component as a variable that is allowed to differ, but must be present.

If our URL structure were different, and we used say, a category as the first 
compoenent of the URL like `/science/articles/72633/` and 
`/politics/articles/95828`, but would like to match articles regardless of 
category, we could use the expression `/*/articles/*/` to amtch both of these

### Wildcard Matching

Other times, we would like to match all URLs with a common path component 
prefix, to do this we use wildcard matching.