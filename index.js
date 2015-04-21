var fs = require('fs');
var path = require('path');

var merge = require('merge');
var debug = require('debug')('html-monolith');

var defaultOptions = {
    js: true,
    css: true
};

function _getMatches(string, regex) {
    var matches = [];
    var match;
    while (match = regex.exec(string)) {
        matches.push(match);
    }
    return matches;
}

function _trimQuotes(string) {
    return string.replace(/^['"]+|['"]+$/gm, '');
}

function _readFile(path) {
    if(!fs.existsSync(path)) return null;
    return fs.readFileSync(path, 'utf-8');
}

function _loadFiles(matches, dir) {
    return matches.map(function(match){
        var file = {
            tag: match[0],
            src: _trimQuotes(match[1].trim()),
        };
        file.path = dir + '/' + file.src;

        file.content = _readFile(file.path);

        if (!file.content) return null;

        return file;
    }).filter(function(element){
        return !!element;
    });
}

function _addResult(file, array) {
    array.push({
        src: file.src,
        tag: file.tag,
        path: file.path,
        type: file.type
    });

    debug('inlined', file.src);
}

function _inlineJS(source, dir, inlinedFiles){
    var regex = new RegExp('<script.+?src=(.*?)>.*?script>', 'gi');
    var matches = _getMatches(source, regex);
    var files = _loadFiles(matches, dir);

    files.forEach(function(file){
        source = source.split(file.tag).join('<script>' + file.content + '</script>');
        file.type = 'js';
        _addResult(file, inlinedFiles);
    });

    return source;
}

function _inlineCSS(source, dir, inlinedFiles){
    var regex = new RegExp('<link.+?href=(.+?)(\/|\\s.*?)?>', 'gi');
    var matches = _getMatches(source, regex);
    var files = _loadFiles(matches, dir);

    files.forEach(function(file){
        var content = _fixURLs(file, dir);
        source = source.split(file.tag).join('<style>' + content + '</style>');
        file.type = 'css';
        _addResult(file, inlinedFiles);
    });

    return source;
}

function _fixURLs (file, relativeDir) {
    //var urlRegex = /url\((.+?)\)/gi; // handles url([URL])
    var urlRegex = /(@import.*?['"](.+?)['"]|url\((.+?)\))/gi;  // handles url([URL]) and @import '[URL]';
    var content = file.content;
    var matches = _getMatches(content, urlRegex);

    var dir = path.dirname(file.path);

    matches.forEach(function(match){
        var css = match[0];
        var url = _trimQuotes(match[2] || match[3]);
        var isAbsolute = /^(.+?:\/\/|\/)/.test(url);

        if (isAbsolute) return;

        var p = path.normalize(dir + '/' + url).split(path.normalize(relativeDir + '/')).join('').replace(path.sep, '/');
        content = content.split(url).join(p);
        debug('fix "%s" url "%s" to "%s"', file.src, url, p);
    });

    return content;
}

var inlineSync = function (filePath, options) {
    var options = merge(true, defaultOptions, options);

    var dir = path.dirname(filePath);
    var source = fs.readFileSync(filePath, 'utf-8');
    var inlinedFiles = [];

    if (options.js) source = _inlineJS(source, dir, inlinedFiles);
    if (options.css) source = _inlineCSS(source, dir, inlinedFiles);

    debug('total inlined files', inlinedFiles.length);

    return {
        source: source,
        files: inlinedFiles
    };
};

var inline = function (filePath, options, cb) {
    setTimeout(function(){
        var result = inlineSync(filePath, options);
        cb(result);
    }, 0);
}

module.exports = {
    inline: inline,
    inlineSync: inlineSync
};