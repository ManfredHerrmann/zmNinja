(function (angular) {
  'use strict';

  angular.module('angularAwesomeSlider', [])
    // DIRECTIVE
    .directive('slider', [
      '$compile', '$templateCache','$timeout', '$window', 'slider',
      function(compile, templateCache, timeout, win, Slider) {
        return {
          restrict : 'AE',
          require: '?ngModel',
          scope: { options:'=', ngDisabled: '='},
          priority: 1,
          link : function(scope, element, attrs, ngModel) {

          if(!ngModel) return;

          if (!scope.options)
            throw new Error('You must provide a value for "options" attribute.');

          var injector = angular.injector();

          // options as inline variable
          if (angular.isString(scope.options)) {
            scope.options = angular.toJson(scope.options);
          }

          scope.mainSliderClass = 'jslider';
          scope.mainSliderClass += scope.options.skin ? ' jslider_' + scope.options.skin : ' ';
          scope.mainSliderClass += scope.options.vertical ? ' vertical ' : '';
          scope.mainSliderClass += scope.options.css ? ' sliderCSS' : '';
          scope.mainSliderClass += scope.options.className ? ' ' + scope.options.className : '';

          // handle limit labels visibility
          scope.options.limits = angular.isDefined(scope.options.limits) ? scope.options.limits : true;

          // compile template
          element.after(compile(templateCache.get('ng-slider/slider-bar.tmpl.html'))(scope, function(clonedElement, scope) {
            scope.tmplElt = clonedElement;
          }));

          // init

          var initialized = false;

          var init = function() {
            scope.from = ''+scope.options.from;
            scope.to = ''+scope.options.to;
            if (scope.options.calculate && typeof scope.options.calculate === 'function') {
              scope.from = scope.options.calculate(scope.from);
              scope.to = scope.options.calculate(scope.to);
            }

            var OPTIONS = {
              from: !scope.options.round ? parseInt(scope.options.from, 10) : parseFloat(scope.options.from),
              to: !scope.options.round ? parseInt(scope.options.to, 10) : parseFloat(scope.options.to),
              step: scope.options.step,
              smooth: scope.options.smooth,
              limits: scope.options.limits,
              round: scope.options.round || false,
              value: ngModel.$viewValue,
              dimension: "",
              scale: scope.options.scale,
              modelLabels: scope.options.modelLabels,
              vertical: scope.options.vertical,
              css: scope.options.css,
              className: scope.options.className,
              realtime: scope.options.realtime,
              cb: forceApply,
              threshold: scope.options.threshold,
              heterogeneity: scope.options.heterogeneity
            };

            OPTIONS.calculate = scope.options.calculate || undefined;
            OPTIONS.onstatechange = scope.options.onstatechange || undefined;

            // slider
            scope.slider = !scope.slider ? slidering(element, scope.tmplElt, OPTIONS) : scope.slider.init(element, scope.tmplElt, OPTIONS);

            if (!initialized) {
              initListener();
            }

            // scale
            var scaleDiv = scope.tmplElt.find('div')[7];
            angular.element(scaleDiv).html(scope.slider.generateScale());
            scope.slider.drawScale(scaleDiv);

            if (scope.ngDisabled) {
              disabler(scope.ngDisabled);
            }

            initialized = true;
          };

          function initListener() {
            // window resize listener
            angular.element(win).bind('resize', function(event) {
              scope.slider.onresize();
            });
          }

          // model -> view
          ngModel.$render = function () {
            //elm.html(ctrl.$viewValue);
            var singleValue = false;

            if (!ngModel.$viewValue && ngModel.$viewValue !== 0) {
              return;
            }

            if (typeof(ngModel.$viewValue) === 'number') {
              ngModel.$viewValue = ''+ngModel.$viewValue;
            }

            if( !ngModel.$viewValue.split(";")[1]) {
              scope.mainSliderClass += ' jslider-single';
            }

            if (scope.slider) {
              var firstPtr = scope.slider.getPointers()[0];
              // reset to lowest value
              firstPtr.set(scope.from, true);
              if (ngModel.$viewValue.split(';')[1]) {
                var secondPtr = scope.slider.getPointers()[1];
                // reset to biggest value
                firstPtr.set(scope.to, true);
                secondPtr.set(ngModel.$viewValue.split(';')[1], true);
              }
              firstPtr.set(ngModel.$viewValue.split(';')[0], true);
            }
          };

          // view -> model
          var forceApply = function(value, released) {
            if (scope.disabled)
              return;
            scope.$apply(function() {
              ngModel.$setViewValue(value);
            });
            if (scope.options.callback){
              scope.options.callback(value, released);
            }
          };

          // watch options
          scope.$watch('options', function(value) {
            timeout(function(){
              init();
            });
          }, scope.watchOptions || true);

          // disabling
          var disabler = function(value) {
            scope.disabled = value;
            if (scope.slider) {
              scope.tmplElt.toggleClass('disabled');
              scope.slider.disable(value);
            }
          };

          scope.$watch('ngDisabled', function(value) {
            disabler(value);
          });

          scope.limitValue = function(value) {
            if (scope.options.modelLabels) {
              if (angular.isFunction(scope.options.modelLabels)) {
                return scope.options.modelLabels(value);
              }
              return scope.options.modelLabels[value] !== undefined ? scope.options.modelLabels[value] : value;
            }
            return value;
          };

          var slidering = function( inputElement, element, settings) {
            return new Slider( inputElement, element, settings );
          };
        }
      };
    }])
.config(function() {})
.run(function() {});
})(angular);
