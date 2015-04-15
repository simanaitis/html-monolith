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

var inlineSync = function (filePath, options) {
    var dir = path.parse(filePath).dir;
    var source = fs.readFileSync(filePath, 'utf-8');
    var inlinedFiles = [];

    // JS
    var matches = _getMatches(source, new RegExp('<script.+?src=(.*?)>.*?script>', 'gi'));

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
        source = source.split(file.tag).join('<script>' + file.content + '</script>');
        inlinedFiles.push(file);
    });

    // CSS
    var matches = _getMatches(source, new RegExp('<link.+?href=(.+?)(\/|\\s.*?)?>', 'gi'));

    matches.map(function(match){
        debug(match)
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
        source = source.split(file.tag).join('<style>' + file.content + '</style>');
        inlinedFiles.push(file);
    });

    return {
        source: source,
        inlinedFiles: inlinedFiles
    };
};

module.exports = {
    inlineSync: inlineSync
};