# HTML Monolith

This tool puts all JS and CSS files into html inline.

## Usage

``` js
var monolith = require('html-monolith');

var file = '/path/to/file.html';
var options = {
    js: true,
    css: true
};

var result = monolith.inlineSync(file, options);


// console.log(result);
{
    source: '<html>...</html>', // new html with inlined files
    files: [                    // files that were in-lined
      {
        tag: '<script src="scripts/app.js"></script>',  // tag which was replaced with inline content
        src: 'scripts/app.js',                          // relative path to inlined file
        path: '/path/to/scripts/app.js',                // absolute path to inlined file
        type: 'js'                                      // inlined file's type
      },
      {
        tag: '<link href="styles/custom.css" />',
        src: 'styles/custom.css',
        path: '/path/to/styles/custom.css',
        type: 'css'
      }
    ]
}


```
