/**
 * Created by dcastane on 18/07/16.
 */
'use strict';

var _ = require('lodash'),
    gulp = require('gulp'),
    gulpLoadPlugins = require('gulp-load-plugins'),
    runSequence = require('run-sequence'),
    plugins = gulpLoadPlugins();

// Set NODE_ENV to 'test'
gulp.task('env:test', function () {
    process.env.NODE_ENV = 'test';
});

// Set NODE_ENV to 'development'
gulp.task('env:dev', function () {
    process.env.NODE_ENV = 'development';
});

// Set NODE_ENV to 'production'
gulp.task('env:prod', function () {
    process.env.NODE_ENV = 'production';
});

// Nodemon task
gulp.task('nodemon', function () {
    return plugins.nodemon({
        script: 'recurrent.js',
        nodeArgs: ['--debug'],
        ext: 'js,html',
        watch: 'routes/views/*.js'
        //watch: _.union(defaultAssets.server.views, defaultAssets.server.allJS, defaultAssets.server.config)
    });
});

// Watch Files For Changes
gulp.task('watch', function() {
    // Start livereload
    plugins.livereload.listen();

    gulp.watch('public/**/*').on('change', plugins.livereload.changed);
    gulp.watch('public/views/*').on('change', plugins.livereload.changed);
    gulp.watch('routes/views/*.js').on('change', plugins.livereload.changed);
    
    // Add watch rules
    /*
    gulp.watch(defaultAssets.server.views).on('change', plugins.livereload.changed);
    gulp.watch(defaultAssets.server.allJS, ['jshint']).on('change', plugins.livereload.changed);
    gulp.watch(defaultAssets.client.views).on('change', plugins.livereload.changed);
    gulp.watch(defaultAssets.client.js, ['jshint']).on('change', plugins.livereload.changed);
    gulp.watch(defaultAssets.client.css, ['csslint']).on('change', plugins.livereload.changed);
    gulp.watch(defaultAssets.client.sass, ['sass', 'csslint']).on('change', plugins.livereload.changed);
    gulp.watch(defaultAssets.client.less, ['less', 'csslint']).on('change', plugins.livereload.changed);
    */
});

// Run the project in development mode
gulp.task('default', function(done) {
    runSequence('env:dev', done);
});
