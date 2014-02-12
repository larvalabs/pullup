var gulp = require('gulp');
var gutil = require('gulp-util');
var jshint = require('gulp-jshint');

gulp.task('default', function(){
    gulp.src('./controllers/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});
