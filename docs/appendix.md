# Appendix

1. Debugging
	- Tools
	- Debugging the Konf
	- Debugging Templates
2. Common Errors
3. Dust.js Documentation


1. Debugging

## Tools

Debugging Mobify.js adaptations requires the use of an advanced web inspection tool like Webkit Inspector or Firebug. You're likely well-acquainted with one of these, but here are a few quick start tips if not.

**Webkit Inspector**

Webkit Inspector is built in to Safari and Chrome. To initialize, open the browser's 'View' menu and select the Developer option. Opening either Developer Tools or JavaScript Console will pop up the Inspector.

If using Safari, you may have to first enable the development menu. Open Safari Preferences and select the Advanced tab, then check the development menu checkbox.

Once open, you can switch back and forth between JavaScript Console and DOM views with the 'Console' and 'Elements' tabs at top, respectively.

*Firebug*

If you're using Firefox, you will need to [install Firebug] http://getfirebug.com/. Once installed, in the browser's 'View' menu, click the 'Firebug' option at the bottom to initialize.

Once open, you can switch back and forth between JavaScript Console and DOM views with the 'Console' and 'HTML' tabs at top, respectively.

For more on getting started with Firebug, watch this [helpful video] http://www.youtube.com/watch?v=2xxfvuZFHsM


## Debugging the Konf

Since the konf is written in JavaScript, you will often find syntax or logic errors springing up as you develop. The best way to debug the konf object is with the Webkit Inspector or the Firebug extension.

Once in development mode, you can view context (the result of the evaluated konf object) since it is logged to the JavaScript console. Look for a the item 'All Extracted Data', which you can expand to see exactly what values were assigned to which keys. **Note**: Extracted Data will not be present after you have published your mobile site, it can only be viewed by browsing your site through http://preview.mobify.com/

If you are stumped you can add a `debugger;` statement into your konf object that will cause the inspector's debugger to pause as the konf is evaluated:

    'content': function(context) {
        debugger;
        return $('.content')
    }


## Debugging Templates (Viewing source, inspecting rendered DOM)

Mobify.js adaptations are evaluated against the original DOM, but the latter is what you'll see if you view the page source. This isn't terribly helpful when you need insight into whether a particular adaptation is working or not.

In situations where you need to view the rendered DOM, use Firebug or the WebKit inspector.

The DOM tab (labelled 'HTML' or 'Elements') displays a DOM tree that outlines the post-adaptation DOM. You are able to browse this tree and view the full result of the Mobify adaptation.


## Common Errors

Any errors Mobify.js encounters during execution will be logged in the Webkit Inspector / Firebug JavaScript Console. When things don't appear to be working, we suggest starting there.

* Page is blank, doesn't render at all

Usually this will be accompanied by the error message: "Uncaught SyntaxError: Unexpected string".

SOLUTION: Ensure that you have a comma after every key within your konf, ie.

    'header': {
        ...
    },
    'content': {

    },

* {some-key} displayed on the page

When a variable is rendered to the page instead of parsed with data from your konf, this likely means you have used an illegal character in the key.

SOLUTION: Don't use illegal characters in keys. This includes almost all non-alphanumeric characters, ie. dashes (-), periods (.), commas (,), plus signs (+), etc.


## Dust.js Documentation

Mobify.js templates extend the Dust.js JavaScript templating language. For more advanced examples of the syntax, you might find it helpful to browse the [Dust documentation] http://akdubya.github.com/dustjs/.

You will likely find there to be differences in terminology and syntax, so we suggest making sure you're knowledgable about Mobify.js templates before doing so.
