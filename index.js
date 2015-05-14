/*
django-bridge
-------------

This file is a part of django-bridge npm package which used with python
module with same name.

Defines gulp tasks for building scripts and styles bundles.

Author: Roman Tolkachyov <roman@tolkachyov.name>
*/
var _ = require('underscore');
var sprintf = require("sprintf-js").sprintf;

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

var package = require(path.join(process.cwd(), 'package.json'));

var bust = require('gulp-buster');

var notify = require('gulp-notify');

var plumber = require('gulp-plumber');

var aliasify = require('aliasify');


var browserify_error_re = /(\/.+\.js).+\((\d+)\:?(\d+)\)/i;
var syntax_error_re = /(\/.+\.js)\:(\d+)/i;


var exec_string = "subl %(file)s:%(line)d:%(column)";
var STATIC_PATH = "./static"
var DJANGO_PATH = "./"

if (package.bridge) {
    conf = package.bridge
    if (conf.editor) {
        exec_string = conf.editor;
    }
    if (conf.static_path) {
        STATIC_PATH = conf.static_path;
    }
    if (conf.django_path) {
        DJANGO_PATH = conf.django_path;
    }
}

var handle_error = notify.onError(function (error) {
    notify.on('click', function (notifierObject, options) {
        // Happens if `wait: true` and user clicks notification
        if (notifierObject.open_exec) {
            shelljs.exec(notifierObject.open_exec);
        }
    });

    var filename = null;

    notify_path = path.dirname(require.resolve('gulp-notify'))

    options = {
        message: error.message,
        title: "Build Error",
        icon: path.join(notify_path, 'assets', 'gulp-error.png'),
        sound: 'Frog',
        wait: true
    }

    if (error.file) {
        filename = error.file;
        line = error.line;
        column = error.column;
    }

    if (filename == null) {
        res = browserify_error_re.exec(error.message)

        if (res) {
            filename = res[1];
            line = res[2];
            column = res[3];
        }
    }

    if (filename == null) {
        res = syntax_error_re.exec(error)
        if (res) {
            filename = res[1];
            line = res[2];
            column = 0;
        }
    }

    if (filename != null) {
        var parsed_path = path.parse(filename);
        var parent_dir = path.parse(parsed_path.dir);
        var short_filename = filename.split(path.sep).slice(-4).join(path.sep);
        options['title'] = short_filename + ':' + line + ':' + column;
        options['open_exec'] = sprintf(exec_string, {
            file: filename,
            line: line,
            column: column
        });
    }

    return options
})

function get_django_apps() {
    var command = path.join(DJANGO_PATH, 'manage.py');
    var res = shelljs.exec('./' + command + ' bridge aliases', {
        silent:true
    }).output;

    start_pos = res.search('----\n')

    return JSON.parse(res.substr(start_pos + 5));
}

function find_paths(directory) {
    // find directories with such name inside django apps static.
    var apps = get_django_apps();
    var result = [];
    Object.keys(apps).forEach(function(app_name) {
        var static_path = apps[app_name];
        var dir_path = path.join(static_path, directory);
        if(fs.existsSync(dir_path)) {
            var full_path = path.join(static_path, directory);
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
            var name = path.parse(filename).name
            var first_symbol = filename.substr(0, 1)
            if(extensions.indexOf(file_ext) != -1 & first_symbol != '_' & name != 'index') {
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
        includePaths: scss_path,
        onError: handle_error
    }

    s = gulp.src(file_list)
    if (watching) {
        s = s.pipe(watch(file_list));
    }
    return s.pipe(sass(sass_options))
            .pipe(gulp.dest(STATIC_PATH + '/styles/'))
            .pipe(bust())
            .pipe(gulp.dest(STATIC_PATH + '/'));
})

gulp.task('vendors', function() {
    if (package.bridge && package.bridge.vendors) {
        b = browserify()

        package.bridge.vendors.forEach(function (lib) {
            b.require(lib)
        })

        return b.bundle()
                .pipe(source('vendors.js'))
                .pipe(gulp.dest(STATIC_PATH + '/scripts'))
                .pipe(buffer())
                .pipe(bust())
                .pipe(gulp.dest(STATIC_PATH + '/'));
    }
})

function get_aliasify_config() {
    var res = {
        aliases: {},
        verbose: false
    };
    var app_list = get_django_apps();
    for (app in app_list) {
        res.aliases[app] = path.join(app_list[app], 'scripts')
    }
    return res
}

gulp.task('scripts', ['vendors'], watchify(function(watchify) {
    var w = watchify({
        watch: watching,
        setup: function(b) {
            b.transform('coffeeify');
            b.transform('browserify-eco');
            b.transform(aliasify, get_aliasify_config())
            b.on('bundle', function() {
                if (package.bridge && package.bridge.vendors) {
                    package.bridge.vendors.forEach(function (lib) {
                        b.external(lib);
                    })
                }
            });
        }
    })
    return gulp.src(find_scripts())
               .pipe(plumber())
               .pipe(w)
               .on('error', handle_error)
               .pipe(buffer())
               .pipe(sourcemaps.init({loadMaps:true}))
               .pipe(sourcemaps.write('./'))
               .pipe(gulp.dest(STATIC_PATH + '/scripts/'))
               .pipe(bust())
               .pipe(gulp.dest(STATIC_PATH + '/'))
}))

gulp.task('watch', ['enable-watch-mode', 'scripts', 'styles']);

gulp.task('build', ['scripts', 'styles'])

gulp.task('default', ['watch']);
