var mockFs = require('mock-fs');
var monolith = require('../index.js');

describe('HTML Monolith', function() {

    afterEach(function(){
        mockFs.restore();
    });

    it("should return same file when there are no css/js includes in it", function() {

        var html = '<head></head><body>Hello this is a dog</body>';

        mockFs({
            'file.html': html
        });

        var result = monolith.inlineSync('file.html');

        expect(result.source).toBe(html);
        expect(result.files.length).toEqual(0);
    });

    it("should not replace js script tag with inline if file is not found", function() {

        var html = '<head><script src="js/js.js"></script></head><body>Hello this is a dog</body>';

        mockFs({
            'file.html': html
        });

        var result = monolith.inlineSync('file.html');

        expect(result.source).toBe(html);
        expect(result.files.length).toEqual(0);
    });

    it("should not replace css tag with inline if file is not found", function() {

        var html = '<head><link src="css/style.css"></head><body>Hello this is a dog</body>';

        mockFs({
            'file.html': html
        });

        var result = monolith.inlineSync('file.html');

        expect(result.source).toBe(html);
        expect(result.files.length).toEqual(0);
    });

    describe('inlining js', function() {

        var html, js;

        beforeEach(function(){
            html = '<head><script src="js/js.js"></script></head><body></body>';
            js = 'var a;';
            mockFs({
                'file.html': html,
                'js/js.js': js
            });
        });

        afterEach(function(){
            mockFs.restore();
        });

        it("should replace js script tag with inline js block", function() {
            var output = '<head><script>' + js + '</script></head><body></body>';
            var file = {
                src: 'js/js.js',
                tag: '<script src="js/js.js"></script>',
                path: 'js/js.js',
                type: 'js'
            };

            var result = monolith.inlineSync('file.html');

            expect(result.source).toBe(output);
            expect(result.files).toContain(file);
            expect(result.files.length).toEqual(1);

            mockFs.restore();
        });

        it("should not replace js script tag with inline if replacing js is disabled", function() {

            var result = monolith.inlineSync('file.html', {js: false});

            expect(result.source).toBe(html);
            expect(result.files.length).toEqual(0);

            mockFs.restore();
        });

    });

    describe('inlining css', function() {

        var html, css;

        beforeEach(function(){
            html = '<head><link href="css/style.css"></head><body></body>';
            css = 'body{color:red}';
            mockFs({
                'file.html': html,
                'css/style.css': css
            });
        });

        afterEach(function(){
            mockFs.restore();
        });

        it("should replace css tag with inline css block", function() {
            var output = '<head><style>' + css + '</style></head><body></body>';
            var file = {
                src: 'css/style.css',
                tag: '<link href="css/style.css">',
                path: 'css/style.css',
                type: 'css'
            };

            var result = monolith.inlineSync('file.html');

            expect(result.source).toBe(output);
            expect(result.files).toContain(file);
            expect(result.files.length).toEqual(1);

            mockFs.restore();
        });

        it("should not replace css tag with inline if replacing css is disabled", function() {

            var result = monolith.inlineSync('file.html', {css: false});

            expect(result.source).toBe(html);
            expect(result.files.length).toEqual(0);

            mockFs.restore();
        });

    });

    describe('inlining multiple css and js files', function() {

        var html, css, js;

        beforeEach(function(){
            html = '<head><link href="css/style.css"><script src="js/js.js"></script></head><body></body>';
            js = 'var a;';
            css = 'body{color:red}';
            mockFs({
                'file.html': html,
                'js/js.js': js,
                'css/style.css': css
            });
        });

        afterEach(function(){
            mockFs.restore();
        });

        it("should replace css and js tag with inline blocks", function() {
            var output = '<head><style>' + css + '</style><script>' + js + '</script></head><body></body>';

            var cssFile = {
                src: 'css/style.css',
                tag: '<link href="css/style.css">',
                path: 'css/style.css',
                type: 'css'
            };

            var jsFile = {
                src: 'js/js.js',
                tag: '<script src="js/js.js"></script>',
                path: 'js/js.js',
                type: 'js'
            };

            var result = monolith.inlineSync('file.html');

            expect(result.source).toBe(output);
            expect(result.files).toContain(cssFile);
            expect(result.files).toContain(jsFile);
            expect(result.files.length).toEqual(2);

            mockFs.restore();
        });

        it("should not replace css and js tags if replacing is disabled", function() {

            var result = monolith.inlineSync('file.html', {css: false, js: false});

            expect(result.source).toBe(html);
            expect(result.files.length).toEqual(0);

            mockFs.restore();
        });

    });

    describe('search for urls in files should inline', function() {
        using([
                ['test.js', '<!DOCTYPE html><script src="test.js"></script>']
            ],
            function (file, source) {
                beforeEach(function () {
                    var fsMock = {
                        'file.html': source
                    };
                    fsMock[file] = '<fake-content>';
                    mockFs(fsMock);
                });

                afterEach(function () {
                    mockFs.restore();
                });

                it('file ' + file, function () {
                    var result = monolith.inlineSync('file.html');
                    expect(result.files.length).toEqual(1);
                })
            }
        );
    });
    describe('search for urls in files should not inline', function(){
        using([
                ['assets/965x250.jpg', '<!DOCTYPE html><script>console.log("test")</script><img id=i2 src="assets/965x250.jpg"><script>']
            ],
            function(file, source){
                beforeEach(function(){
                    var fsMock = {
                        'file.html': source
                    };
                    fsMock[file] = '<fake-content>';
                    mockFs(fsMock);
                });

                afterEach(function(){
                    mockFs.restore();
                });

                it('file ' + file, function(){
                    var result = monolith.inlineSync('file.html');
                    expect(result.files.length).toEqual(0);
                })
            }
        );
    });


});

function using(values, func){
    for (var i = 0, count = values.length; i < count; i++) {
        if (Object.prototype.toString.call(values[i]) !== '[object Array]') {
            values[i] = [values[i]];
        }
        func.apply(this, values[i]);
    }
}
