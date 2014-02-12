var gulp = require('gulp');
var gutil = require('gulp-util');
var jshint = require('gulp-jshint');

var paths = {
    scripts: ['./*.js', 'config/**/*.js', 'controllers/**/*.js', 'models/**/*.js', 'public/js/**/*.js', '!public/js/lib/**/*.js']
};

gulp.task('test', function () {
    gulp.src(paths.scripts)
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(jshint.reporter('fail'));
});

gulp.task('default', function(){
    gulp.start('test');
});
