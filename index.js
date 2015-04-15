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

function _inline(source, dir, regex, wrapStart, wrapEnd, inlinedFiles){
    var matches = _getMatches(source, regex);

    matches.map(function(match){
        var file = {
            tag: match[0],
            src: _trimQuotes(match[1].trim()),
        };
        file.path = dir + '/' + file.src;

        if(!fs.existsSync(file.path)) return null;
        var content = fs.readFileSync(file.path, 'utf-8');
        file.content = content;

        return file;

    }).forEach(function(file){
        if (!file) return;
        source = source.split(file.tag).join(wrapStart + file.content + wrapEnd);
        inlinedFiles.push(file);
    });

    return source;
}

var inlineSync = function (filePath, options) {
    var dir = path.parse(filePath).dir;
    var source = fs.readFileSync(filePath, 'utf-8');
    var inlinedFiles = [];

    source = _inline(source, dir, new RegExp('<script.+?src=(.*?)>.*?script>', 'gi'), '<script>', '</script>', inlinedFiles);
    source = _inline(source, dir, new RegExp('<link.+?href=(.+?)(\/|\\s.*?)?>', 'gi'), '<style>', '</style>', inlinedFiles);

    return {
        source: source,
        files: inlinedFiles
    };
};

module.exports = {
    inlineSync: inlineSync
};