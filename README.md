# HTML Monolith

This tool puts all js and css files into html inline.

## Usage

``` js
var monolith = require('html-monolith');

var filePath = '/full/path/to/file.html';
var options = {
    js: true,
    css: true
};

var result = monolith.inlineSync('path/to/html/file', options);


```