'use strict';


let gulp = require('gulp');
let cleanCSS = require('gulp-clean-css');
let sass = require('gulp-sass');
sass.compiler = require('node-sass');
let ts = require('gulp-typescript');
let sourcemaps = require('gulp-sourcemaps');
const minify = require('gulp-minify');
const eslint = require('gulp-eslint');
let tslint = require('gulp-tslint');


gulp.task('tslint', () => {
    return gulp.src('./ts/*.ts')
        .pipe(tslint({
            formatter: 'verbose'
        }))
        .pipe(tslint.report());
});

gulp.task('ts-to-js', function() {
  return gulp.src('./ts/*.ts')
  .pipe(sourcemaps.init())
  .pipe(ts({
      noImplicitAny: true
  }))
  .pipe(sourcemaps.write())
  .pipe(gulp.dest('./js'));
});

gulp.task('minify-js', function() {
  return gulp.src('./js/*.js')
    .pipe(minify({
      noSource: true
    }))
    .pipe(gulp.dest('./dist/'))
});

gulp.task('eslint', () => {
  return gulp.src(['./js/*.js'])
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.failAfterError());
});

gulp.task('scss', function () {
  return gulp.src('./scss/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./css/'));
});

gulp.task('minify-css',() => {
  return gulp.src('./css/*.css')
    .pipe(sourcemaps.init())
    .pipe(cleanCSS())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./dist/'));
});

gulp.task('ts-to-min-js', gulp.series('tslint', 'ts-to-js', 'minify-js', 'eslint'));
gulp.task('scss-to-min-css', gulp.series('scss', 'minify-css'));

gulp.task('watch', function () {
    gulp.watch('./scss/*.scss',  gulp.series('scss-to-min-css'));
    gulp.watch('./ts/*.ts', gulp.series('ts-to-min-js'));
});