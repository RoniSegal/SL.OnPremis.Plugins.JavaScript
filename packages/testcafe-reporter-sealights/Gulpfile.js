var gulp    = require('gulp');
var eslint  = require('gulp-eslint');
var mocha   = require('gulp-mocha');
var del     = require('del');
var ts = require('gulp-typescript');
var tsProject = ts.createProject('tsconfig.json');
var project = ts.createProject('tsconfig-test.json');
var sourcemaps = require('gulp-sourcemaps');


function clean(cb) {
    del('dist', cb);
}

function cleanTest(cb) {
    del('dist-test', cb);
}

function lint() {
    return gulp
        .src([
            'lib/**/*.ts',
            'test/**/*.ts',
            'Gulpfile.js'
        ])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
}

function build() {
    return tsProject.src()
        .pipe(sourcemaps.init())
        .pipe(tsProject())
        .pipe(sourcemaps.write('.', { sourceRoot: './', includeContent: false }))
        .pipe(gulp.dest('dist'));
}

function buildTest() {
    return project.src()
        .pipe(sourcemaps.init())
        .pipe(project())
        .pipe(sourcemaps.write('.', { sourceRoot: './', includeContent: false }))
        .pipe(gulp.dest('dist-test'));
}

function test() {
    return gulp
        .src('dist-test/**/*.js')
        .pipe(mocha({
            ui:       'bdd',
            reporter: 'spec',
            timeout:  typeof v8debug === 'undefined' ? 20000 : Infinity // NOTE: disable timeouts in debug
        }));
}

function preview() {
    var buildReporterPlugin = require('testcafe').embeddingUtils.buildReporterPlugin;
    var pluginFactory       = require('./dist');
    var reporterTestCalls   = require('./test/utils/reporter-test-calls');
    var plugin              = buildReporterPlugin(pluginFactory);


    reporterTestCalls.forEach(function(call) {
        plugin[call.method].apply(plugin, call.args);
    });

    process.exit(0);
}

exports.clean = clean;
exports.lint = lint;
exports.test = gulp.series(clean, cleanTest, lint, build, buildTest, test);
exports.build = gulp.series(clean, lint, build);
exports.preview = gulp.series(clean, lint, build, preview);
