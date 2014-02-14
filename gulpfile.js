var gulp = require('gulp');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');

var paths = {
    scripts: ['./*.js', './config/*.js', 'controllers/*.js', 'models/*.js', 'public/js/*.js', '!public/js/lib/**/*.js', 'test/*.js'],
    tests: ['./test/*.js']
};

gulp.task('jshint', function () {
    gulp.src(paths.scripts)
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(jshint.reporter('fail'));
});

gulp.task('mocha-tests', function () {
    gulp.src(paths.tests)
        .pipe(mocha({reporter: 'spec'}));
});
  
gulp.task('test', ['jshint', 'mocha-tests']);
gulp.task('default', ['test']);
