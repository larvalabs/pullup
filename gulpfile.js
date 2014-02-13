var gulp = require('gulp');
var gutil = require('gulp-util');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');

var paths = {
    scripts: ['./*.js', 'config/**/*.js', 'controllers/**/*.js', 'models/**/*.js', 'public/js/**/*.js', '!public/js/lib/**/*.js', './test/*.js'],
    tests: ['./test/*.js']
};

gulp.task('jshint', function () {
    return gulp.src(paths.scripts)
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(jshint.reporter('fail'));
});

gulp.task('test', ['jshint'], function () {
    return gulp.src(paths.tests)
        .pipe(mocha({reporter: 'spec'}));
});

gulp.task('default', ['test']);
