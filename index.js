var _ = require('underscore');

var gulp = require('gulp');
var browserify = require('browserify');
var watchify = require('gulp-watchify');
var sass = require('gulp-sass');
var watch = require('gulp-watch');
var rename = require('gulp-rename');

var gutil = require('gulp-util');

var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var sourcemaps = require('gulp-sourcemaps');

var fs = require('fs');
var shelljs = require('shelljs');
var path = require('path');

function get_django_apps() {
    var res = shelljs.exec('./manage.py jsaliases', {silent:true}).output;
    return JSON.parse(res);
}

function find_paths(directory) {
    // find directories with such name inside django apps static.
    var apps = get_django_apps();
    var result = [];
    Object.keys(apps).forEach(function(app_name) {
        var static_path = apps[app_name];
        var dir_path = path.join(static_path, directory);
        if(fs.existsSync(dir_path)) {
            var full_path = path.join(static_path, directory)
            result.push(full_path);
        }
    });
    return result;
}

function find_files(directory, extensions) {
    // return files containing inside `directory` inside static path of all
    // applications. You must provide file extensions list.
    var result = [];
    var path_list = find_paths(directory);
    for(path_no in path_list) {
        var path_item = path_list[path_no];
        var file_list = fs.readdirSync(path_item);
        for(fileno in file_list) {
            var filename = file_list[fileno];
            var file_ext = path.extname(filename);
            var first_symbol = filename.substr(0, 1)
            if(extensions.indexOf(file_ext) != -1 & first_symbol != '_') {
                var full_path = path.join(path_item, filename)
                result.push(full_path);
            }
        }
    }
    return result;
}

function find_styles() {
    // return scss top-file list
    return find_files("styles", ['.scss'])
}

function find_scripts() {
    // return file list for browserify end points
    return find_files("scripts", ['.js', '.coffee']);
}

var watching = false;
gulp.task('enable-watch-mode', function() { watching = true })

gulp.task('styles', function() {
    var file_list = find_styles();

    var scss_path = find_paths('styles');
    var sass_options = {
        includePaths: scss_path
    }

    if (watching) {
        return gulp.src(file_list)
                   .pipe(watch(file_list))
                   .pipe(sass(sass_options))
                   .pipe(gulp.dest('./static'));
    } else {
        return gulp.src(file_list)
                   .pipe(sass(sass_options))
                   .pipe(gulp.dest('./static'));
    }
})

gulp.task('scripts', watchify(function(watchify) {
    var w = watchify({
        watch: watching,
        setup: function(b) {
            // bundle.transform(require('brfs'))
            b.transform('coffeeify');
            b.transform('browserify-eco');
            b.on('bundle', function() {
                // libs.forEach function (lib) {
                //     if(lib.expose) {
                //         b.external(lib.require, expose: lib.expose);
                //     } else {
                //         b.external(lib.require);
                //     }
                // }
            });
        }
    })
    return gulp.src(find_scripts())
               .pipe(w)
               .on('error', gutil.log.bind(gutil, 'Browserify error'))
               .pipe(buffer())
               .pipe(sourcemaps.init({loadMaps:true}))
               .pipe(sourcemaps.write('./'))
               .pipe(rename('somename.js'))
               .pipe(gulp.dest('./static'))
}))

gulp.task('watch', ['enable-watch-mode', 'scripts', 'styles']);

gulp.task('build', ['scripts', 'styles'])

gulp.task('default', ['watch']);
