var fs = require('fs');
var path = require('path');

var debug = require('debug')('html-monolith');

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

function _inlineJS(source, dir, regex, inlinedFiles){
    var matches = _getMatches(source, regex);
    var files = _loadFiles(matches, dir);

    files.forEach(function(file){
        source = source.split(file.tag).join('<script>' + file.content + '</script>');
        inlinedFiles.push(file);
    });

    return source;
}

function _inlineCSS(source, dir, regex, inlinedFiles){
    var matches = _getMatches(source, regex);
    var files = _loadFiles(matches, dir);

    files.forEach(function(file){
        var content = _fixURLs(file, dir);
        source = source.split(file.tag).join('<style>' + content + '</style>');
        inlinedFiles.push(file);
    });

    return source;
}

function _fixURLs (file, relativeDir) {
    var regex = new RegExp('url\\((.+?)\\)', 'gi');
    var content = file.content;
    var matches = _getMatches(content, regex);

    var dir = path.parse(file.path).dir;

    matches.forEach(function(match){
        var css = match[0];
        var url = _trimQuotes(match[1]);
        var isAbsolute = /^(.+?:\/\/|\/)/.test(url);

        if (isAbsolute) return;

        var p = path.normalize(dir + '/' + url).split(path.normalize(relativeDir + '/')).join('').replace(path.sep, '/');
        content = content.split(url).join(p);
        debug('fix "%s" url "%s" to "%s"', file.src, url, p);
    });

    return content;
}

var inlineSync = function (filePath, options) {
    var dir = path.parse(filePath).dir;
    var source = fs.readFileSync(filePath, 'utf-8');
    var inlinedFiles = [];

    source = _inlineJS(source, dir, new RegExp('<script.+?src=(.*?)>.*?script>', 'gi'), inlinedFiles);
    source = _inlineCSS(source, dir, new RegExp('<link.+?href=(.+?)(\/|\\s.*?)?>', 'gi'), inlinedFiles);

    return {
        source: source,
        files: inlinedFiles
    };
};

module.exports = {
    inlineSync: inlineSync
};