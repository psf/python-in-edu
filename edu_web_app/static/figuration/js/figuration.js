/*!
 * Figuration (v4.0.1)
 * http://figuration.org
 * Copyright 2013-2020 CAST, Inc.
 * Licensed under MIT (https://github.com/cast-org/figuration/blob/master/LICENSE)
 * -----
 * Portions Copyright 2011-2020  the Bootstrap Authors and Twitter, Inc.
 * Used under MIT License (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 */

if (typeof jQuery === 'undefined') {
  throw new Error('CAST Figuration\'s JavaScript requires jQuery');
}

(function($) {
  var version = $.fn.jquery.split(' ')[0].split('.');
  if ((version[0] < 2 && version[1] < 9) || (version[0] == 1 && version[1] == 9 && version[2] < 1) || (version[0] >= 4)) {
    throw new Error('CAST Figuration\'s JavaScript requires at least jQuery v1.9.1 but less than v4.0.0');
  }
})(jQuery);

/**
 * --------------------------------------------------------------------------
 * Figuration (v4.0.1): util.js
 * Licensed under MIT (https://github.com/cast-org/figuration/blob/master/LICENSE)
 * --------------------------------------------------------------------------
 */

(function($) {
    'use strict';

    // =====
    // Private util helpers
    // =====

    /* eslint-disable-next-line no-extend-native */
    String.prototype.capitalize = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    };

    var doCallback = function(callback) {
        if (callback) { callback(); }
    };

    // =====
    // TransitionEnd support/emulation
    // =====

    var transition = false;
    var TRANSITION_END = 'cfwTransitionEnd';

    var CFW_transitionEndTest = function() {
        var div = document.createElement('div');

        var transitionEndEvents = {
            transition       : 'transitionend',
            MozTransition    : 'transitionend',
            OTransition      : 'oTransitionEnd otransitionend',
            WebkitTransition : 'webkitTransitionEnd'
        };

        // Test for browser specific event name to bind
        for (var eventName in transitionEndEvents) {
            if (typeof div.style[eventName] !== 'undefined') {
                return {
                    end: transitionEndEvents[eventName]
                };
            }
        }

        // No browser transitionEnd support - use custom event name
        return {
            end: TRANSITION_END
        };
    };

    // Get longest CSS transition duration
    var CFW_transitionCssDuration = function($node) {
        var timeArray = [0]; // Set a min value -- otherwise get `Infinity`
        var MILLISECONDS_MULTIPLIER = 1000;
        var DURATION_PRECISION = 2;

        $node.each(function() {
            var $this = $(this);
            var transitionDuration = $this.css('transition-duration');
            var transitionDelay = $this.css('transition-delay');

            if (transitionDuration && transitionDelay) {
                var durations = transitionDuration.split(',');
                var delays = transitionDelay.split(',');
                for (var i = durations.length; i--;) {
                    timeArray = timeArray.concat(parseFloat(durations[i]) + parseFloat(delays[i]));
                }
            }
        });

        var duration = Math.max.apply(Math, timeArray); // http://stackoverflow.com/a/1379560
        return duration.toPrecision(DURATION_PRECISION) * MILLISECONDS_MULTIPLIER; // convert to milliseconds
    };

    var CFW_transitionEndEmulate = function(start, complete) {
        var duration = CFW_transitionCssDuration(this);

        if (duration) {
            var called = false;
            this.one(TRANSITION_END, function() {
                if (!called) {
                    called = true;
                    doCallback(complete);
                }
            });

            // Set timeout as fallback for instances where transitionEnd is not called.
            // This way the complete callback is always executed.
            setTimeout(function() {
                if (!called) {
                    called = true;
                    doCallback(complete);
                }
            }, duration);

            doCallback(start);
        } else {
            doCallback(start);
            doCallback(complete);
        }
        return this;
    };

    var CFW_transitionEndSpecial = function() {
        return {
            bindType: transition.end,
            delegateType: transition.end,
            handle: function(e) {
                if ($(e.target).is(this)) {
                    return e.handleObj.handler.apply(this, arguments);
                }
                return undefined; /* eslint-disable-line no-undefined */
            }
        };
    };

    transition = CFW_transitionEndTest();
    $.fn.CFW_transitionDuration = CFW_transitionCssDuration;
    $.fn.CFW_transition = CFW_transitionEndEmulate;
    $.event.special[TRANSITION_END] = CFW_transitionEndSpecial();

    // =====
    // Touch Detection
    // =====

    // Includes touch recognition fix for IE11
    // Partially from: https://github.com/Modernizr/Modernizr/blob/master/feature-detects/touchevents.js
    /* global DocumentTouch */
    var msTouch = typeof window.navigator.msMaxTouchPoints === 'undefined' ? false : window.navigator.msMaxTouchPoints;
    var isTouch = false;
    if (('ontouchstart' in window) || msTouch || (window.DocumentTouch && document instanceof DocumentTouch)) {
        isTouch = true;
    }
    $.CFW_isTouch = isTouch;

    // =====
    // Mutation Helper
    // =====

    // Not available in IE 10-, need a polyfill
    var CFW_MutationObserverTest = (function() {
        return 'MutationObserver' in window ? window.MutationObserver : false;
    }());
    var CFW_mutationObserver = CFW_MutationObserverTest;

    var CFW_mutationObserved = function(records, $node) {
        if (!MutationObserver) { return; }
        var $target = $(records[0].target);
        if ($target.is($node)) { return; } // Ignore elements own mutation
        var $parent = $target.parents('[data-cfw-mutate]').first();
        $parent.triggerHandler('mutate.cfw.mutate');
    };

    $.fn.CFW_mutateTrigger = function() {
        this.find('[data-cfw-mutate]').each(function() {
            $(this).triggerHandler('mutate.cfw.mutate');
        });
        return this;
    };

    $.fn.CFW_mutationIgnore = function() {
        if (!CFW_mutationObserver) { return this; }
        this.each(function() {
            var elmObserver = $(this).data('cfw-mutationobserver');
            if (typeof elmObserver !== 'undefined') {
                elmObserver.disconnect();
            }
            $(this).removeData('cfw-mutationobserver')
                .off('mutated.cfw.mutate');
        });
        return this;
    };

    $.fn.CFW_mutationListen = function() {
        if (!CFW_mutationObserver) { return this; }

        this.CFW_mutationIgnore();

        this.each(function() {
            var $node = this;
            var elmObserver = new MutationObserver(function(records) {
                CFW_mutationObserved(records, $node);
            });
            elmObserver.observe(
                this, {
                    attributes: true,
                    childList: true,
                    characterData: false,
                    subtree: true,
                    attributeFilter : [
                        'style',
                        'class'
                    ]
                }
            );

            // Don't pass node so that this can force a mutation obeservation
            $(this).data('cfw-mutationobserver', elmObserver)
                .on('mutated.cfw.mutate', CFW_mutationObserved);
            /*
                .on('mutated.cfw.mutate', function(e) {
                    CFW_mutationObserved(e, $node);
                });
            */
        });
        return this;
    };

    // =====
    // Image Loaded Detection
    // =====

    // Execute a callback when an image has been loaded
    $.CFW_imageLoaded = function($img, instance, callback) {
        var img = $img[0];
        var proxyImg = new Image();
        var $proxyImg = $(proxyImg);

        if (typeof instance === 'undefined') {
            instance = '';
        } else {
            instance = '.' + instance;
        }

        var _doCallback = function() {
            $proxyImg
                .off('load.cfw.imageLoaded' + instance)
                .remove();
            callback();
        };

        var _isImageComplete = function() {
            return img.complete && typeof img.naturalWidth !== 'undefined';
        };

        // Firefox reports img.naturalWidth=0 for SVG
        // Also currently borked in most browsers: https://github.com/whatwg/html/issues/3510
        // if (_isImageComplete() && img.naturalWidth !== 0) {
        if (_isImageComplete()) {
            _doCallback();
            return;
        }

        $proxyImg
            .off('load.cfw.imageLoaded' + instance)
            .one('load.cfw.imageLoaded' + instance, _doCallback);
        proxyImg.src = img.src;
    };

    // =====
    // Public Utils
    // =====

    $.fn.CFW_getID = function(prefix) {
        var $node = $(this);
        var nodeID = $node.attr('id');
        var MAX_ID = 1000000;
        if (typeof nodeID === 'undefined') {
            do {
                /* eslint-disable-next-line no-bitwise */
                nodeID = prefix + '-' + ~~(Math.random() * MAX_ID); // "~~" acts like a faster Math.floor() here
            } while (document.getElementById(nodeID));
            $node.attr('id', nodeID);
        }
        return nodeID;
    };

    $.fn.CFW_trigger = function(eventName, extraData) {
        var e = $.Event(eventName);
        if ($.isPlainObject(extraData)) {
            e = $.extend({}, e, extraData);
        }
        $(this).trigger(e);
        if (e.isDefaultPrevented()) {
            return false;
        }
        return true;
    };

    $.fn.CFW_parseData = function(name, object) {
        var parsedData = {};
        var $node = $(this);
        var data = $node.data();
        name = name.capitalize();

        for (var prop in object) {
            if (Object.prototype.hasOwnProperty.call(object, prop)) {
                var propName = prop.capitalize();
                if (typeof data['cfw' + name + propName] !== 'undefined') {
                    parsedData[prop] = data['cfw' + name + propName];
                }
            }
        }
        return parsedData;
    };

    $.fn.CFW_getSelectorFromElement = function(name) {
        var selector = this[0].getAttribute('data-cfw-' + name + '-target');

        if (!selector || selector === '#') {
            selector = this[0].getAttribute('href') || '';
        }

        try {
            return document.querySelector(selector) ? selector : null;
        } catch (error) {
            return null;
        }
    };

    $.fn.CFW_getSelectorFromChain = function(name, setting) {
        var $node = $(this);

        if (!setting || setting === '#') {
            return $node.CFW_getSelectorFromElement();
        }

        try {
            return document.querySelector(setting) ? setting : null;
        } catch (error) {
            return null;
        }
    };

    $.fn.CFW_getScrollbarSide = function() {
        // Unable to detect side when 0-width scrollbars (such as mobile)
        // are found.  So we use 'right` side as default (more common case).

        // Hacky support for IE/Edge and their placment of scrollbar on window
        // for 'rtl' mode.
        var $node = $(this);

        if ($node.is($('html'))) {
            var browser = {
                msedge: /edge\/\d+/i.test(navigator.userAgent),
                msie: /(msie|trident)/i.test(navigator.userAgent)
            };
            var directionVal = window.getComputedStyle($node[0], null).getPropertyValue('direction').toLowerCase();
            if ((directionVal === 'rtl') && (browser.msedge || browser.msie)) {
                return 'left';
            }
            return 'right';
        }

        var scrollDiv = document.createElement('div');
        scrollDiv.setAttribute('style', 'overflow-y: scroll;');
        var scrollP = document.createElement('p');
        $(scrollDiv).append(scrollP);
        $node.append(scrollDiv);
        var scrollbarWidth = $.CFW_measureScrollbar();
        var posLeft = scrollP.getBoundingClientRect().left;
        $node[0].removeChild(scrollDiv);
        return posLeft < scrollbarWidth ? 'right' : 'left';
    };

    $.fn.CFW_findShadowRoot = function(element) {
        if (!document.documentElement.attachShadow) {
            return null;
        }

        // Can find the shadow root otherwise it'll return the document
        if (typeof element.getRootNode === 'function') {
            var root = element.getRootNode();
            return root instanceof ShadowRoot ? root : null;
        }

        if (element instanceof ShadowRoot) {
            return element;
        }

        // when we don't find a shadow root
        if (!element.parentNode) {
            return null;
        }

        return null;
    };

    $.CFW_throttle = function(fn, threshhold, scope) {
        /* From: http://remysharp.com/2010/07/21/throttling-function-calls/ */
        var THRESHHOLD_DEFAULT = 250;
        if (typeof threshhold === 'undefined') {
            threshhold = THRESHHOLD_DEFAULT;
        }
        var last;
        var deferTimer;
        return function() {
            var context = scope || this;

            var now = Number(new Date());
            var args = arguments;
            if (last && now < last + threshhold) {
                // hold on to it
                clearTimeout(deferTimer);
                deferTimer = setTimeout(function() {
                    last = now;
                    fn.apply(context, args);
                }, threshhold);
            } else {
                last = now;
                fn.apply(context, args);
            }
        };
    };

    $.CFW_measureScrollbar = function() {
        var scrollDiv = document.createElement('div');
        scrollDiv.setAttribute('style', ' position: absolute; top: -9999px; width: 50px; height: 50px; overflow: scroll;');
        document.body.appendChild(scrollDiv);
        var scrollbarWidth = scrollDiv.getBoundingClientRect().width - scrollDiv.clientWidth;
        document.body.removeChild(scrollDiv);
        return scrollbarWidth;
    };

    $.CFW_reflow = function(element) {
        return element.offsetHeight;
    };
}(jQuery));

/**
 * --------------------------------------------------------------------------
 * Figuration (v4.0.1): drag.js
 * Licensed under MIT (https://github.com/cast-org/figuration/blob/master/LICENSE)
 * --------------------------------------------------------------------------
 */

(function($) {
    'use strict';

    var CFW_Widget_Drag = function(element, options) {
        this.$element = $(element);
        this.dragging = false;
        this.dragdata = {};
        this.instance = null;

        this.settings = $.extend({}, CFW_Widget_Drag.DEFAULTS, options);

        this._init();
    };

    CFW_Widget_Drag.DEFAULTS = {
        handle : null   // selector for handle target elements
    };

    CFW_Widget_Drag.prototype = {

        _init : function() {
            this.instance = $('<div/>').CFW_getID('cfw-drag');
            this._reset();
            this._dragStartOn();
            this.$element.CFW_trigger('init.cfw.drag');
        },

        dispose : function() {
            if (this.$element[0].detachEvent) {
                this.$element[0].detachEvent('ondragstart', this._dontStart);
            }
            this._dragStartOff();
            this.$element.removeData('cfw.drag');

            this.$element = null;
            this.dragging = null;
            this.dragdata = null;
            this.instance = null;
            this.settings = null;
        },

        _dragStartOn : function() {
            this.$element.on('mousedown.cfw.dragstart touchstart.cfw.dragstart MSPointerDown.cfw.dragstart', this._dragStart.bind(this));
            // prevent image dragging in IE...
            if (this.$element[0].attachEvent) {
                this.$element[0].attachEvent('ondragstart', this._dontStart);
            }
        },

        _dragStartOff : function(e) {
            if (e) { e.preventDefault(); }
            $(document).off('.cfw.dragin.' + this.instance);
            this.$element.off('.cfw.dragstart');
        },

        _dragStart : function(e) {
            var $selfRef = this;

            // check for handle selector
            if (this.settings.handle && !$(e.target).closest(this.settings.handle, e.currentTarget).not('.disabled, :disabled').length) {
                return;
            }

            // check for disabled element
            if (this.$element.is('.disabled, :disabled')) { return; }

            this._dragStartOff(e);
            this.dragging = true;

            $(document)
                .off('.cfw.dragin.' + this.instance)
                .on('mousemove.cfw.dragin.' + this.instance + ' touchmove.cfw.dragin.' + this.instance + ' MSPointerMove.cfw.dragin.' + this.instance, function(e) {
                    $selfRef._drag(e);
                })
                .on('mouseup.cfw.dragin.' + this.instance + ' touchend.cfw.dragin.' + this.instance + ' MSPointerUp.cfw.dragin.' + this.instance + ' MSPointerCancel.cfw.dragin.' + this.instance, function() {
                    $selfRef._dragEnd(e);
                });


            var coord = this._coordinates(e);
            this.dragdata = coord;
            this.dragdata.originalX = e.currentTarget.offsetLeft;
            this.dragdata.originalY = e.currentTarget.offsetTop;

            var props = this._properties(coord, this.dragdata);
            this.$element.CFW_trigger('dragStart.cfw.drag', props);
        },

        _drag : function(e) {
            if (!this.dragging) {
                return;
            }

            e.preventDefault();
            var coord = this._coordinates(e);
            var props = this._properties(coord, this.dragdata);
            this.$element.CFW_trigger('drag.cfw.drag', props);
        },

        _dragEnd : function(e) {
            e.preventDefault();
            this.dragging = false;
            this.dragStart = null;
            $(document).off('.cfw.dragin.' + this.instance);

            var coord = this._coordinates(e);
            var props = this._properties(coord, this.dragdata);
            this.$element.CFW_trigger('dragEnd.cfw.drag', props);

            this._reset();
            this._dragStartOn();
        },

        _reset : function() {
            this.dragging = false;
            this.dragdata.pageX = null;
            this.dragdata.pageY = null;
        },

        _coordinates : function(e) {
            var coord = {};
            if (e.originalEvent) {
                e = e.originalEvent;
            }
            var touches =  e.touches;
            coord.pageX = touches ? touches[0].pageX : e.pageX;
            coord.pageY = touches ? touches[0].pageY : e.pageY;
            return coord;
        },

        _properties : function(coord, dd) {
            var p = {};

            // starting position
            p.startX = dd.pageX;
            p.startY = dd.pageY;
            // pass-thru page position
            p.pageX = coord.pageX;
            p.pageY = coord.pageY;
            // distance dragged
            p.deltaX = coord.pageX - dd.pageX;
            p.deltaY = coord.pageY - dd.pageY;
            // original element position
            p.originalX = dd.originalX;
            p.originalY = dd.originalY;
            // adjusted element position
            p.offsetX = p.originalX + p.deltaX;
            p.offsetY = p.originalY + p.deltaY;

            return p;
        },

        _dontStart : function() {
            return false;
        }
    };

    var Plugin = function(option) {
        var args = [].splice.call(arguments, 1);
        return this.each(function() {
            var $this = $(this);
            var data = $this.data('cfw.drag');
            var options = typeof option === 'object' && option;

            if (!data && /dispose/.test(option)) {
                return;
            }
            if (!data) {
                $this.data('cfw.drag', data = new CFW_Widget_Drag(this, options));
            }
            if (typeof option === 'string') {
                data[option].apply(data, args);
            }
        });
    };

    $.fn.CFW_Drag = Plugin;
    $.fn.CFW_Drag.Constructor = CFW_Widget_Drag;
}(jQuery));

/**
 * --------------------------------------------------------------------------
 * Figuration (v4.0.1): collapse.js
 * Licensed under MIT (https://github.com/cast-org/figuration/blob/master/LICENSE)
 * --------------------------------------------------------------------------
 */

(function($) {
    'use strict';

    var CFW_Widget_Collapse = function(element, options) {
        this.$element = $(element);
        this.$target = null;
        this.$triggers = null;
        this.inTransition = false;

        var parsedData = this.$element.CFW_parseData('collapse', CFW_Widget_Collapse.DEFAULTS);
        this.settings = $.extend({}, CFW_Widget_Collapse.DEFAULTS, parsedData, options);

        this._init();
    };

    CFW_Widget_Collapse.DEFAULTS = {
        target     : null,
        animate    : true,  // If collapse targets should expand and contract
        follow     : false, // If browser focus should move when a collapse toggle is activated
        horizontal : false  // If collapse should transition horizontal (vertical is default)
    };

    CFW_Widget_Collapse.prototype = {

        _init : function() {
            var selector = this.$element.CFW_getSelectorFromChain('collapse', this.settings.target);
            if (!selector) { return; }
            this.$target = $(selector);

            this.$element.attr({
                'data-cfw': 'collapse',
                'data-cfw-collapse-target': selector
            });

            // Build trigger collection
            this.$triggers = $('[data-cfw="collapse"][data-cfw-collapse-target="' + selector + '"],' +
                '[data-cfw="collapse"][href="' + selector + '"]');

            // Check for presence of trigger id - set if not present
            // var triggerID = this.$element.CFW_getID('cfw-collapse');

            // A button can control multiple boxes so we need to id each on box individually
            var targetList = '';

            this.$target.each(function() {
                var tempID = $(this).CFW_getID('cfw-collapse');
                targetList += tempID + ' ';
            });
            // Set ARIA on trigger
            this.$triggers.attr('aria-controls', $.trim(targetList));

            // Determine default state
            var dimension = this.dimension();
            if (this.$triggers.hasClass('open')) {
                this.$triggers.attr('aria-expanded', 'true');
                this.$target.addClass('collapse in')[dimension]('');
            } else {
                this.$triggers.attr('aria-expanded', 'false');
                this.$target.addClass('collapse');
            }

            if (this.settings.horizontal) {
                this.$target.addClass('width');
            }

            // Bind click handler
            this.$element
                .on('click.cfw.collapse', this.toggle.bind(this))
                .CFW_trigger('init.cfw.collapse');
        },

        toggle : function(e) {
            if (e && !/input|textarea/i.test(e.target.tagName)) {
                e.preventDefault();
            }
            if (this.$element.hasClass('open') || this.$target.hasClass('in')) {
                this.hide();
            } else {
                this.show();
            }
        },

        dimension : function() {
            var hasWidth = this.$target.hasClass('width');
            if (hasWidth || this.settings.horizontal) {
                return 'width';
            }
            return 'height';
        },

        show : function(follow) {
            var $selfRef = this;
            if (follow === null) { follow = this.settings.follow; }

            // Bail if transition in progress
            if (this.inTransition || this.$target.hasClass('in')) { return; }

            // Start open transition
            if (!this.$element.CFW_trigger('beforeShow.cfw.collapse')) {
                return;
            }

            var dimension = this.dimension();

            this.inTransition = true;
            this.$triggers.addClass('open');

            this.$target.removeClass('collapse')[dimension](0);
            if (this.settings.animate) {
                this.$target.addClass('collapsing');
            }

            var capitalizedDimension = dimension[0].toUpperCase() + dimension.slice(1);
            var scrollSize = 'scroll' + capitalizedDimension;

            // Determine/set dimension size for each target (triggers the transition)
            var start = function() {
                $selfRef.$target.each(function() {
                    $(this)[dimension]($(this)[0][scrollSize]);
                });
            };

            var complete = function() {
                $selfRef.$triggers.attr('aria-expanded', 'true');
                $selfRef.$target
                    .removeClass('collapsing')[dimension]('');
                $selfRef.$target.addClass('collapse in');
                $selfRef.$target.CFW_mutateTrigger();
                $selfRef.inTransition = false;
                if (follow) {
                    $selfRef.$target.attr('tabindex', '-1').get(0).trigger('focus');
                }
                $selfRef.$element.CFW_trigger('afterShow.cfw.collapse');
            };

            // Bind transition callback to first target
            this.$target.eq(0).CFW_transition(start, complete);
        },

        hide : function(follow) {
            var $selfRef = this;

            if (follow === null) { follow = this.settings.follow; }

            // Bail if transition in progress
            if (this.inTransition || !this.$target.hasClass('in')) { return; }

            // Start close transition
            if (!this.$element.CFW_trigger('beforeHide.cfw.collapse')) {
                return;
            }

            var dimension = this.dimension();

            this.inTransition = true;
            this.$triggers.removeClass('open');

            // Set dimension size and reflow before class changes for Chrome/Webkit or no animation occurs
            this.$target.each(function() {
                var $this = $(this);
                return $this[dimension]($this[dimension]())[0].offsetHeight;
            });
            this.$target.removeClass('collapse in');
            if (this.settings.animate) {
                this.$target.addClass('collapsing');
            }

            // Determine/unset dimension size for each target (triggers the transition)
            var start = function() {
                $selfRef.$target[dimension]('');
            };

            var complete = function() {
                $selfRef.$triggers.attr('aria-expanded', 'false');
                $selfRef.$target
                    .removeClass('collapsing in')
                    .addClass('collapse')
                    .CFW_mutateTrigger();
                $selfRef.inTransition = false;
                if (follow) {
                    $selfRef.$element.trigger('focus');
                }
                $selfRef.$element.CFW_trigger('afterHide.cfw.collapse');
            };

            // Bind transition callback to first target
            this.$target.eq(0).CFW_transition(start, complete);
        },

        animDisable : function() {
            this.settings.animate = false;
        },

        animEnable: function() {
            this.settings.animate = true;
        },

        dispose : function() {
            this.$element
                .off('.cfw.collapse')
                .removeData('cfw.collapse');

            this.$element = null;
            this.$target = null;
            this.$triggers = null;
            this.inTransition = null;
            this.settings = null;
        }
    };

    var Plugin = function(option) {
        var args = [].splice.call(arguments, 1);
        return this.each(function() {
            var $this = $(this);
            var data = $this.data('cfw.collapse');
            var options = typeof option === 'object' && option;

            if (!data) {
                $this.data('cfw.collapse', data = new CFW_Widget_Collapse(this, options));
            }
            if (typeof option === 'string') {
                data[option].apply(data, args);
            }
        });
    };

    $.fn.CFW_Collapse = Plugin;
    $.fn.CFW_Collapse.Constructor = CFW_Widget_Collapse;
}(jQuery));

/**
 * --------------------------------------------------------------------------
 * Figuration (v4.0.1): dropdown.js
 * Licensed under MIT (https://github.com/cast-org/figuration/blob/master/LICENSE)
 * --------------------------------------------------------------------------
 */

(function($) {
    'use strict';

    var CFW_Widget_Dropdown = function(element, options) {
        this.$element = $(element);
        this.$target = null;
        this.instance = null;
        this.timerHide = null;
        this.hasContainer = {
            helper: null,
            parent: null,
            previous: null
        };
        this.inNavbar = this._insideNavbar();

        var parsedData = this.$element.CFW_parseData('dropdown', CFW_Widget_Dropdown.DEFAULTS);
        this.settings = $.extend({}, CFW_Widget_Dropdown.DEFAULTS, parsedData, options);

        // Touch enabled-browser flag - override not allowed
        this.settings.isTouch = $.CFW_isTouch;

        this.c = CFW_Widget_Dropdown.CLASSES;

        this._init();
    };

    CFW_Widget_Dropdown.CLASSES = {
        // Class names
        isMenu      : 'dropdown-menu',
        hasSubMenu  : 'dropdown-submenu',
        showSubMenu : 'show-menu',
        backLink    : 'dropdown-back',
        hover       : 'dropdown-hover'
    };

    CFW_Widget_Dropdown.DEFAULTS = {
        target    : null,
        isSubmenu : false,  // Used internally
        delay     : 350,    // Delay for hiding menu (milliseconds)
        hover     : false,  // Enable hover style navigation
        backlink  : false,  // Insert back links into submenus
        backtop   : false,  // Should back links start at top level
        backtext  : 'Back', // Text for back links
        container : false,   // Where to place dropdown in DOM
        reference : 'toggle',
        boundary  : 'scrollParent',
        flip      : true,
        display   : 'dynamic',
        popperConfig    : null
    };

    /* eslint-disable complexity */
    var clearMenus = function(e) {
        var KEYCODE_TAB = 9;    // Tab

        // Ignore right-click
        var RIGHT_MOUSE_BUTTON_WHICH = 3; // MouseEvent.which value for the right button (assuming a right-handed mouse)
        if (e && e.which === RIGHT_MOUSE_BUTTON_WHICH) { return; }

        var $items = $('[data-cfw="dropdown"]');
        // Do menu items in reverse to close from bottom up
        for (var i = $items.length; i--;) {
            var $trigger = $($items[i]);
            var itemData = $trigger.data('cfw.dropdown');
            if (!itemData) {
                continue;
            }

            var $itemMenu = itemData.$target;
            if ($itemMenu === null) {
                continue;
            }
            if (!$itemMenu.hasClass('open')) {
                continue;
            }

            if (e) {
                // Ignore key event
                // - tab navigation movement inside a menu
                if (e.type === 'keyup') {
                    if (e.which !== KEYCODE_TAB) {
                        continue;
                    }
                }

                // Ignore clicks for
                // - input areas
                // - menu triggers
                // - 'back' buttons
                if (e.type === 'click') {
                    if (/label|input|textarea/i.test(e.target.tagName) ||
                    this === e.target ||
                    $(e.target).is('[data-cfw="dropdown"]') ||
                    $(e.target).closest('.dropdown-back').length) {
                        continue;
                    }
                }

                // Ignore if hover/mouse
                // - if still inside menu
                if (e.type === 'mouseenter') {
                    if (this === e.target || $itemMenu[0].contains(e.target)) {
                        continue;
                    }
                }
            }

            var eventProperties = {
                relatedTarget: $trigger[0]
            };
            if (e && e.type === 'click') {
                eventProperties.clickEvent = e;
            }

            if (!$trigger.CFW_trigger('beforeHide.cfw.dropdown', eventProperties)) {
                continue;
            }

            // Remove empty mouseover listener for iOS work-around
            if (!itemData.settings.isSubmenu && $.CFW_isTouch) {
                $('body').children().off('mouseover', null, $.noop);
            }

            $trigger
                .attr('aria-expanded', 'false')
                .removeClass('open');
            $itemMenu
                .removeClass('open');

            $trigger
                .CFW_Dropdown('containerReset')
                .CFW_Dropdown('popperReset');

            $trigger.CFW_trigger('afterHide.cfw.dropdown', eventProperties);
        }
    };
    /* eslint-enable complexity */

    CFW_Widget_Dropdown.prototype = {
        _init : function() {
            var $selfRef = this;
            this.popper = null;

            // Get target menu
            var selector = this.$element.CFW_getSelectorFromChain('dropdown', this.settings.target);
            var $target = $(selector);

            // Target by next sibling class
            if (!$target.length) {
                $target = $(this.$element.next('.dropdown-menu, ul, ol')[0]);
            }
            if (!$target.length) { return; }
            this.$target = $target;

            // Get previous sibling to menu if container is to be used
            if (this._useContainer()) {
                this.hasContainer = {
                    parent   : this.$target.parent(),
                    previous : this.$target.prev()
                };
            }

            this.$element.attr('data-cfw', 'dropdown');
            // Get `id`s
            this.instance = this.$element.CFW_getID('cfw-dropdown');
            this.$target.CFW_getID('cfw-dropdown');

            // Set default ARIA and class
            this.$element
                .attr('aria-expanded', 'false');
            this.$target
                .attr('aria-labelledby', this.instance)
                .addClass(this.c.isMenu);

            // Toggle on the trigger
            this.$element.on('click.cfw.dropdown', function(e) {
                e.preventDefault();
                e.stopPropagation();
                $selfRef.toggle(e);
            });

            // Add 'Back' links
            this._addBacklink();

            // Find submenu items
            var $subToggle = this.$target.children('li').children('ul, ol').parent();
            $subToggle.each(function() {
                var $this = $(this);
                var $subElement = $this.children('a').eq(0);
                var $subTarget = $this.children('ul, ol').eq(0);
                var subOptions = {};

                if ($subElement.length && $subTarget.length) {
                    $this.addClass($selfRef.c.hasSubMenu);
                    if ($subElement[0].nodeName === 'A') {
                        $subElement.attr('role', 'button');
                    }
                    // Pass parent settings, with some overrides
                    // then add dropdown functionality to submenu
                    subOptions = {
                        isSubmenu: true,
                        target: $subTarget.CFW_getID('cfw-dropdown')
                    };
                    subOptions = $.extend({}, $selfRef.settings, subOptions);
                    $subElement.CFW_Dropdown(subOptions);
                }

                // Manipulate directions of submenus
                var $dirNode = $subTarget.closest('.dropreverse, .dropend, .dropstart');
                if ($dirNode.hasClass('dropreverse') || $dirNode.hasClass('dropstart')) {
                    $subTarget.addClass('dropdown-subalign-reverse');
                } else {
                    $subTarget.addClass('dropdown-subalign-forward');
                }
            });

            // Set role on dividers
            this.$target.find('.dropdown-divider').attr('role', 'separator');

            // Add keyboard navigation
            this._navEnableKeyboard();

            // Touch OFF - Hover mode
            if (!this.settings.isTouch && this.settings.hover) {
                this._navEnableHover();
            }

            this.$element.CFW_trigger('init.cfw.dropdown');
        },

        _findMenuItems : function() {
            var showing = this.$target.hasClass('open');
            var $menu = this.$target;
            if (!showing && this.settings.isSubmenu) {
                $menu = this.$element.closest('.dropdown-menu');
            }

            var $items = $menu.children('li').find('a, .dropdown-item, button, input, textarea');
            $items = $items.filter(':not(.disabled, :disabled):not(:has(input)):not(:has(textarea)):visible');
            return $items;
        },

        _addBacklink : function() {
            var $selfRef = this;
            if ((this.settings.backlink && this.settings.backtop && !this.settings.isSubmenu) ||
                (this.settings.backlink && this.settings.isSubmenu)) {
                var $backItem = $('<li class="' + this.c.backLink + '"><button type="button" class="dropdown-item">' + this.settings.backtext + '</button></li>')
                    .prependTo(this.$target);

                $backItem.children('button').on('click.cfw.dropdown.modeClick', function() {
                    $selfRef.hide();
                    $selfRef.$element.focus();
                });
            }
        },

        _navEnableKeyboard : function() {
            var $selfRef = this;
            $.each([this.$element, this.$target], function() {
                $(this).on('keydown.cfw.dropdown', function(e) {
                    $selfRef._actionsKeydown(e);
                });
            });
        },

        /* eslint-disable complexity */
        _actionsKeydown : function(e) {
            var showing = this.$target.hasClass('open');

            var KEYCODE_UP = 38;    // Arrow up
            var KEYCODE_RIGHT = 39; // Arrow right
            var KEYCODE_DOWN = 40;  // Arrow down
            var KEYCODE_LEFT = 37;  // Arrow left
            var KEYCODE_ESC = 27;   // Escape
            var KEYCODE_SPACE = 32; // Space
            var KEYCODE_TAB = 9;    // Tab

            var REGEX_KEYS = new RegExp('^(' + KEYCODE_UP + '|' + KEYCODE_RIGHT + '|' + KEYCODE_DOWN + '|' + KEYCODE_LEFT + '|' + KEYCODE_ESC + '|' + KEYCODE_SPACE + '|' + KEYCODE_TAB + ')$');
            var REGEX_ARROWS = new RegExp('^(' + KEYCODE_UP + '|' + KEYCODE_RIGHT + '|' + KEYCODE_DOWN + '|' + KEYCODE_LEFT + ')$');

            var isInput = /input|textarea/i.test(e.target.tagName);
            var isCheck = isInput && /checkbox|radio/i.test($(e.target).prop('type'));
            var isRealButton = /button/i.test(e.target.tagName);
            var isRoleButton = /button/i.test($(e.target).attr('role'));

            if (!REGEX_KEYS.test(e.which)) { return; }
            // Ignore space in inputs and buttons
            if ((isInput || isRealButton) && e.which === KEYCODE_SPACE) { return; }
            // Ignore arrows in inputs, except for checkbox/radio
            if (isInput && !isCheck && REGEX_ARROWS.test(e.which)) { return; }

            // Allow ESC and LEFT to propagate if menu is closed
            if (!showing && (e.which === KEYCODE_ESC || e.which === KEYCODE_LEFT) && $(e.target).is(this.$element)) {
                return;
            }

            var $items = null;
            var index = -1;

            // Handle TAB if using a container
            if (e.which === KEYCODE_TAB) {
                if (this.hasContainer.helper !== null) {
                    $items = this._findMenuItems();
                    if (!$items.length) { return; }

                    // Find current focused menu item
                    index = $items.index(document.activeElement);
                    if (index < 0 && isCheck) {
                        index = $items.index($(e.target).closest('.dropdown-item')[0]);
                    }

                    if (showing && $(e.target).is(this.$element) && !e.shiftKey) {
                        e.which = KEYCODE_DOWN;
                    } else if (e.shiftKey && index === 0) {
                        this.$element.trigger('focus');
                        e.preventDefault();
                        e.stopPropagation();
                        return;
                    } else if (!e.shiftKey && index === $items.length - 1) {
                        this.$element.trigger('focus');
                        return;
                    } else {
                        return;
                    }
                } else {
                    return;
                }
            }

            e.preventDefault();
            e.stopPropagation();

            // Close current focused menu with ESC
            if (e.which === KEYCODE_ESC) {
                this.hide();
                this.$element.trigger('focus');
            }

            // Ignore disabled items
            if (this.$element.is('.disabled, :disabled')) {
                return;
            }

            // Emulate button behaviour
            if (isRoleButton && e.which === KEYCODE_SPACE) {
                this.toggle(e);
                return;
            }

            // Open/close menus
            if (e.which === KEYCODE_UP || e.which === KEYCODE_DOWN) {
                // Open menu if top level
                if (!showing && !this.settings.isSubmenu) {
                    this.show();
                }
            }

            // Right
            if (e.which === KEYCODE_RIGHT) {
                if (!showing && this.settings.isSubmenu) {
                    this.show();
                }
            }

            // Left
            if (e.which === KEYCODE_LEFT) {
                this.hide();
                this.$element.trigger('focus');
            }

            // Focus control
            $items = this._findMenuItems();
            if (!$items.length) { return; }

            // Find current focused menu item
            index = $items.index(document.activeElement);
            if (index < 0 && isCheck) {
                index = $items.index($(e.target).closest('.dropdown-item')[0]);
            }

            if (e.which === KEYCODE_UP && index > 0) { index--; } // up
            if (e.which === KEYCODE_DOWN && index < $items.length - 1) { index++; } // down
            /* eslint-disable-next-line no-bitwise */
            if (!~index) { index = 0; } // force first item

            $items.eq(index).trigger('focus');
        },
        /* eslint-enable complexity */

        _navEnableHover : function() {
            var $selfRef = this;
            if (!this.settings.isTouch) {
                $.each([this.$element, this.$target], function() {
                    $(this).on('mouseenter.cfw.dropdown.modeHover', function(e) {
                        $selfRef._actionsHoverEnter(e);
                    });
                    $(this).on('mouseleave.cfw.dropdown.modeHover', function(e) {
                        $selfRef._actionsHoverLeave(e);
                    });
                });
            }
        },

        _navDisableHover : function() {
            this.$element.off('.cfw.dropdown.modeHover');
            this.$target.off('.cfw.dropdown.modeHover');
        },

        _actionsHoverEnter : function(e) {
            clearTimeout(this.timerHide);
            clearMenus(e);
            this.show();
        },

        _actionsHoverLeave : function(e) {
            var $selfRef = this;
            var $node = $(e.target);

            clearTimeout(this.timerHide);
            if ($node.is(this.$element) || $node.is(this.$target) || this.$target[0].contains($node[0])) {
                this.timerHide = setTimeout(function() {
                    $selfRef.timerHide = null;
                    $selfRef.hide();
                }, this.settings.delay);
            }
        },

        _insideNavbar : function() {
            return this.$element.closest('.navbar-collapse').length > 0;
        },

        _useContainer : function() {
            // return !this.settings.isSubmenu && this.settings.container && !this.inNavbar;
            return !this.settings.isSubmenu && this.settings.container;
        },

        _containerPlacement : function() {
            var elRect = this.$element[0].getBoundingClientRect();
            elRect =  $.extend({}, elRect, this.$element.offset());
            this.hasContainer.helper.css({
                top: elRect.top,
                left: elRect.left,
                width: elRect.width,
                height: elRect.height
            });
        },

        _containerSet : function() {
            if (this._useContainer()) {
                this.hasContainer.helper = $(document.createElement('div'));
                this.hasContainer.helper
                    .appendTo(this.settings.container)
                    .append(this.$target)
                    .addClass('dropdown-container');

                $(window).on('resize.cfw.dropdown.' + this.instance, this._containerPlacement.bind(this));

                this._containerPlacement();
            }
        },

        containerReset : function() {
            if (this._useContainer()) {
                $(window).off('resize.cfw.dropdown.' + this.instance);
                if (this.hasContainer.previous.length) {
                    this.$target.insertAfter($(this.hasContainer.previous));
                } else {
                    this.$target.appendTo($(this.hasContainer.parent));
                }
                if (this.hasContainer.helper !== null) {
                    this.hasContainer.helper
                        .off('keydown.cfw.dropdown')
                        .off('focusout.cfw.dropdown');
                    this.hasContainer.helper.remove();
                }
                this.hasContainer.helper = null;
            }
        },

        _isElement : function(node) {
            return (node[0] || node).nodeType;
        },

        _getReference : function() {
            var reference = this.$element[0];

            if (this.hasContainer.helper !== null) {
                reference = this.hasContainer.helper;
            }

            if (this.settings.reference === 'parent') {
                reference = this.$element.parent().get(0);
            } else if (this._isElement(this.settings.reference)) {
                reference = this.settings.reference;

                // Check for jQuery element
                if (typeof this.settings.reference.jquery !== 'undefined') {
                    reference = this.settings.reference[0];
                }
            }

            return reference;
        },

        _getPlacement : function() {
            var directionVal = window.getComputedStyle(this.$element[0], null).getPropertyValue('direction').toLowerCase();
            var isRTL = Boolean(directionVal === 'rtl');
            var attachmentMap = {
                AUTO: 'auto',
                TOP: isRTL ? 'top-end' : 'top-start',
                TOPEND: isRTL ? 'top-start' : 'top-end',
                FORWARD: isRTL ? 'left-start' : 'right-start',
                FORWARDEND: isRTL ? 'left-end' : 'right-end',
                BOTTOM: isRTL ? 'bottom-end' : 'bottom-start',
                BOTTOMEND: isRTL ? 'bottom-start' : 'bottom-end',
                REVERSE: isRTL ? 'right-start' : 'left-start',
                REVERSEEND: isRTL ? 'right-end' : 'left-end'
            };

            var $dirNode = this.$target.closest('.dropup, .dropreverse, .dropstart, .dropend');
            var dirV = $dirNode.hasClass('dropup') ? 'TOP' : 'BOTTOM';
            var appendV = $dirNode.hasClass('dropreverse') ? 'END' : '';
            var dirH = $dirNode.hasClass('dropstart') || $dirNode.hasClass('dropreverse') ? 'REVERSE' : 'FORWARD';
            var appendH = $dirNode.hasClass('dropup') ? 'END' : '';

            var placement = attachmentMap[dirV + appendV];

            if ($dirNode.hasClass('dropstart') || $dirNode.hasClass('dropend')) {
                placement = attachmentMap[dirH + appendH];
            }

            if (this.settings.isSubmenu) {
                placement = attachmentMap[dirH + appendH];
            }
            return placement;
        },

        _getPopperConfig : function() {
            var defaultConfig = {
                placement: this._getPlacement(),
                modifiers: {
                    flip: {
                        enabled: this.settings.flip,
                        behavior: 'flip'
                    },
                    preventOverflow: {
                        boundariesElement: this.settings.boundary
                    }
                }
            };

            // Use deep merge
            var returnConfig = $.extend(true, defaultConfig, this.settings.popperConfig);
            return returnConfig;
        },

        popperReset : function() {
            if (this.popper) {
                this.popper.destroy();
            }
        },

        _popperLocate: function() {
            var isStatic = Boolean(window.getComputedStyle(this.$target[0], null).getPropertyValue('position').toLowerCase() === 'static');

            if (this.settings.display !== 'dynamic') { return; }
            if (isStatic) { return; }

            if (typeof Popper === 'undefined') {
                throw new TypeError('Figurations\'s Dropdown widget requires Popper.js (https://popper.js.org)');
            }

            this.popper = new Popper(this._getReference(), this.$target[0], this._getPopperConfig());
        },

        toggle : function(e) {
            if (e) {
                e.preventDefault();
                e.stopPropagation();
            }

            if (this.$element.is('.disabled, :disabled')) {
                return;
            }

            var showing = this.$target.hasClass('open');

            clearMenus(e);

            if (showing) {
                this.hide();
            } else {
                this.show();
            }
        },

        show : function() {
            var $selfRef = this;

            if (this.$element.is('.disabled, :disabled') || this.$target.hasClass('open')) {
                return;
            }

            var eventProperties = {
                relatedTarget: this.$element[0]
            };
            if (!this.$element.CFW_trigger('beforeShow.cfw.dropdown', eventProperties)) {
                return;
            }

            // Move root menu if container is to be used
            this._containerSet();

            this.$element
                .attr('aria-expanded', 'true')
                .addClass('open');
            this.$target
                .addClass('open')
                .find('li').redraw();

            // Handle loss of focus
            $(document)
                .on('focusin.cfw.dropdown.' + this.instance, function(e) {
                    if ($selfRef.$element[0] !== e.target && !$selfRef.$target.has(e.target).length) {
                        $selfRef.hide();
                    }
                });

            this._popperLocate();

            this.$element.CFW_trigger('afterShow.cfw.dropdown', eventProperties);
        },

        hide : function() {
            if (this.$element.is('.disabled, :disabled') || !this.$target.hasClass('open')) {
                return;
            }

            var eventProperties = {
                relatedTarget: this.$element[0]
            };
            if (!this.$element.CFW_trigger('beforeHide.cfw.dropdown', eventProperties)) {
                return;
            }

            $(document).off('focusin.cfw.dropdown.' + this.instance);

            this.$element
                .attr('aria-expanded', 'false')
                .removeClass('open');
            this.$target
                .removeClass('open');

            this.containerReset();
            this.popperReset();

            this.$element
                .CFW_trigger('afterHide.cfw.dropdown', eventProperties);
        },

        dispose : function() {
            var $subToggle = this.$target.children('li').children('ul, ol').children('a');
            // Do menu items in reverse to dispose from bottom up
            for (var i = $subToggle.length; i--;) {
                $subToggle[i].eq(0).CFW_Dropdown('dispose');
            }
            this._navDisableHover();
            this.hide();

            $(document).off('.cfw.dropdown.' + this.instance);
            $(window).off('.cfw.dropdown.' + this.instance);
            this.$target.find('.' + this.c.backLink).remove();
            this.$target.off('.cfw.dropdown');
            this.$element
                .off('.cfw.dropdown')
                .removeData('cfw.dropdown');

            this.$element = null;
            this.$target = null;
            this.instance = null;
            this.timerHide = null;
            this.hasContainer = null;
            this.inNavbar = null;
            this.settings = null;
            if (this.popper) {
                this.popper.destroy();
            }
            this.popper = null;
        }
    };

    $.fn.redraw = function() {
        return this.offsetHeight;
    };

    var Plugin = function(option) {
        var args = [].splice.call(arguments, 1);
        return this.each(function() {
            var $this = $(this);
            var data = $this.data('cfw.dropdown');
            var options = typeof option === 'object' && option;

            if (!data) {
                $this.data('cfw.dropdown', data = new CFW_Widget_Dropdown(this, options));
            }
            if (typeof option === 'string') {
                data[option].apply(data, args);
            }
        });
    };

    $.fn.CFW_Dropdown = Plugin;
    $.fn.CFW_Dropdown.Constructor = CFW_Widget_Dropdown;

    // Handle closing menu when clicked outside of menu area
    $(window).ready(function() {
        $(document).on('click', clearMenus);
    });
}(jQuery));

/**
 * --------------------------------------------------------------------------
 * Figuration (v4.0.1): tab.js
 * Licensed under MIT (https://github.com/cast-org/figuration/blob/master/LICENSE)
 * --------------------------------------------------------------------------
 */

(function($) {
    'use strict';

    var CFW_Widget_Tab = function(element, options) {
        this.$element = $(element);
        this.$target = null;
        this.$navElm = null;

        var parsedData = this.$element.CFW_parseData('tab', CFW_Widget_Tab.DEFAULTS);
        this.settings = $.extend({}, CFW_Widget_Tab.DEFAULTS, parsedData, options);

        this._init();
    };

    CFW_Widget_Tab.DEFAULTS = {
        target  : null,
        animate : true // If tabs should be allowed fade in and out
    };

    CFW_Widget_Tab.prototype = {
        _init : function() {
            var $selfRef = this;

            // Find nav and target elements
            this.$navElm = this.$element.closest('ul, ol, nav');
            this.$navElm.attr('role', 'tablist');

            var $selector = $(this.settings.target);
            if (!$selector.length) {
                $selector = $(this.$element.attr('href'));
            }
            this.$target = $($selector);

            if (!this.$target.length) { return; }

            this.$element.attr('data-cfw', 'tab');

            // Check for presence of trigger id - set if not present
            var triggerID = this.$element.CFW_getID('cfw-tab');

            // Target should have id already - set ARIA attributes
            this.$target.attr({
                'role': 'tabpanel',
                'aria-labelledby': triggerID
            });
            if (this.settings.animate) {
                this.animEnable();
            } else {
                this.animDisable();
            }

            // Set ARIA attributes on trigger
            this.$element.attr({
                'tabindex': -1,
                'role': 'tab',
                'aria-selected': 'false',
                'aria-controls': this.$target.attr('id')
            });
            this.$element.parent('li').attr('role', 'presentation');

            // Bind click handler
            this.$element.on('click.cfw.tab', function(e) {
                e.preventDefault();
                $selfRef.show(e);
            });

            // Bind key handler
            this.$element.on('keydown.cfw.tab', function(e) {
                $selfRef._actionsKeydown(e, this);
            });

            // Display panel if trigger is marked active
            if (this.$element.hasClass('active')) {
                this.$element.attr({
                    'tabindex': 0,
                    'aria-selected': 'true'
                });
                this.$target.addClass('active');

                if (this.settings.animate) {
                    this.$target.addClass('in');
                }
            }

            // Check to see if there is an active element defined - if not set current one as active
            if (this.$navElm.find('.active').length <= 0) {
                this.$element.addClass('active');

                this.$element.attr({
                    'tabindex': 0,
                    'aria-selected': 'true'
                });
                this.$target.addClass('active');

                if (this.settings.animate) {
                    this.$target.addClass('in');
                }
            }

            this.$element.CFW_trigger('init.cfw.tab');
        },

        show : function(e) {
            if (e) {
                e.preventDefault();
            }

            if (this.$element.hasClass('active') ||
                this.$element.hasClass('disabled') ||
                this.$element[0].hasAttribute('disabled')) {
                return;
            }

            var $previous = this.$navElm.find('.active');
            var eventHideResult;
            var eventShowResult;

            if ($previous.length) {
                eventHideResult = $previous.last().CFW_trigger('beforeHide.cfw.tab', {
                    relatedTarget: this.$element[0]
                });
            }

            eventShowResult = this.$element.CFW_trigger('beforeShow.cfw.tab', {
                relatedTarget: $previous.last()[0]
            });

            if (!eventHideResult || !eventShowResult) {
                return;
            }

            if ($previous.length) {
                $previous
                    .attr({
                        'tabindex': -1,
                        'aria-selected': 'false'
                    });
            }

            this.$element.attr({
                'tabindex': 0,
                'aria-selected': 'true'
            });

            this._activateTab();
        },

        animEnable : function() {
            this.$target.addClass('fade');
            if (this.$target.hasClass('active')) {
                this.$target.addClass('in');
            }
            this.settings.animate = true;
        },

        animDisable : function() {
            this.$target.removeClass('fade in');
            this.settings.animate = false;
        },

        _actionsKeydown : function(e, node) {
            var KEYCODE_UP = 38;    // Arrow up
            var KEYCODE_RIGHT = 39; // Arrow right
            var KEYCODE_DOWN = 40;  // Arrow down
            var KEYCODE_LEFT = 37;  // Arrow left
            var REGEX_KEYS = new RegExp('^(' + KEYCODE_UP + '|' + KEYCODE_RIGHT + '|' + KEYCODE_DOWN + '|' + KEYCODE_LEFT + ')$');

            if (!REGEX_KEYS.test(e.which)) { return; }

            e.stopPropagation();
            e.preventDefault();

            var $node = $(node);
            var $list = $node.closest('[role="tablist"]');
            var $items = $list.find('[role="tab"]:visible').not('.disabled');
            var index = $items.index($items.filter('[aria-selected="true"]'));

            if ((e.which === KEYCODE_UP || e.which === KEYCODE_LEFT) && index > 0) { index--; } // up & left
            if ((e.which === KEYCODE_RIGHT || e.which === KEYCODE_DOWN) && index < $items.length - 1) { index++; } // down & right
            /* eslint-disable-next-line no-bitwise */
            if (!~index) { index = 0; }   // force first item

            var nextTab = $items.eq(index);
            nextTab.CFW_Tab('show').trigger('focus');
        },

        _activateTab : function() {
            var $selfRef = this;
            var $items = this.$navElm.find('[role="tab"]');
            var $previous = this.$navElm.find('[role="tab"].active');

            $items.removeClass('active');
            $items.each(function() {
                var $pane = $(this).data('cfw.tab').$target;
                $pane.removeClass('active in');
            });

            if (this.settings.animate) {
                this.animEnable();
            } else {
                this.animDisable();
            }

            this.$element.addClass('active');
            this.$target.addClass('active');

            var complete = function() {
                $previous.last().CFW_trigger('afterHide.cfw.tab', {
                    relatedTarget: $selfRef.$element[0]
                });
                $selfRef.$element.CFW_trigger('afterShow.cfw.tab', {
                    relatedTarget: $previous.last()[0]
                });
                $selfRef.$element.CFW_mutateTrigger();
                $selfRef.$target.CFW_mutateTrigger();
            };

            if (this.settings.animate) {
                this.$target.CFW_transition(null, complete);
                $.CFW_reflow(this.$target); // Reflow for transition
                this.$target.addClass('in');
            } else {
                complete();
            }
        },

        dispose : function() {
            this.$element
                .off('.cfw.tab')
                .removeData('cfw.tab');

            this.$element = null;
            this.$target = null;
            this.$navElm = null;
            this.settings = null;
        }
    };

    var Plugin = function(option) {
        var args = [].splice.call(arguments, 1);
        return this.each(function() {
            var $this = $(this);
            var data = $this.data('cfw.tab');
            var options = typeof option === 'object' && option;

            if (!data) {
                $this.data('cfw.tab', data = new CFW_Widget_Tab(this, options));
            }
            if (typeof option === 'string') {
                data[option].apply(data, args);
            }
        });
    };

    $.fn.CFW_Tab = Plugin;
    $.fn.CFW_Tab.Constructor = CFW_Widget_Tab;
}(jQuery));

/**
 * --------------------------------------------------------------------------
 * Figuration (v4.0.1): affix.js
 * Licensed under MIT (https://github.com/cast-org/figuration/blob/master/LICENSE)
 * --------------------------------------------------------------------------
 */

(function($) {
    'use strict';

    var CFW_Widget_Affix = function(element, options) {
        this.$element = $(element);
        this.$target = null;
        this.affixed = null;
        this.unpin = null;
        this.pinnedOffset = null;

        var parsedData = this.$element.CFW_parseData('affix', CFW_Widget_Affix.DEFAULTS);
        this.settings = $.extend({}, CFW_Widget_Affix.DEFAULTS, parsedData, options);

        this._init();
    };

    CFW_Widget_Affix.RESET = 'affix affix-top affix-bottom';

    CFW_Widget_Affix.DEFAULTS = {
        target : window,
        top    : 0,
        bottom : 0
    };

    CFW_Widget_Affix.prototype = {
        _init : function() {
            this.$element.attr('data-cfw', 'affix');

            // Bind events
            this.$target = $(this.settings.target)
                .on('scroll.cfw.affix',  this.checkPosition.bind(this))
                .on('click.cfw.affix',  this.checkPositionDelayed.bind(this));

            this.$element.CFW_trigger('init.cfw.affix');

            this.checkPosition();
        },

        getState : function(scrollHeight, height, offsetTop, offsetBottom) {
            var scrollTop    = this.$target.scrollTop();
            var position     = this.$element.offset();
            var targetHeight = this.$target.height();

            if (offsetTop !== null && this.affixed === 'top') {
                return scrollTop < offsetTop ? 'top' : false;
            }

            if (this.affixed === 'bottom') {
                if (offsetTop !== null) {
                    return scrollTop + this.unpin <= position.top ? false : 'bottom';
                }

                return scrollTop + targetHeight <= scrollHeight - offsetBottom ? false : 'bottom';
            }

            var initializing = this.affixed === null;
            var colliderTop = initializing ? scrollTop : position.top;
            var colliderHeight = initializing ? targetHeight : height;

            if (offsetTop !== null && scrollTop <= offsetTop) {
                return 'top';
            }
            if (offsetBottom !== null && colliderTop + colliderHeight >= scrollHeight - offsetBottom) {
                return 'bottom';
            }

            return false;
        },

        getPinnedOffset : function() {
            if (this.pinnedOffset) { return this.pinnedOffset; }
            this.$element.removeClass(CFW_Widget_Affix.RESET).addClass('affix');
            var scrollTop = this.$target.scrollTop();
            var position  = this.$element.offset();
            this.pinnedOffset = position.top - scrollTop;
            return this.pinnedOffset;
        },

        checkPositionDelayed : function() {
            setTimeout(this.checkPosition.bind(this), 1);
        },

        checkPosition : function() {
            if (!this.$element.is(':visible')) { return; }

            var height       = this.$element.height();
            var offsetTop    = this.settings.top;
            var offsetBottom = this.settings.bottom;
            var scrollHeight =  Math.max($(document).height(), $(document.body).height());

            if (typeof offsetTop === 'function') {
                offsetTop    = offsetTop(this.$element);
            }
            if (typeof offsetBottom === 'function') {
                offsetBottom = offsetBottom(this.$element);
            }

            var affix = this.getState(scrollHeight, height, offsetTop, offsetBottom);

            if (this.affixed !== affix) {
                if (this.unpin !== null) {
                    this.$element.css({
                        top: '',
                        position: ''
                    });
                }

                var affixType = 'affix' + (affix ? '-' + affix : '');
                var eventName = affixType + '.cfw.affix';

                if (!this.$element.CFW_trigger(eventName)) {
                    return;
                }

                this.affixed = affix;
                this.unpin = affix === 'bottom' ? this.getPinnedOffset() : null;

                this.$element
                    .removeClass(CFW_Widget_Affix.RESET)
                    .addClass(affixType)
                    .CFW_trigger(eventName.replace('affix', 'affixed'));
            }

            if (affix === 'bottom') {
                this.$element.offset({
                    top: scrollHeight - height - offsetBottom
                });
            }
        },

        dispose : function() {
            this.$target
                .off('.cfw.affix');
            this.$element
                .removeClass(CFW_Widget_Affix.RESET)
                .removeData('cfw.affix');

            this.$element = null;
            this.$target = null;
            this.affixed = null;
            this.unpin = null;
            this.pinnedOffset = null;
            this.settings = null;
        }
    };

    var Plugin = function(option) {
        var args = [].splice.call(arguments, 1);
        return this.each(function() {
            var $this = $(this);
            var data = $this.data('cfw.affix');
            var options = typeof option === 'object' && option;

            if (!data) {
                $this.data('cfw.affix', data = new CFW_Widget_Affix(this, options));
            }
            if (typeof option === 'string') {
                data[option].apply(data, args);
            }
        });
    };

    $.fn.CFW_Affix = Plugin;
    $.fn.CFW_Affix.Constructor = CFW_Widget_Affix;
}(jQuery));


/**
 * --------------------------------------------------------------------------
 * Figuration (v4.0.1): tooltip.js
 * Licensed under MIT (https://github.com/cast-org/figuration/blob/master/LICENSE)
 * --------------------------------------------------------------------------
 */

(function($) {
    'use strict';

    var CFW_Widget_Tooltip = function(element, options) {
        this._init('tooltip', element, options);
    };

    CFW_Widget_Tooltip.DEFAULTS = {
        target          : false,            // Target selector
        placement       : 'top',            // Where to locate tooltip (top/bottom/reverse(left))/forward(right)/auto)
        trigger         : 'hover focus',    // How tooltip is triggered (click/hover/focus/manual)
        animate         : true,             // Should the tooltip fade in and out
        delay : {
            show        : 0,                // Delay for showing tooltip (milliseconda)
            hide        : 100               // Delay for hiding tooltip (milliseconds)
        },
        container       : false,            // Where to place tooltip if moving is needed
        viewport        : 'scrollParent',   // Viewport to constrain tooltip within
        padding         : 0,                // Padding from viewport edge
        html            : false,            // Use HTML or text insertion mode
        closetext       : '<span aria-hidden="true">&times;</span>', // Text for close links
        closesrtext     : 'Close',          // Screen reader text for close links
        title           : '',               // Title text/html to be inserted
        show            : false,            // Auto show after init
        unlink          : false,            // If on hide to remove events and attributes from tooltip and trigger
        dispose         : false,            // If on hide to unlink, then remove tooltip from DOM
        template        : '<div class="tooltip"><div class="tooltip-body"></div><div class="tooltip-arrow"></div></div>',
        gpuAcceleration : true,
        popperConfig    : null

    };

    CFW_Widget_Tooltip.prototype = {
        _init : function(type, element, options) {
            if (typeof Popper === 'undefined') {
                throw new TypeError('Figurations\'s Tooltip widget requires Popper.js (https://popper.js.org)');
            }

            this.type = type;
            this.$element = $(element);
            this.$target = null;
            this.$arrow = null;
            this.$focusFirst = null;
            this.$focusLast = null;
            this.instance = null;
            this.isDialog = false;
            this.follow = false;
            this.eventTypes = null;
            this.delayTimer = null;
            this.inTransition = null;
            this.closeAdded = false;
            this.activate = false;
            this.hoverState = null;
            this.dynamicTip = false;
            this.inserted = false;
            this.flags = {
                keyShift: false,
                keyTab : false
            };
            this.popper = null;

            this.settings = this.getSettings(options);

            this.inState = {
                click: false,
                hover: false,
                focus: false
            };

            this.$element.attr('data-cfw', this.type);

            var selector = this.$element.CFW_getSelectorFromChain(this.type, this.settings.target);
            if (selector !== null) {
                this.$target = $(selector);
            } else {
                this.fixTitle();
            }

            if (this.settings.show && this.settings.trigger !== 'manual') {
                this.settings.trigger = 'click';
            }

            // Bind events
            this.eventTypes = this.settings.trigger.split(' ');
            this.bindTip(true);

            if (this.$target) {
                this.$target.data('cfw.' + this.type, this);
            }

            if (this.settings.show) {
                this.activate = true;
                this.inState.click = true;
                this.show();
            }

            this.$element.CFW_trigger('init.cfw.' + this.type);
        },

        getDefaults: function() {
            return CFW_Widget_Tooltip.DEFAULTS;
        },

        getSettings : function(options) {
            var parsedData = this.$element.CFW_parseData(this.type, this.getDefaults());
            var settings = $.extend({}, this.getDefaults(), parsedData, options);
            if (settings.delay && typeof settings.delay === 'number') {
                settings.delay = {
                    show: settings.delay,
                    hide: settings.delay
                };
            }
            return settings;
        },

        createTip : function() {
            var $tip = $(this.settings.template);
            return $tip;
        },

        fixTitle : function() {
            var $e = this.$element;
            if ($e.attr('title') || typeof $e.attr('data-cfw-' + this.type + '-original-title') !== 'string') {
                $e.attr('data-cfw-' + this.type + '-original-title', $e.attr('title') || '').attr('title', '');
            }
        },

        getTitle : function() {
            var $e = this.$element;
            var s = this.settings;

            var title = typeof s.title === 'function' ? s.title.call($e[0]) : s.title || $e.attr('data-cfw-' + this.type + '-original-title');

            return title;
        },

        setContent : function() {
            var $tip = this.$target;
            var $inner = $tip.find('.tooltip-body');

            if (this.dynamicTip) {
                var title = this.getTitle();
                if (this.settings.html) {
                    $inner.html(title);
                } else {
                    $inner.text(title);
                }
            }

            $tip.removeClass('fade in');
        },

        linkTip : function() {
            // Check for presence of trigger and target ids - set if not present
            this.instance = this.$element.CFW_getID('cfw-' + this.type);
            this.targetID = this.$target.CFW_getID('cfw-' + this.type);

            var attrRole = 'tooltip';
            if (this.type !== 'tooltip' && this.isDialog) {
                attrRole = 'dialog';
            }

            // Set ARIA attributes on target
            this.$target.attr({
                'role': attrRole,
                'aria-hidden': 'true',
                'tabindex': -1
            });
        },

        bindTip : function(modeInit) {
            var $selfRef = this;

            for (var i = this.eventTypes.length; i--;) {
                var eventType = this.eventTypes[i];
                if (eventType === 'click' || eventType === 'manual') {
                    this.isDialog = true;
                }
                if (eventType === 'click') {
                    // Click events
                    this.$element
                        .off('click.cfw.' + this.type)
                        .on('click.cfw.' + this.type, this.toggle.bind(this));

                    // Inject close button
                    if (this.$target !== null && !this.closeAdded) {
                        // Check for pre-existing close buttons
                        if (!this.$target.find('[data-cfw-dismiss="' + this.type + '"]').length) {
                            var $close = $('<button type="button" class="close" data-cfw-dismiss="' + this.type + '" aria-label="' + this.settings.closesrtext + '">' + this.settings.closetext + '</button>');
                            $close.prependTo(this.$target);
                            this.closeAdded = true;
                        }
                    }
                } else if (eventType !== 'manual') {
                    // Hover/focus events
                    var eventIn  = eventType === 'hover' ? 'mouseenter' : 'focusin';
                    var eventOut = eventType === 'hover' ? 'mouseleave' : 'focusout';

                    if (modeInit) {
                        this.$element.on(eventIn + '.cfw.' + this.type, this.enter.bind(this));
                        this.$element.on(eventOut + '.cfw.' + this.type, this.leave.bind(this));
                    } else {
                        this.$target.off('.cfw.' + this.type);
                        this.$target.on(eventIn + '.cfw.' + this.type, this.enter.bind(this));
                        this.$target.on(eventOut + '.cfw.' + this.type, this.leave.bind(this));
                    }
                }
            }

            if (this.$target) {
                // Key handling for closing
                this.$target.off('keydown.cfw.' + this.type + '.close')
                    .on('keydown.cfw.' + this.type + '.close', function(e) {
                        var KEYCODE_ESC = 27;
                        if (e.which === KEYCODE_ESC) { // if ESC is pressed
                            e.stopPropagation();
                            e.preventDefault();
                            // Click the close button if it exists otherwise force tooltip closed
                            if ($('.close', $selfRef.$target).length > 0) {
                                $('.close', $selfRef.$target).eq(0).trigger('click');
                            } else {
                                $selfRef.hide(true);
                            }
                        }
                    });

                // Bind 'close' buttons
                this.$target.off('click.dismiss.cfw.' + this.type, '[data-cfw-dismiss="' + this.type + '"]')
                    .on('click.dismiss.cfw.' + this.type, '[data-cfw-dismiss="' + this.type + '"]', function() {
                        $selfRef.follow = true;
                        $selfRef.hide();
                    });
            }
        },

        toggle : function(e) {
            if (e) {
                e.preventDefault();

                this.inState.click = !this.inState.click;
                this.follow = true;

                if (this._isInState()) {
                    this.enter();
                } else {
                    this.leave();
                }
            } else {
                // Disable delay when toggle programatically invoked
                var holdDelay = this.settings.delay;
                if (this.$target && this.$target.hasClass('in')) {
                    this.settings.delay.hide = 0;
                    this.leave();
                } else {
                    this.settings.delay.show = 0;
                    this.enter();
                }
                this.settings.delay = holdDelay;
            }
        },

        enter : function(e) {
            if (e) {
                this.inState[e.type === 'focusin' ? 'focus' : 'hover'] = true;
            }

            if ((this.$target && this.$target.hasClass('in')) || this.hoverState === 'in') {
                this.hoverState = 'in';
                return;
            }

            clearTimeout(this.delayTimer);

            this.hoverState = 'in';

            if (!this.settings.delay.show) {
                this.show();
                return;
            }

            var $selfRef = this;
            this.delayTimer = setTimeout(function() {
                if ($selfRef.hoverState === 'in') { $selfRef.show(); }
            }, this.settings.delay.show);
        },

        leave : function(e) {
            if (e) {
                this.inState[e.type === 'focusout' ? 'focus' : 'hover'] = false;
            }

            if (this._isInState()) { return; }

            clearTimeout(this.delayTimer);

            this.hoverState = 'out';
            if (!this.settings.delay.hide) {
                this.hide();
                return;
            }

            var $selfRef = this;
            this.delayTimer = setTimeout(function() {
                if ($selfRef.hoverState === 'out') { $selfRef.hide(); }
            }, this.settings.delay.hide);
        },

        show : function() {
            clearTimeout(this.delayTimer);
            var $selfRef = this;

            // Bail if transition in progress or already shown
            if (this.inTransition) { return; }
            if (this.$target && this.$target.hasClass('in')) { return; }

            if (!this.activate) {
                // Start show transition
                if (!this.$element.CFW_trigger('beforeShow.cfw.' + this.type)) {
                    return;
                }
            }

            this.inTransition = true;

            // Create/link the tooltip container
            if (!this.$target) {
                var target = this.createTip();
                if (target.length <= 0) { return; }
                this.dynamicTip = true;
                this.$target = target;
            }
            if (this.$target.length !== 1) {
                throw new Error(this.type + ' `template` option must consist of exactly 1 top-level element!');
            }
            this.$target.data('cfw.' + this.type, this);
            this.linkTip();
            this.bindTip(false);
            this.setContent();

            if (this.settings.animate) { this.$target.addClass('fade'); }

            this.locateTip();

            // Additional tab/focus handlers for non-inline items
            if (this.settings.container) {
                this.$target
                    .off('.cfw.' + this.type + '.keyflag')
                    .on('keydown.cfw.' + this.type + '.keyflag', function(e) {
                        $selfRef._tabSet(e);
                    })
                    .on('keyup.cfw.' + this.type + '.keyflag', function(e) {
                        var KEYCODE_TAB = 9;
                        if (e.which === KEYCODE_TAB) {
                            $selfRef._tabReset();
                        }
                    });

                // Inject focus helper item at start to fake loss of focus going out the top
                if (!this.$focusFirst) {
                    this.$focusFirst = $(document.createElement('span'))
                        .addClass(this.type + '-focusfirst')
                        .attr('tabindex', 0)
                        .prependTo(this.$target);
                }
                if (this.$focusFirst) {
                    this.$focusFirst
                        .off('focusin.cfw.' + this.type + '.focusFirst')
                        .on('focusin.cfw.' + this.type + '.focusFirst', function(e) {
                            e.stopPropagation();
                            e.preventDefault();
                            if ($selfRef.flags.keyTab) {
                                if ($selfRef.flags.keyShift) {
                                    // Go back to trigger element
                                    $selfRef.$element.trigger('focus');
                                } else {
                                    // Go to next tabbable item
                                    $selfRef._tabNext($selfRef.$focusFirst[0], $selfRef.$target);
                                }
                            }
                            $selfRef._tabReset();
                        });
                }

                // Inject focus helper item at end to fake loss of focus going out the bottom
                // Also helps if tip has last tabbable item in document - otherwise focus drops off page
                if (!this.$focusLast) {
                    this.$focusLast = $(document.createElement('span'))
                        .addClass(this.type + '-focuslast')
                        .attr('tabindex', 0)
                        .appendTo(this.$target);
                }
                if (this.$focusLast) {
                    this.$focusLast
                        .off('focusin.cfw.' + this.type + '.focusLast')
                        .on('focusin.cfw.' + this.type + '.focusLast', function(e) {
                            e.stopPropagation();
                            e.preventDefault();
                            if (!$selfRef.$target.is(e.relatedTarget) && !$selfRef.$target.has(e.relatedTarget).length) {
                                return;
                            }
                            $selfRef._tabNext($selfRef.$element[0]);
                        });
                }

                this.$element
                    .off('focusin.cfw.' + this.type + '.focusStart')
                    .on('focusin.cfw.' + this.type + '.focusStart', function(e) {
                        if ($selfRef.$target.hasClass('in')) {
                            if (!$selfRef.$target.is(e.relatedTarget) && !$selfRef.$target.has(e.relatedTarget).length) {
                                var selectables = $selfRef._tabItems();
                                var $prevNode = $(e.relatedTarget);

                                // Edge case: if coming from another tooltip/popover
                                if ($prevNode.closest('.tooltip, .popover').length) {
                                    $prevNode = null;
                                }

                                if ($prevNode && $prevNode.length) {
                                    var currIndex = selectables.index($selfRef.$element);
                                    var prevIndex = selectables.index($prevNode);
                                    if (currIndex < prevIndex) {
                                        $selfRef._tabPrev($selfRef.$focusLast[0], $selfRef.$target);
                                    }
                                }
                            }
                        }
                    })
                    .off('keydown.cfw.' + this.type + '.focusStart')
                    .on('keydown.cfw.' + this.type + '.focusStart', function(e) {
                        if ($selfRef.$target.hasClass('in')) {
                            $selfRef._tabSet(e);
                            if ($selfRef.flags.keyTab) {
                                if (!$selfRef.flags.keyShift) {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    $selfRef._tabNext($selfRef.$focusFirst[0], $selfRef.$target);
                                }
                            }
                            $selfRef._tabReset();
                        }
                    });
            }

            if ($.CFW_isTouch) {
                // Add empty function for mouseover listeners on immediate
                // children of `<body>` due to missing event delegation on iOS
                // Allows 'click' event to bubble up in Safari
                // https://www.quirksmode.org/blog/archives/2014/02/mouse_event_bub.html
                $('body').children().on('mouseover', null, $.noop);
            }

            this.$target.CFW_transition(null, this._showComplete.bind(this));
        },

        hide : function(force) {
            clearTimeout(this.delayTimer);

            // Handle delayed show and target not created
            if (!this.$target) { return; }

            if (typeof force === 'undefined') { force = false; }
            if (force) {
                this._hideComplete();
                return;
            }

            // Bail if transition in progress or already hidden
            if (this.inTransition || !this.$target.hasClass('in')) { return; }

            // Start hide transition
            if (!this.$element.CFW_trigger('beforeHide.cfw.' + this.type)) {
                return;
            }

            this.inTransition = true;
            this.$target
                .off('mutate.cfw.mutate')
                .removeAttr('data-cfw-mutate')
                .CFW_mutationIgnore()
                .removeClass('in');

            if ($.CFW_isTouch) {
                // Remove empty mouseover listener for iOS work-around
                $('body').children().off('mouseover', null, $.noop);
            }

            this.$target.CFW_transition(null, this._hideComplete.bind(this));

            this.hoverState = null;
        },

        unlink : function(force) {
            var $selfRef = this;
            if (typeof force === 'undefined') { force = false; }
            clearTimeout(this.delayTimer);

            this.$element.CFW_trigger('beforeUnlink.cfw.' + this.type);

            if (this.$target && this.$target.hasClass('in')) {
                this.$element.one('afterHide.cfw.' + this.type, function() {
                    $selfRef._unlinkComplete();
                });
                this.hide(force);
            } else {
                this._unlinkComplete();
            }
        },

        _unlinkComplete : function() {
            var $element = this.$element;
            var type = this.type;
            if (this.$target) {
                this.$target.off('.cfw.' + this.type)
                    .removeData('cfw.' + this.type);
            }
            this.$element.off('.cfw.' + this.type)
                .removeAttr('data-cfw')
                .removeData('cfw.' + this.type);

            this.$element = null;
            this.$target = null;
            this.$arrow = null;
            this.$focusFirst = null;
            this.$focusLast = null;
            this.instance = null;
            this.settings = null;
            this.type = null;
            this.isDialog = null;
            this.follow = null;
            this.eventTypes = null;
            this.delayTimer = null;
            this.inTransition = null;
            this.closeAdded = null;
            this.activate = null;
            this.hoverState = null;
            this.inState = null;
            this.dynamicTip = null;
            this.inserted = null;
            this.flags = null;
            if (this.popper) {
                this.popper.destroy();
            }
            this.popper = null;

            this._unlinkCompleteExt();

            $element.CFW_trigger('afterUnlink.cfw.' + type);
        },

        _unlinkCompleteExt : function() {
            // intentionally empty - unlink complete extend
        },

        dispose : function() {
            var $target = this.$target;

            $(document).one('afterUnlink.cfw.' + this.type, this.$element, function(e) {
                var $this = $(e.target);
                if ($target) {
                    $target.remove();
                }
                $this.CFW_trigger('dispose.cfw.' + this.type);
            });
            this.unlink();
        },

        _insertTip : function(placement) {
            if (this.inserted) { return; }

            var $tip = this.$target;
            $tip.detach();

            var shadowRoot = $().CFW_findShadowRoot(this.$element[0]);
            if (shadowRoot !== null && !this.settings.container) {
                this.settings.container = 'body';
            }

            if (typeof placement === 'object') {
                // Custom placement
                this.settings.container = 'body';
                $tip.appendTo(this.settings.container);
            }
            if (this.settings.container) {
                // Container placement
                $tip.appendTo(this.settings.container);
            } else {
                // Default placement
                $tip.insertAfter(this.$element);
            }

            this.inserted = true;
            this.$element.CFW_trigger('inserted.cfw.' + this.type);
        },

        locateUpdate : function() {
            if (this.popper !== null) {
                this.popper.scheduleUpdate();
            }
        },

        locateTip : function() {
            var placement = typeof this.settings.placement === 'function'
                ? this.settings.placement.call(this, this.$target[0], this.$element[0])
                : this.settings.placement;

            this._insertTip(placement);

            if (typeof placement === 'object') {
                // Custom placement
                this.$target.offset(placement);
                this.$target.addClass('in');
                return;
            }

            // Standard Placement
            var autoToken = /\s?auto?\s?/i;
            var autoFlip = autoToken.test(this.settings.placement);
            placement = this.settings.placement.replace(autoToken, '');
            // Allow for 'auto' placement
            if (!placement.trim().length) {
                placement = 'auto';
            }
            var attachment = this._getAttachment(placement);
            this._addAttachmentClass(attachment);

            this.$target.addClass('in');

            this.popper = new Popper(this.$element[0], this.$target[0], this._getPopperConfig(attachment, autoFlip));
        },

        _showComplete : function() {
            var $selfRef = this;
            var prevHoverState = this.hoverState;
            this.hoverState = null;

            // this.$target.addClass('in')
            this.$target
                .removeAttr('aria-hidden')
                .CFW_mutateTrigger();

            // Mutation handlers
            this.$target
                .attr('data-cfw-mutate', '')
                .CFW_mutationListen()
                .on('mutate.cfw.mutate', function() {
                    $selfRef.locateUpdate();
                });
            this.$element
                .attr('data-cfw-mutate', '')
                .CFW_mutationListen()
                .on('mutate.cfw.mutate', function() {
                    if ($(this).is(':hidden')) {
                        $selfRef.hide(true);
                    }
                });

            if (this.isDialog && this.follow) {
                this.$target.trigger('focus');
                this.follow = false;
            }

            this.inTransition = false;

            // Handle case of immediate dispose after show
            if ($selfRef.$element) {
                $selfRef.$element.attr('aria-describedby', $selfRef.targetID);
            }

            this._showExt();

            if (!this.activate) {
                this.$element.CFW_trigger('afterShow.cfw.' + this.type);
            }
            this.activate = false;

            if (prevHoverState === 'out') { this.leave(); }
        },

        _showExt : function() {
            // intentionally empty - show complete extend
        },

        _hideComplete : function() {
            this._cleanTipClass();
            this.$element
                .off('.cfw.' + this.type + '.focusStart')
                .off('mutate.cfw.mutate')
                .removeAttr('aria-describedby')
                .removeAttr('data-cfw-mutate')
                .CFW_mutationIgnore();
            this.$target
                .off('.cfw.' + this.type)
                .off('mutate.cfw.mutate')
                .removeClass('in')
                .attr('aria-hidden', true)
                .removeAttr('data-cfw-mutate')
                .CFW_mutationIgnore();
            if (this.$focusFirst) {
                this.$focusFirst.off('.cfw.' + this.type + '.focusFirst');
            }
            if (this.$focusLast) {
                this.$focusLast.off('.cfw.' + this.type + '.focusLast');
            }
            $(document).off('.cfw.' + this.type + '.' + this.instance);
            $(window).off('.cfw.' + this.type + '.' + this.instance);

            this.inState = {
                click: false,
                hover: false,
                focus: false
            };

            this.inTransition = false;
            if (this.isDialog) {
                this.$target.attr('tabindex', -1);
                if (this.follow) {
                    this.$element.trigger('focus');
                }
            }

            this.follow = false;

            // Only remove dynamically created tips
            if (this.hoverState !== 'in' && this.dynamicTip) {
                this._removeDynamicTip();
            }

            if (this.popper) {
                this.popper.destroy();
            }

            this._hideExt();

            this.$element.CFW_trigger('afterHide.cfw.' + this.type);
        },

        _hideExt : function() {
            // intentionally empty - hide complete extend
        },

        _removeDynamicTip : function() {
            this._removeDynamicTipExt();
            this.dynamicTip = false;
            this.inserted = false;
            this.closeAdded = false;
            this.$arrow = null;
            this.$focusFirst = null;
            this.$focusLast = null;
        },

        _removeDynamicTipExt : function() {
            // remove dynamic tip extend
            this.$target.remove();
            this.$target = null;
        },

        _cleanTipClass : function() {
            var regex = new RegExp('(^|\\s)cfw-' + this.type + '\\S+', 'g');
            if (this.$target) {
                var items = this.$target[0].className.match(regex);
                if (items !== null) {
                    for (var i = items.length; i--;) {
                        this.$target[0].classList.remove(items[i].trim());
                    }
                }
            }
        },

        _handlePopperPlacementChange : function(popperData) {
            this._cleanTipClass();
            this._addAttachmentClass(this._getAttachment(popperData.placement));
        },

        _addAttachmentClass : function(attachment) {
            if (this.$target) {
                this.$target.addClass('cfw-' + this.type + '-' + attachment);
            }
        },

        _isElement : function(node) {
            return (node[0] || node).nodeType;
        },

        _getViewport : function() {
            var viewport = this.settings.viewport;

            if (typeof viewport === 'function') {
                viewport = this.settings.viewport.call(this, this.$element);
            }

            var $viewportElm = $(viewport);

            if (this._isElement($viewportElm)) {
                viewport = $viewportElm[0];
            }

            return viewport;
        },

        _getAttachment : function(placement) {
            if (this.$element) {
                var directionVal = window.getComputedStyle(this.$element[0], null).getPropertyValue('direction').toLowerCase();
                var isRTL = Boolean(directionVal === 'rtl');
                var attachmentMap = {
                    AUTO: 'auto',
                    TOP: 'top',
                    FORWARD: isRTL ? 'left' : 'right',
                    RIGHT: 'right',
                    BOTTOM: 'bottom',
                    REVERSE: isRTL ? 'right' : 'left',
                    LEFT: 'left'
                };
                return attachmentMap[placement.toUpperCase()];
            }
            return CFW_Widget_Tooltip.DEFAULTS.placement;
        },

        _getPopperConfig : function(attachment, autoFlip) {
            var $selfRef = this;
            var defaultConfig = {
                placement: attachment,
                modifiers: {
                    flip: {
                        enabled: autoFlip,
                        behavior: 'flip'
                    },
                    arrow: {
                        element: '.' + this.type + '-arrow'
                    },
                    preventOverflow: {
                        padding: this.settings.padding,
                        boundariesElement: this._getViewport()
                    },
                    computeStyle : {
                        gpuAcceleration: this.settings.gpuAcceleration
                    }
                },
                onCreate: function(data) {
                    if (data.originalPlacement !== data.placement) {
                        $selfRef._handlePopperPlacementChange(data);
                    }
                },
                onUpdate: function(data) {
                    $selfRef._handlePopperPlacementChange(data);
                }
            };

            // Use deep merge
            var returnConfig = $.extend(true, defaultConfig, this.settings.popperConfig);
            return returnConfig;
        },

        _isInState : function() {
            for (var key in this.inState) {
                if (this.inState[key]) { return true; }
            }
            return false;
        },

        // Set flags for `tab` key interactions
        _tabSet : function(e) {
            var KEYCODE_TAB = 9;
            this._tabReset();
            if (e.which === KEYCODE_TAB) {
                this.flags.keyTab = true;
                if (e.shiftKey) { this.flags.keyShift = true; }
            }
        },

        // Reset flags for `tab` key interactions
        _tabReset : function() {
            this.flags = {
                keyShift: false,
                keyTab: false
            };
        },

        // Move focus to next tabbabale item before given element
        _tabPrev : function(current, $scope) {
            var $selfRef = this;
            var selectables = $selfRef._tabItems($scope);
            var prevIndex = selectables.length - 1;
            if ($(current).length === 1) {
                var currentIndex = selectables.index(current);
                if (currentIndex > 0) {
                    prevIndex = currentIndex - 1;
                }
            }
            selectables.eq(prevIndex).trigger('focus');
        },

        // Move focus to next tabbabale item after given element
        _tabNext : function(current, $scope) {
            var $selfRef = this;

            var selectables = $selfRef._tabItems($scope);
            var nextIndex = 0;
            if ($(current).length === 1) {
                var currentIndex = selectables.index(current);
                if (currentIndex + 1 < selectables.length) {
                    nextIndex = currentIndex + 1;
                }
            }
            selectables.eq(nextIndex).trigger('focus');
        },

        // Find the next tabbabale item after given element
        _tabFindNext : function(current, $scope) {
            var $selfRef = this;

            var selectables = $selfRef._tabItems($scope);
            var nextIndex = 0;
            if ($(current).length === 1) {
                var currentIndex = selectables.index(current);
                if (currentIndex + 1 < selectables.length) {
                    nextIndex = currentIndex + 1;
                }
            }
            return selectables.eq(nextIndex);
        },

        /*
         * jQuery UI Focusable 1.12.1
         * http://jqueryui.com
         *
         * Copyright jQuery Foundation and other contributors
         * Released under the MIT license.
         * http://jquery.org/license
         */
        _focusable : function(element, isTabIndexNotNaN) {
            var map;
            var mapName;
            var $img;
            var focusableIfVisible;
            var fieldset;
            var nodeName = element.nodeName.toLowerCase();

            if (nodeName === 'area') {
                map = element.parentNode;
                mapName = map.name;
                if (!element.href || !mapName || map.nodeName.toLowerCase() !== 'map') {
                    return false;
                }
                $img = $('img[usemap="#' + mapName + '"]');
                return $img.length > 0 && $img.is(':visible');
            }

            if (/^(input|select|textarea|button|object)$/.test(nodeName)) {
                focusableIfVisible = !element.disabled;

                if (focusableIfVisible) {
                    // Form controls within a disabled fieldset are disabled.
                    // However, controls within the fieldset's legend do not get disabled.
                    // Since controls generally aren't placed inside legends, we skip
                    // this portion of the check.
                    fieldset = $(element).closest('fieldset')[0];
                    if (fieldset) {
                        focusableIfVisible = !fieldset.disabled;
                    }
                }
            } else if (nodeName === 'a') {
                focusableIfVisible = element.href || isTabIndexNotNaN;
            } else {
                focusableIfVisible = isTabIndexNotNaN;
            }

            return focusableIfVisible && $(element).is(':visible');
        },

        _tabItems : function($node) {
            var $selfRef = this;
            if (typeof $node === 'undefined') { $node = $(document); }
            var items = $node.find('*').filter(function() {
                var tabIndex = $(this).attr('tabindex');
                var isTabIndexNaN = isNaN(tabIndex);
                return (isTabIndexNaN || tabIndex >= 0) && $selfRef._focusable(this, !isTabIndexNaN);
            });
            return items;
        }
    };

    var Plugin = function(option) {
        var args = [].splice.call(arguments, 1);
        return this.each(function() {
            var $this = $(this);
            var data = $this.data('cfw.tooltip');
            var options = typeof option === 'object' && option;

            if (!data && /unlink|dispose|hide/.test(option)) {
                return;
            }
            if (!data) {
                $this.data('cfw.tooltip', data = new CFW_Widget_Tooltip(this, options));
            }
            if (typeof option === 'string') {
                data[option].apply(data, args);
            }
        });
    };

    $.fn.CFW_Tooltip = Plugin;
    $.fn.CFW_Tooltip.Constructor = CFW_Widget_Tooltip;
}(jQuery));

/**
 * --------------------------------------------------------------------------
 * Figuration (v4.0.1): popover.js
 * Licensed under MIT (https://github.com/cast-org/figuration/blob/master/LICENSE)
 * --------------------------------------------------------------------------
 */

(function($) {
    'use strict';

    if (typeof $.fn.CFW_Tooltip === 'undefined') { throw new Error('CFW_Popover requires CFW_Tooltip'); }

    var CFW_Widget_Popover = function(element, options) {
        this.dragAdded = false;
        this.keyTimer = null;
        this.keyDelay = 750;

        this._init('popover', element, options);
    };

    CFW_Widget_Popover.DEFAULTS = $.extend({}, $.fn.CFW_Tooltip.Constructor.DEFAULTS, {
        placement   : 'top',        // Where to locate popover (top/bottom/reverse(left)/forward(right)/auto)
        trigger     : 'click',      // How popover is triggered (click/hover/focus/manual)
        content     : '',           // Content text/html to be inserted
        drag        : false,        // If the popover should be draggable
        dragtext    : '<span aria-hidden="true">+</span>', // Text for drag handle
        dragsrtext  : 'Drag',       // Screen reader text for drag handle
        dragstep     : 10,          // 'Drag' increment for keyboard
        template    : '<div class="popover"><h3 class="popover-header"></h3><div class="popover-body"></div><div class="popover-arrow"></div></div>'
    });

    CFW_Widget_Popover.prototype = $.extend({}, $.fn.CFW_Tooltip.Constructor.prototype);

    CFW_Widget_Popover.prototype.constructor = CFW_Widget_Popover;

    CFW_Widget_Popover.prototype.getDefaults = function() {
        return CFW_Widget_Popover.DEFAULTS;
    };

    CFW_Widget_Popover.prototype.createTip = function() {
        var $tip = $(this.settings.template);
        return $tip;
    };

    CFW_Widget_Popover.prototype.setContent = function() {
        var $tip = this.$target;
        var $title = $tip.find('.popover-header');
        var $content = $tip.find('.popover-body');

        if (this.dynamicTip) {
            var title = this.getTitle();
            var content = this.getContent();

            if (this.settings.html) {
                $title.html(title);
                if (typeof content === 'string') {
                    $content.html(content);
                } else {
                    $content.empty().append(content); // Use append for objects to keep js events
                }
            } else {
                $title.text(title);
                $content.text(content);
            }
        }

        // Use '.popover-header' for labelledby
        if ($title.length) {
            var labelledby = $title.eq(0).CFW_getID('cfw-popover');
            this.$target.attr('aria-labelledby', labelledby);
        }

        if (this.settings.drag && !this.dragAdded) {
            if (this.$target.find('[data-cfw-drag="' + this.type + '"]').length <= 0) {
                var $drag = $('<span role="button" tabindex="0" class="drag" data-cfw-drag="' + this.type + '" aria-label="' + this.settings.dragsrtext + '">' + this.settings.dragtext + '</span>');
                $drag.insertAfter(this.$target.find('.close').eq(0));
                this.dragAdded = true;
            }
        }

        if (this.$target.find('[data-cfw-drag="' + this.type + '"]').length) {
            this.$target.addClass('draggable');
            // Force settings
            if (this.settings.trigger !== 'manual') {
                this.settings.trigger = 'click';
            }
            this.settings.container = 'body';
            // Enable drag handlers
            this.enableDrag();
        }

        if (!$title.html()) { $title.hide(); }
    };

    CFW_Widget_Popover.prototype.getContent = function() {
        var content;
        var $e = this.$element;
        var s = this.settings;

        content = typeof s.content === 'function' ? s.content.call($e[0]) : s.content;

        return content;
    };

    CFW_Widget_Popover.prototype.enableDrag = function() {
        var $selfRef = this;
        var dragOpt = {
            handle: '[data-cfw-drag="' + this.type + '"]'
        };

        // Remove mutation handler and replace resize location handler
        this.$element.on('afterShow.cfw.' + this.type, function() {
            if ($selfRef.popper !== null) {
                $selfRef.popper.disableEventListeners();
            }

            $selfRef.$target
                .off('mutate.cfw.mutate')
                .removeAttr('data-cfw-mutate')
                .CFW_mutationIgnore();

            $(window)
                .off('resize.cfw.' + $selfRef.type + '.' + $selfRef.instance)
                .on('resize.cfw.' + $selfRef.type + '.' + $selfRef.instance, function() {
                    var offset = $selfRef.$target.offset();
                    if ($selfRef._isFixed()) {
                        var compStyle = window.getComputedStyle($selfRef.$target[0]);
                        offset.top = parseInt(compStyle.top, 10);
                        offset.left = parseInt(compStyle.left, 10);
                    }
                    $selfRef.locateDragTip(offset.top, offset.left);
                });
        });

        // Use top/left instead of transforms to position popover
        this.settings.gpuAcceleration = false;

        // Unset any previous drag events
        this.$target.off('.cfw.drag');

        this.$target
            .on('dragStart.cfw.drag', function() {
                $selfRef._updateZ();
                $selfRef.$element.CFW_trigger('dragStart.cfw.' + $selfRef.type);
            })
            .on('drag.cfw.drag', function(e) {
                $selfRef.locateDragTip(e.offsetY, e.offsetX);
            })
            .on('dragEnd.cfw.drag', function() {
                $selfRef.$element.CFW_trigger('dragEnd.cfw.' + $selfRef.type);
            })
            .on('keydown.cfw.drag', '[data-cfw-drag="' + this.type + '"]', function(e) {
                var KEYCODE_UP = 38;    // Arrow up
                var KEYCODE_RIGHT = 39; // Arrow right
                var KEYCODE_DOWN = 40;  // Arrow down
                var KEYCODE_LEFT = 37;  // Arrow left
                var REGEX_KEYS = new RegExp('^(' + KEYCODE_UP + '|' + KEYCODE_RIGHT + '|' + KEYCODE_DOWN + '|' + KEYCODE_LEFT + ')$');

                if (!REGEX_KEYS.test(e.which)) { return; }

                if (e) {
                    e.stopPropagation();
                    e.preventDefault();
                }

                if (!$selfRef.keyTimer) {
                    $selfRef.$element.CFW_trigger('dragStart.cfw.' + $selfRef.type);
                }

                clearTimeout($selfRef.keyTimer);

                // Mitigate most of 'slippage' by rounding offsets
                var nodeOffset = $selfRef.$target.offset();
                var offsetY = Math.round(nodeOffset.top);
                var offsetX = Math.round(nodeOffset.left);

                // If popover is 'fixed' position, use the current coords
                if ($selfRef._isFixed()) {
                    var compStyle = window.getComputedStyle($selfRef.$target[0]);
                    offsetY = parseInt(compStyle.top, 10);
                    offsetX = parseInt(compStyle.left, 10);
                }

                // Revise offset
                var step = $selfRef.settings.dragstep;
                switch (e.which) {
                    case KEYCODE_LEFT: { offsetX -= step; break; }
                    case KEYCODE_UP: { offsetY -= step; break; }
                    case KEYCODE_RIGHT: { offsetX += step; break; }
                    case KEYCODE_DOWN: { offsetY += step; break; }
                    default:
                }

                // Move it
                $selfRef.locateDragTip(offsetY, offsetX);

                $selfRef.keyTimer = setTimeout(function() {
                    $selfRef.$element.CFW_trigger('dragEnd.cfw.' + $selfRef.type);
                    $selfRef.keyTimer = null;
                }, $selfRef.keyDelay);
            });

        this.$target.CFW_Drag(dragOpt);
    };

    CFW_Widget_Popover.prototype.getParentNode = function(element) {
        if (element.nodeName === 'HTML') {
            return element;
        }
        return element.parentNode || element.host;
    };

    CFW_Widget_Popover.prototype.getScrollParent = function(element) {
        if (!element) { return document.body; }

        switch (element.nodeName) {
            case 'HTML':
            case 'BODY':
                return element.ownerDocument.body;
            case '#document':
                return element.body;
            default:
                // Nothing for default
        }

        var compStyle = window.getComputedStyle(element);
        if (/^(auto|scroll|overlay)$/.test(compStyle.overflow + compStyle.overflowX + compStyle.overflowY)) {
            return element;
        }

        return this.getScrollParent(this.getParentNode(element));
    };


    CFW_Widget_Popover.prototype.getOwnerBody = function(element) {
        var ownerDocument = element.ownerDocument;
        return ownerDocument ? ownerDocument.body : document.body;
    };

    CFW_Widget_Popover.prototype.viewportDragLimit = function() {
        var limit = {};
        var $viewport = this._getDragViewport();

        var scrollbarWidth = this.viewportScrollbarWidth($viewport);
        limit = $viewport.offset();

        // If popover is 'fixed' position
        if (this._isFixed()) {
            var rect = $viewport[0].getBoundingClientRect();
            limit.top = rect.top;
            limit.bottom = rect.bottom;

            // Use window and update limits if drag viewport is body
            if ($viewport.is('body')) {
                $viewport = $(window);
                limit.top = rect.top + window.pageYOffset;
                limit.left = rect.left + window.pageXOffset;
            }
        }

        limit.bottom = limit.top + $viewport.outerHeight();
        limit.right = limit.left + $viewport.outerWidth() - scrollbarWidth;

        // Allow dragging around entire window if body is smaller than window
        if ($viewport.is('body')) {
            if (document.body.clientHeight < window.innerHeight) {
                limit.bottom = window.innerHeight;
            }
            if (document.body.clientWidth < window.innerWidth) {
                limit.right = window.innerWidth - scrollbarWidth;
            }
        }
        return limit;
    };

    CFW_Widget_Popover.prototype.viewportScrollbarWidth = function($viewport) {
        // Check to see if a scrollbar is possible
        var compStyle = window.getComputedStyle($viewport[0]);
        var hasScrollY = /^(visible|auto|scroll)$/.test(compStyle.overflow) || /^(visible|auto|scroll)$/.test(compStyle.overflowY);
        var scrollHeight = $viewport[0].scrollHeight;

        // Return width of scrollbar if there seems to be one
        if ($viewport.is('body') && hasScrollY && scrollHeight > window.innerHeight) {
            return $.CFW_measureScrollbar();
        } else if (hasScrollY && scrollHeight > $viewport[0].clientHeight) {
            return $.CFW_measureScrollbar();
        }
        return 0;
    };

    CFW_Widget_Popover.prototype.locateDragTip = function(offsetY, offsetX) {
        var $tip = this.$target;
        var limit = this.viewportDragLimit();
        var viewportPadding = this.settings.padding;

        $tip.css({
            top: Math.min(limit.bottom - viewportPadding - $tip.outerHeight(), Math.max(limit.top + viewportPadding, offsetY)),
            left: Math.min(limit.right - viewportPadding - $tip.outerWidth(), Math.max(limit.left + viewportPadding, offsetX))
        });
    };

    CFW_Widget_Popover.prototype.hide = function(force) {
        // Fire key drag end if needed
        if (this.keyTimer) {
            this.$element.CFW_trigger('dragEnd.cfw.' + this.type);
            clearTimeout(this.keyTimer);
        }
        // Call tooltip hide
        $.fn.CFW_Tooltip.Constructor.prototype.hide.call(this, force);
    };

    CFW_Widget_Popover.prototype._showExt = function() {
        if (this.$target.find('[data-cfw-drag="' + this.type + '"]').length && this._isFixed()) {
            this._handleFixedDragScroll();
        }
    };

    CFW_Widget_Popover.prototype._hideExt = function() {
        $(window)
            .off('resize.cfw.' + this.type + '.' + this.instance)
            .off('scroll.cfw.' + this.type + '.' + this.instance);
    };

    CFW_Widget_Popover.prototype._removeDynamicTipExt = function() {
        this.$target.detach();
        this.$target = null;
        this.dragAdded = false;
    };

    CFW_Widget_Popover.prototype._updateZ = function() {
        // Find highest z-indexed visible popover
        var zMax = 0;
        var $zObj = null;
        $('.popover:visible').each(function() {
            var zCurr = parseInt($(this).css('z-index'), 10);
            if (zCurr > zMax) {
                zMax = zCurr;
                $zObj = $(this);
            }
        });
        // Only increase if highest is not current popover
        if (this.$target[0] !== $zObj[0]) {
            this.$target.css('z-index', ++zMax);
        }
    };

    CFW_Widget_Popover.prototype._arrow = function() {
        if (!this.$arrow) {
            this.$arrow = this.$target.find('.arrow, .popover-arrow');
        }
        return this.$arrow;
    };

    CFW_Widget_Popover.prototype._unlinkCompleteExt = function() {
        this.dragAdded = null;
        this.keyTimer = null;
        this.keyDelay = null;
    };

    CFW_Widget_Popover.prototype._getDragViewport = function() {
        var viewport = this._getViewport();
        var $viewport = null;

        if (viewport === 'scrollParent') {
            viewport = this.getScrollParent(this.$target[0]);
        }
        if (viewport === 'window' || viewport === window) {
            viewport = this.getOwnerBody(this.$target[0]);
        }

        $viewport = $(viewport);
        if (!$viewport.length) {
            $viewport = $(document.body);
        }

        return $viewport;
    };

    CFW_Widget_Popover.prototype._isFixed = function() {
        var compStyle = window.getComputedStyle(this.$target[0]);
        return /^(fixed)$/.test(compStyle.position);
    };

    CFW_Widget_Popover.prototype._doFixedDragScroll = function() {
        var offset = {};
        var compStyle = window.getComputedStyle(this.$target[0]);
        offset.top = parseInt(compStyle.top, 10);
        offset.left = parseInt(compStyle.left, 10);
        this.locateDragTip(offset.top, offset.left);
    };

    CFW_Widget_Popover.prototype._handleFixedDragScroll = function() {
        var $viewport = this._getDragViewport();

        $(window).off('scroll.cfw.' + this.type + '.' + this.instance);

        if (!$viewport.is('body')) {
            $(window).on('scroll.cfw.' + this.type + '.' + this.instance, this._doFixedDragScroll.bind(this));
        }
    };

    var Plugin = function(option) {
        var args = [].splice.call(arguments, 1);
        return this.each(function() {
            var $this = $(this);
            var data = $this.data('cfw.popover');
            var options = typeof option === 'object' && option;

            if (!data && /unlink|dispose|hide/.test(option)) {
                return;
            }
            if (!data) {
                $this.data('cfw.popover', data = new CFW_Widget_Popover(this, options));
            }
            if (typeof option === 'string') {
                data[option].apply(data, args);
            }
        });
    };

    $.fn.CFW_Popover = Plugin;
    $.fn.CFW_Popover.Constructor = CFW_Widget_Popover;
}(jQuery));

/**
 * --------------------------------------------------------------------------
 * Figuration (v4.0.1): modal.js
 * Licensed under MIT (https://github.com/cast-org/figuration/blob/master/LICENSE)
 * --------------------------------------------------------------------------
 */

(function($) {
    'use strict';

    var CFW_Widget_Modal = function(element, options) {
        this.$body = $(document.body);
        this.$element = $(element);
        this.$target = null;
        this.$dialog = null;
        this.$backdrop = null;
        this.$focusLast = null;
        this.isShown = null;
        this.scrollbarWidth = 0;
        this.scrollbarSide = 'right';
        this.fixedContent = '.fixed-top, .fixed-bottom, .is-fixed, .sticky-top';
        this.stickyContent = '.sticky-top';
        this.ignoreBackdropClick = false;

        var parsedData = this.$element.CFW_parseData('modal', CFW_Widget_Modal.DEFAULTS);
        this.settings = $.extend({}, CFW_Widget_Modal.DEFAULTS, parsedData, options);

        this._init();
    };

    CFW_Widget_Modal.DEFAULTS = {
        target       : false,   // Target selector
        animate      : true,    // If modal windows should animate
        unlink       : false,   // If on hide to remove events and attributes from modal and trigger
        dispose      : false,   // If on hide to unlink, then remove modal from DOM
        backdrop     : true,    // Show backdrop, or 'static' for no close on click
        keyboard     : true,    // Close modal on ESC press
        show         : false    // Show modal afer initialize
    };

    CFW_Widget_Modal.prototype = {

        _init : function() {
            var selector = this.$element.CFW_getSelectorFromChain('modal', this.settings.target);
            if (!selector) { return; }
            this.$target = $(selector);
            this.$dialog = this.$target.find('.modal-dialog');

            this.$element.attr('data-cfw', 'modal');

            // Check for presence of ids - set if not present
            // var triggerID = this.$element.CFW_getID('cfw-modal');
            var targetID = this.$target.CFW_getID('cfw-modal');

            // Set ARIA attributes on trigger
            this.$element.attr('aria-controls', targetID);

            // Use '.modal-title' for labelledby
            var $title = this.$target.find('.modal-title');
            if ($title.length) {
                var labelledby = $title.eq(0).CFW_getID('cfw-modal');
                this.$target.attr('aria-labelledby', labelledby);
            }

            // Set ARIA attributes on target
            this.$target.attr({
                'role': 'dialog',
                'aria-hidden': 'true',
                'tabindex': -1
            });

            // Bind click handler
            this.$element.on('click.cfw.modal', this.toggle.bind(this));

            this.$target.data('cfw.modal', this);

            this.$target.CFW_trigger('init.cfw.modal');

            if (this.settings.show) {
                this.show();
            }
        },

        toggle : function(e) {
            if (e) { e.preventDefault(); }
            if (this.isShown) {
                this.hide();
            } else {
                this.show();
            }
        },

        show : function() {
            var $selfRef = this;

            // Bail if already showing
            if (this.isShown) { return; }

            // Start open transition
            if (!this.$target.CFW_trigger('beforeShow.cfw.modal')) {
                return;
            }

            this.isShown = true;

            this.checkScrollbar();
            this.setScrollbar();
            this.$body.addClass('modal-open');

            this.escape();
            this.resize();

            this.$target
                .on('click.dismiss.cfw.modal', '[data-cfw-dismiss="modal"]', function(e) {
                    if (e) { e.preventDefault(); }
                    $selfRef.hide();
                })
                .data('cfw.modal', this);

            this.$dialog.on('mousedown.dismiss.cfw.modal', function() {
                $selfRef.$target.one('mouseup.dismiss.cfw.modal', function(e) {
                    if ($(e.target).is($selfRef.$target)) { $selfRef.ignoreBackdropClick = true; }
                });
            });

            this.backdrop(function() {
                $selfRef._showComplete();
            });
        },

        hide : function() {
            // Bail if not showing
            if (!this.isShown) { return; }

            // Start close transition
            if (!this.$target.CFW_trigger('beforeHide.cfw.modal')) {
                return;
            }

            this.isShown = false;

            $(document).off('focusin.cfw.modal');
            this.$target
                .removeClass('in')
                .attr('aria-hidden', true)
                .removeAttr('aria-modal')
                .off('.dismiss.cfw.modal');

            this.$dialog.off('mousedown.dismiss.cfw.modal');

            if (this.$focusLast) {
                this.$focusLast.off('.cfw.' + this.type + '.focusLast');
            }

            // Use modal dialog, not modal container, since
            // that is where the animation happens
            this.$dialog.CFW_transition(null, this._hideComplete.bind(this));
        },

        _showComplete : function() {
            var $selfRef = this;
            var $modalBody = this.$dialog.find('.modal-body');

            if (this.settings.animate) {
                this.$target.addClass('fade');
            }

            if (!this.$target.parent().length) {
                this.$target.appendTo(this.$body); // don't move modals dom position
            }

            this.$target.show();

            if ($modalBody.length) {
                $modalBody.scrollTop(0); // scrollable body variant
            }
            this.$dialog.scrollTop(0); // fullscreen variant
            this.$target.scrollTop(0);

            this.adjustDialog();

            $.CFW_reflow(this.$target[0]); // Force Reflow

            this.$target
                .addClass('in')
                .removeAttr('aria-hidden')
                .attr('aria-modal', true);

            // Mutation handler
            this.$target
                .attr('data-cfw-mutate', '')
                // If enabled will cause infinite loop of updates
                // .CFW_mutationListen()
                .on('mutate.cfw.mutate', function() {
                    $selfRef.handleUpdate();
                });

            this.enforceFocus();
            this.enforceFocusLast();

            var complete = function() {
                $selfRef.$target.trigger('focus');
                $selfRef.$target
                    .CFW_mutateTrigger()
                    .CFW_trigger('afterShow.cfw.modal');
            };

            // Use modal dialog, not modal container, since
            // that is where the animation happens
            this.$dialog.CFW_transition(null, complete);
        },

        _hideComplete : function() {
            var $selfRef = this;

            this.escape();
            this.resize();

            this.$target
                .off('mutate.cfw.mutate')
                .removeAttr('data-cfw-mutate')
                .CFW_mutationIgnore()
                .hide();
            this.backdrop(function() {
                $selfRef.$body.removeClass('modal-open');
                $selfRef.resetAdjustments();
                $selfRef.resetScrollbar();
                $selfRef.$target
                    .CFW_mutateTrigger()
                    .CFW_trigger('afterHide.cfw.modal');
            });
            this.$element.trigger('focus');
        },

        enforceFocus : function() {
            var $selfRef = this;
            $(document)
                .off('focusin.cfw.modal') // guard against infinite focus loop
                .on('focusin.cfw.modal', function(e) {
                    if (document !== e.target && $selfRef.$target[0] !== e.target && !$selfRef.$target.has(e.target).length) {
                        $selfRef.$target.trigger('focus');
                    }
                });
        },

        enforceFocusLast : function() {
            var $selfRef = this;
            // Inject an item to fake loss of focus in case the modal
            // is last tabbable item in document - otherwise focus drops off page
            if (!this.$focusLast) {
                this.$focusLast = $(document.createElement('span'))
                    .addClass('modal-focuslast')
                    .attr('tabindex', 0)
                    .appendTo(this.$target);
            }
            if (this.$focusLast) {
                this.$focusLast
                    .off('focusin.cfw.modal.focusLast')
                    .on('focusin.cfw.modal.focusLast', function() {
                        $selfRef.$target.trigger('focus');
                    });
            }
        },

        escape : function() {
            var $selfRef = this;
            var KEYCODE_ESC = 27;

            if (!this.isShown) {
                this.$target.off('keydown.dismiss.cfw.modal');
            }

            if (this.isShown) {
                this.$target.on('keydown.dismiss.cfw.modal', function(e) {
                    if (e.which === KEYCODE_ESC) {
                        if ($selfRef.settings.keyboard) {
                            e.preventDefault();
                            $selfRef.hide();
                        } else {
                            $selfRef.hideBlocked();
                        }
                    }
                });
            }
        },

        resize : function() {
            if (this.isShown) {
                $(window).on('resize.cfw.modal', this.handleUpdate.bind(this));
            } else {
                $(window).off('resize.cfw.modal');
            }
        },

        // these following methods are used to handle overflowing modals
        handleUpdate : function() {
            if (this.settings.backdrop) { this.adjustBackdrop(); }
            this.adjustDialog();
        },

        adjustBackdrop : function() {
            this.$backdrop
                .css('height', 0)
                .css('height', this.$target[0].scrollHeight);
        },

        adjustDialog : function() {
            var modalIsOverflowing = this.$target[0].scrollHeight > document.documentElement.clientHeight;

            this.$target.css({
                paddingLeft:  !this.bodyIsOverflowing && modalIsOverflowing ? this.scrollbarWidth : '',
                paddingRight: this.bodyIsOverflowing && !modalIsOverflowing ? this.scrollbarWidth : ''
            });
        },

        resetAdjustments : function() {
            this.$target.css({
                paddingLeft: '',
                paddingRight: ''
            });
        },

        checkScrollbar : function() {
            var rect = document.body.getBoundingClientRect();
            this.bodyIsOverflowing = Math.round(rect.left + rect.right) < window.innerWidth;
            this.scrollbarWidth = $.CFW_measureScrollbar();
            this.scrollbarSide =  $('html').CFW_getScrollbarSide();
        },

        setScrollbar : function() {
            var $selfRef = this;
            var sideName = this.scrollbarSide.capitalize();

            if (this.bodyIsOverflowing) {
                // Notes about below padding/margin calculations:
                // node.style.paddingRight returns: actual value or '' if not set
                // $(node).css('padding-right') returns: calculated value or 0 if not set

                // Update fixed element padding
                $(this.fixedContent).each(function() {
                    var $this = $(this);
                    var actualPadding = this.style['padding' + sideName];
                    var calculatedPadding = parseFloat($this.css('padding-' + $selfRef.scrollbarSide));
                    $this
                        .data('cfw.padding-dim', actualPadding)
                        .css('padding-' + $selfRef.scrollbarSide, calculatedPadding + $selfRef.scrollbarWidth + 'px');
                });

                // Update sticky element margin
                $(this.stickyContent).each(function() {
                    var $this = $(this);
                    var actualMargin = this.style['margin' + sideName];
                    var calculatedMargin = parseFloat($this.css('margin-' + $selfRef.scrollbarSide));
                    $this
                        .data('cfw.margin-dim', actualMargin)
                        .css('margin-' + $selfRef.scrollbarSide, calculatedMargin - $selfRef.scrollbarWidth + 'px');
                });

                // Update body padding
                var actualPadding = document.body.style['padding' + sideName];
                var calculatedPadding = parseFloat(this.$body.css('padding-' + $selfRef.scrollbarSide));
                this.$body
                    .data('cfw.padding-dim', actualPadding)
                    .css('padding-' + $selfRef.scrollbarSide, calculatedPadding + $selfRef.scrollbarWidth + 'px');
            }

            this.$target
                .on('touchmove.cfw.modal', this._scrollBlock.bind(this))
                .CFW_trigger('scrollbarSet.cfw.modal');
        },

        resetScrollbar : function() {
            var $selfRef = this;

            // Restore fixed element padding
            $(this.fixedContent).each(function() {
                var $this = $(this);
                var padding = $this.data('cfw.padding-dim');
                if (typeof padding !== 'undefined') {
                    $this.css('padding-' + $selfRef.scrollbarSide, padding);
                    $this.removeData('cfw.padding-dim');
                }
            });

            // Restore sticky element margin
            $(this.stickyContent).each(function() {
                var $this = $(this);
                var margin = $this.data('cfw.margin-dim');
                if (typeof margin !== 'undefined') {
                    $this.css('margin-' + $selfRef.scrollbarSide, margin);
                    $this.removeData('cfw.margin-dim');
                }
            });

            // Restore body padding
            var padding = this.$body.data('cfw.padding-dim');
            if (typeof padding !== 'undefined') {
                this.$body.css('padding-' + this.scrollbarSide, padding);
                this.$body.removeData('cfw.padding-dim');
            }

            this.$target
                .off('touchmove.cfw.modal')
                .CFW_trigger('scrollbarReset.cfw.modal');
        },

        _scrollBlock : function(e) {
            // Allow scrolling for scrollable modal body
            var $content = this.$target.find('.modal-dialog-scrollable');
            if ($content.length && ($content[0] === e.target || $content.find('.modal-body')[0].contains(e.target))) {
                e.stopPropagation();
                return;
            }

            var top = this.$target[0].scrollTop;
            var totalScroll = this.$target[0].scrollHeight;
            var currentScroll = top + this.$target[0].offsetHeight;

            if (top <= 0 && currentScroll >= totalScroll) {
                e.preventDefault();
            } else if (top === 0) {
                this.$target[0].scrollTop = 1;
            } else if (currentScroll === totalScroll) {
                this.$target[0].scrollTop = top - 1;
            }
        },

        backdrop : function(callback) {
            var $selfRef = this;

            var animate = this.settings.animate ? 'fade' : '';

            if (this.isShown && this.settings.backdrop) {
                this.$backdrop = $(document.createElement('div'))
                    .addClass('modal-backdrop ' + animate)
                    .appendTo(this.$body);

                this.$target.on('click.dismiss.cfw.modal', function(e) {
                    if ($selfRef.ignoreBackdropClick) {
                        $selfRef.ignoreBackdropClick = false;
                        return;
                    }
                    if (e.target !== e.currentTarget) { return; }
                    if ($selfRef.settings.backdrop === 'static') {
                        $selfRef.hideBlocked();
                    } else {
                        $selfRef.hide();
                    }
                });

                $.CFW_reflow(this.$backdrop[0]); // Force Reflow

                this.$backdrop.addClass('in');

                this.$backdrop.CFW_transition(null, callback);
            } else if (!this.isShown && this.$backdrop) {
                this.$backdrop.removeClass('in');

                var callbackRemove = function() {
                    $selfRef.removeBackdrop();
                    if (callback) { callback(); }
                };

                this.$backdrop.CFW_transition(null, callbackRemove);
            } else if (callback) {
                callback();
            }
        },

        removeBackdrop : function() {
            if (this.$backdrop) {
                this.$backdrop.remove();
                this.$backdrop = null;
            }
        },

        hideBlocked : function() {
            var $selfRef = this;
            if (!this.$target.CFW_trigger('beforeHide.cfw.modal')) {
                return;
            }

            var complete = function() {
                $selfRef.$target.trigger('focus');
                $selfRef.$target.removeClass('modal-blocked');
            };

            this.$target.addClass('modal-blocked');
            this.$dialog.CFW_transition(null, complete);
        },

        unlink : function() {
            var $selfRef = this;

            this.$target.CFW_trigger('beforeUnlink.cfw.modal');

            if (this.isShown) {
                this.$target.one('afterHide.cfw.modal', function() {
                    $selfRef._unlinkComplete();
                });
                this.hide();
            } else {
                this._unlinkComplete();
            }
        },

        _unlinkComplete : function() {
            var $target = this.$target;

            this.$target.off('.cfw.modal')
                .removeAttr('aria-labelledby')
                .removeData('cfw.modal');
            this.$element.off('.cfw.modal')
                .removeAttr('data-cfw aria-controls')
                .removeData('cfw.modal');

            this.$body = null;
            this.$element = null;
            this.$target = null;
            this.$dialog = null;
            this.$backdrop = null;
            this.$focusLast = null;
            this.isShown = null;
            this.scrollbarWidth = null;
            this.scrollbarSide = null;
            this.fixedContent = null;
            this.ignoreBackdropClick = null;
            this.settings = null;

            $target.CFW_trigger('afterUnlink.cfw.modal');
        },

        dispose : function() {
            $(document).one('afterUnlink.cfw.modal', this.$target, function(e) {
                var $this = $(e.target);
                $this.CFW_trigger('dispose.cfw.modal');
                $this.remove();
            });
            this.unlink();
        }
    };

    var Plugin = function(option) {
        var args = [].splice.call(arguments, 1);
        return this.each(function() {
            var $this = $(this);
            var data = $this.data('cfw.modal');
            var options = typeof option === 'object' && option;

            if (!data && /unlink|dispose/.test(option)) {
                return;
            }
            if (!data) {
                $this.data('cfw.modal', data = new CFW_Widget_Modal(this, options));
            }
            if (typeof option === 'string') {
                data[option].apply(data, args);
            }
        });
    };

    $.fn.CFW_Modal = Plugin;
    $.fn.CFW_Modal.Constructor = CFW_Widget_Modal;
}(jQuery));

/**
 * --------------------------------------------------------------------------
 * Figuration (v4.0.1): accordion.js
 * Licensed under MIT (https://github.com/cast-org/figuration/blob/master/LICENSE)
 * --------------------------------------------------------------------------
 */

(function($) {
    'use strict';

    if (typeof $.fn.CFW_Collapse === 'undefined') { throw new Error('CFW_Accordion requires CFW_Collapse'); }

    var CFW_Widget_Accordion = function(element) {
        this.$element = $(element);
        this._init();
    };

    CFW_Widget_Accordion.prototype = {
        _init : function() {
            var $selfRef = this;

            this.$element
                .attr('data-cfw', 'accordion')
                .on('beforeShow.cfw.collapse', function(e) {
                    if (e.isDefaultPrevented()) { return; }
                    $selfRef._update(e);
                })
                .CFW_trigger('init.cfw.accordion');
        },

        _update : function(e) {
            var inTransition = false;
            var $current = $(e.target);
            var $collapse = this.$element.find('[data-cfw="collapse"]');

            $collapse.each(function() {
                if ($(this).data('cfw.collapse').inTransition === 1) {
                    inTransition = true;
                }
            });

            if (inTransition) {
                e.preventDefault();
                return;
            }

            $collapse.not($current).CFW_Collapse('hide');
        },

        dispose : function() {
            this.$element
                .off('.cfw.collapse')
                .removeData('cfw.accordion');

            this.$element = null;
        }
    };

    var Plugin = function(option) {
        var args = [].splice.call(arguments, 1);
        return this.each(function() {
            var $this = $(this);
            var data = $this.data('cfw.accordion');
            if (!data) {
                $this.data('cfw.accordion', data = new CFW_Widget_Accordion(this));
            }
            if (typeof option === 'string') {
                data[option].apply(data, args);
            }
        });
    };

    $.fn.CFW_Accordion = Plugin;
    $.fn.CFW_Accordion.Constructor = CFW_Widget_Accordion;
}(jQuery));

/**
 * --------------------------------------------------------------------------
 * Figuration (v4.0.1): tab-responsive.js
 * Licensed under MIT (https://github.com/cast-org/figuration/blob/master/LICENSE)
 * --------------------------------------------------------------------------
 */

(function($) {
    'use strict';

    if (typeof $.fn.CFW_Tab === 'undefined') { throw new Error('CFW_TabResponsive requires CFW_Tab'); }
    if (typeof $.fn.CFW_Collapse === 'undefined') { throw new Error('CFW_TabResponsive requires CFW_Collapse'); }

    var CFW_Widget_TabResponsive = function(element) {
        this.$element = $(element);

        this._init();
    };

    CFW_Widget_TabResponsive.prototype = {
        _init : function() {
            var $selfRef = this;

            this.$element.attr('data-cfw', 'tabResponsive');

            // Set tab -> collapse
            this.$element.on('beforeShow.cfw.tab', function(e) {
                if (e.isDefaultPrevented()) { return; }
                $selfRef.updateCollapse(e.target);
            });

            // Set collapse -> tab
            this.$element.on('beforeShow.cfw.collapse', function(e) {
                if (e.isDefaultPrevented()) { return; }
                $selfRef.updateTab(e.target);
            });

            // Remove animations (needs to be revisited)
            this.$element.find('[data-cfw="tab"]').CFW_Tab('animDisable');
            this.$element.find('[data-cfw="collapse"]').CFW_Collapse('animDisable');

            var active = this.$element.find('[data-cfw="tab"].active');
            this.updateCollapse(active);

            this.$element.CFW_trigger('init.cfw.tabResponsive');
        },

        // Open the collapse element in the active panel
        // Closes all related collapse items first
        updateCollapse : function(node) {
            var $activeTab = $(node);
            var data = $($activeTab).data('cfw.tab');
            if (data) {
                var $activePane = data.$target;
                var $paneContainer = $activePane.closest('.tab-content');
                $paneContainer.find('[data-cfw="collapse"]').each(function() {
                    $(this)
                        .one('afterHide.cfw.collapse', function(e) {
                            e.stopPropagation();
                            e.preventDefault();
                        })
                        .CFW_Collapse('hide');
                });

                var $collapseItem = $activePane.find('[data-cfw="collapse"]');
                $collapseItem
                    .one('afterShow.cfw.collapse', function(e) {
                        e.stopPropagation();
                        e.preventDefault();
                    })
                    .CFW_Collapse('show');
            }
        },

        // Set parent panel to active when collapse called
        // Close all other collapse items
        updateTab : function(node) {
            var $activeCollapse = $(node);
            var $paneParent = $activeCollapse.closest('.tab-pane');
            var $paneID = $paneParent.attr('id');
            var $paneContainer = $activeCollapse.closest('.tab-content');

            $paneContainer.find('[data-cfw="collapse"]').each(function() {
                var $this = $(this);
                if ($this[0] === $activeCollapse[0]) {
                    return;
                }
                $this.CFW_Collapse('hide');
            });

            var $tabList = this.$element.find('[data-cfw="tab"]');
            $tabList.each(function() {
                var $this = $(this);
                var selector = $this.attr('data-cfw-tab-target');
                if (!selector) {
                    selector = $this.attr('href');
                }
                selector = selector.replace(/^#/, '');
                if (selector === $paneID) {
                    $this
                        .one('beforeShow.cfw.tab', function(e) {
                            e.stopPropagation();
                        })
                        .CFW_Tab('show');
                }
            });
        },

        dispose : function() {
            this.$element
                .off('.cfw.tab .cfw.collapse')
                .removeData('cfw.tabResponsive');

            this.$element = null;
            this.settings = null;
        }
    };

    var Plugin = function(option) {
        var args = [].splice.call(arguments, 1);
        return this.each(function() {
            var $this = $(this);
            var data = $this.data('cfw.tabResponsive');

            if (!data) {
                $this.data('cfw.tabResponsive', data = new CFW_Widget_TabResponsive(this));
            }
            if (typeof option === 'string') {
                data[option].apply(data, args);
            }
        });
    };

    $.fn.CFW_TabResponsive = Plugin;
    $.fn.CFW_TabResponsive.Constructor = CFW_Widget_TabResponsive;
}(jQuery));

/**
 * --------------------------------------------------------------------------
 * Figuration (v4.0.1): slideshow.js
 * Licensed under MIT (https://github.com/cast-org/figuration/blob/master/LICENSE)
 * --------------------------------------------------------------------------
 */

(function($) {
    'use strict';

    if (typeof $.fn.CFW_Tab === 'undefined') { throw new Error('CFW_Slideshow requires CFW_Tab'); }

    var CFW_Widget_Slideshow = function(element, options) {
        this.$element = $(element);
        this.$navPrev = this.$element.find('[data-cfw-slideshow-nav="prev"]');
        this.$navNext = this.$element.find('[data-cfw-slideshow-nav="next"]');

        var parsedData = this.$element.CFW_parseData('slideshow', CFW_Widget_Slideshow.DEFAULTS);
        this.settings = $.extend({}, CFW_Widget_Slideshow.DEFAULTS, parsedData, options);

        this._init();
    };

    CFW_Widget_Slideshow.DEFAULTS = {
        loop : false
    };

    CFW_Widget_Slideshow.prototype = {
        _init : function() {
            var $selfRef = this;

            this.$element.attr('data-cfw', 'slideshow');

            // All tabs - regardless of state
            var $tabs = this.$element.find('[role="tab"]');
            if (!$tabs.length) { return; }

            // Listen for tabs
            this.$element.on('afterShow.cfw.tab', function() {
                $selfRef.update();
            });

            // Bind nav
            this.$navPrev.on('click.cfw.slideshow', function(e) {
                e.preventDefault();
                if ($(e.target).not('.disabled, :disabled')) {
                    $selfRef.prev();
                }
            });
            this.$navNext.on('click.cfw.slideshow', function(e) {
                e.preventDefault();
                if ($(e.target).not('.disabled, :disabled')) {
                    $selfRef.next();
                }
            });

            // If loop, replace keydown handler
            if (this.settings.loop) {
                $tabs
                    .off('keydown.cfw.tab')
                    .add(this.$navPrev)
                    .add(this.$navNext)
                    .on('keydown.cfw.slideshow', function(e) {
                        $selfRef._actionsKeydown(e);
                    });
            }

            this.update();

            this.$element.CFW_trigger('init.cfw.slideshow');
        },

        prev : function() {
            var $tabs = this._getTabs();
            var currIndex = this._currIndex($tabs);
            if (currIndex > 0) {
                this.$element.CFW_trigger('prev.cfw.slideshow');
                $tabs.eq(currIndex - 1).CFW_Tab('show');
            }
            if (this.settings.loop && currIndex === 0) {
                this.$element.CFW_trigger('prev.cfw.slideshow');
                $tabs.eq($tabs.length - 1).CFW_Tab('show');
            }
        },

        next : function() {
            var $tabs = this._getTabs();
            var currIndex = this._currIndex($tabs);
            if (currIndex < $tabs.length - 1) {
                this.$element.CFW_trigger('next.cfw.slideshow');
                $tabs.eq(currIndex + 1).CFW_Tab('show');
            }
            if (this.settings.loop && currIndex === ($tabs.length - 1)) {
                this.$element.CFW_trigger('prev.cfw.slideshow');
                $tabs.eq(0).CFW_Tab('show');
            }
        },

        update : function() {
            this.$navPrev.removeClass('disabled');
            this.$navNext.removeClass('disabled');

            var $tabs = this._getTabs();
            var currIndex = this._currIndex($tabs);
            if (currIndex <= 0 && !this.settings.loop) {
                this.$navPrev.addClass('disabled');
            }
            if (currIndex >= $tabs.length - 1 && !this.settings.loop) {
                this.$navNext.addClass('disabled');
            }
            this.$element.CFW_trigger('update.cfw.slideshow');
        },

        _getTabs : function() {
            return this.$element.find('[role="tab"]:visible').not('.disabled');
        },

        _currIndex : function($tabs) {
            var $node = $tabs.filter('.active');
            return $tabs.index($node);
        },

        _actionsKeydown : function(e) {
            var KEYCODE_UP = 38;    // Arrow up
            var KEYCODE_RIGHT = 39; // Arrow right
            var KEYCODE_DOWN = 40;  // Arrow down
            var KEYCODE_LEFT = 37;  // Arrow left
            var REGEX_KEYS = new RegExp(KEYCODE_UP + '|' + KEYCODE_RIGHT + '|' + KEYCODE_DOWN + '|' + KEYCODE_LEFT);

            if (!REGEX_KEYS.test(e.which)) { return; }

            e.stopPropagation();
            e.preventDefault();

            var $tabs = this._getTabs();
            var index = this._currIndex($tabs);

            if (e.which === KEYCODE_UP || e.which === KEYCODE_LEFT) {
                if (index > 0) {
                    index--;
                } else if (index === 0) {
                    index = $tabs.length - 1;
                }
            }
            if (e.which === KEYCODE_DOWN || e.which === KEYCODE_RIGHT) {
                if (index < $tabs.length - 1) {
                    index++;
                } else if (index === $tabs.length - 1) {
                    index = 0;
                }
            }
            /* eslint-disable-next-line no-bitwise */
            if (!~index) { index = 0; }  // force first item

            var nextTab = $tabs.eq(index);
            nextTab.CFW_Tab('show').trigger('focus');
        },

        dispose : function() {
            if (this.settings.loop) {
                var $tabs = this.$element.find('[role="tab"]');
                $tabs.off('keydown.cfw.tab');
            }
            this.$navPrev.off('.cfw.slideshow');
            this.$navNext.off('.cfw.slideshow');
            this.$element
                .off('.cfw.tab')
                .removeData('cfw.slideshow');

            this.$element = null;
            this.$navPrev = null;
            this.$navNext = null;
            this.settings = null;
        }
    };

    var Plugin = function(option) {
        var args = [].splice.call(arguments, 1);
        return this.each(function() {
            var $this = $(this);
            var data = $this.data('cfw.Slideshow');
            var options = typeof option === 'object' && option;

            if (!data) {
                $this.data('cfw.Slideshow', data = new CFW_Widget_Slideshow(this, options));
            }
            if (typeof option === 'string') {
                data[option].apply(data, args);
            }
        });
    };

    $.fn.CFW_Slideshow = Plugin;
    $.fn.CFW_Slideshow.Constructor = CFW_Widget_Slideshow;
}(jQuery));

/**
 * --------------------------------------------------------------------------
 * Figuration (v4.0.1): scrollspy.js
 * Licensed under MIT (https://github.com/cast-org/figuration/blob/master/LICENSE)
 * --------------------------------------------------------------------------
 */

(function($) {
    'use strict';

    var CFW_Widget_Scrollspy = function(element, options) {
        this.$body = $('body');
        this.$element = $(element);
        this.$scrollElement = this.$element.is('body') ? $(window) : this.$element;
        this.selector = null;
        this.offsets = [];
        this.targets = [];
        this.activeTarget = null;
        this.scrollHeight = 0;

        var parsedData = this.$element.CFW_parseData('scrollspy', CFW_Widget_Scrollspy.DEFAULTS);
        this.settings = $.extend({}, CFW_Widget_Scrollspy.DEFAULTS, parsedData, options);

        this._init();
    };

    CFW_Widget_Scrollspy.DEFAULTS = {
        target: null,
        offset: 10,
        throttle: 100
    };

    CFW_Widget_Scrollspy.prototype = {
        _init : function() {
            this.$scrollElement.on('scroll.cfw.scrollspy', $.CFW_throttle(this.process.bind(this), this.settings.throttle));
            this.selector = (this.settings.target || '') + ' a, ' +
                            (this.settings.target || '') + ' [data-cfw-scrollspy-target]';
            this.$scrollElement.CFW_trigger('init.cfw.scrollspy');

            this.refresh();
            this.process();
        },

        getScrollHeight : function() {
            return this.$scrollElement[0].scrollHeight || Math.max(this.$body[0].scrollHeight, document.documentElement.scrollHeight);
        },

        refresh : function() {
            var $selfRef = this;
            var offsetMethod = 'offset';
            var offsetBase = 0;

            if (this.$scrollElement[0] !== null && this.$scrollElement[0] !== this.$scrollElement[0].window) {
                offsetMethod = 'position';
                offsetBase   = this.$scrollElement.scrollTop();
            }

            this.offsets = [];
            this.targets = [];
            this.scrollHeight = this.getScrollHeight();

            this.$body
                .find(this.selector)
                .map(function() {
                    var $el   = $(this);
                    var href  = $el.attr('data-cfw-scrollspy-target') || $el.attr('href');
                    var $href = /^#./.test(href) && $(href);

                    return ($href &&
                        $href.length &&
                        $href.is(':visible') &&
                        // && $el.is(':visible') &&
                        [[$href[offsetMethod]().top + offsetBase, href]]) || null;
                })
                .sort(function(a, b) { return a[0] - b[0]; })
                .each(function() {
                    $selfRef.offsets.push(this[0]);
                    $selfRef.targets.push(this[1]);
                });
        },

        process : function() {
            var scrollTop    = this.$scrollElement.scrollTop() + this.settings.offset;
            var scrollHeight = this.getScrollHeight();
            var maxScroll    = this.settings.offset + scrollHeight - this.$scrollElement.height();
            var offsets      = this.offsets;
            var targets      = this.targets;
            var activeTarget = this.activeTarget;
            var i;

            if (this.scrollHeight !== scrollHeight) {
                this.refresh();
            }

            if (scrollTop >= maxScroll) {
                var target = targets[targets.length - 1];

                if (activeTarget !== target) {
                    this.activate(target);
                }
                return;
            }

            if (activeTarget && scrollTop < offsets[0] && offsets[0] > 0) {
                this.activeTarget = null;
                this.clear();
                return;
            }

            for (i = offsets.length; i--;) {
                var isActiveTarget = activeTarget !== targets[i] &&
                    scrollTop >= offsets[i] &&
                    (typeof offsets[i + 1] === 'undefined' ||
                    scrollTop < offsets[i + 1]);

                if (isActiveTarget) {
                    this.activate(targets[i]);
                }
            }
        },

        activate : function(target) {
            this.activeTarget = target;

            this.clear();

            var selector = this.settings.target + ' [href="' + target + '"],' +
                           this.settings.target + ' [data-cfw-scrollspy-target="' + target + '"]';

            var $active = $(selector)
                .addClass('active');

            if ($active.closest('.dropdown-menu').length) {
                $active = $active
                    .closest('.dropdown')
                    .find('[data-cfw="dropdown"]')
                    .addClass('active');
            } else {
                // Set parents as active
                $active.parents('ul, ol, nav').prev('li, a').addClass('active');
            }

            $active.CFW_trigger('activate.cfw.scrollspy');
        },

        clear : function() {
            $(this.selector)
                .filter('.active')
                .removeClass('active');
        },

        dispose : function() {
            this.$scrollElement.off('.cfw.scrollspy');
            this.$element.removeData('cfw.scrollspy');

            this.$body = null;
            this.$element = null;
            this.$scrollElement = null;
            this.selector = null;
            this.offsets = null;
            this.targets = null;
            this.activeTarget = null;
            this.scrollHeight = null;
            this.settings = null;
        }
    };

    var Plugin = function(option) {
        var args = [].splice.call(arguments, 1);
        return this.each(function() {
            var $this = $(this);
            var data = $this.data('cfw.scrollspy');
            var options = typeof option === 'object' && option;

            if (!data) {
                $this.data('cfw.scrollspy', data = new CFW_Widget_Scrollspy(this, options));
            }
            if (typeof option === 'string') {
                data[option].apply(data, args);
            }
        });
    };

    $.fn.CFW_Scrollspy = Plugin;
    $.fn.CFW_Scrollspy.Constructor = CFW_Widget_Scrollspy;
}(jQuery));

/**
 * --------------------------------------------------------------------------
 * Figuration (v4.0.1): alert.js
 * Licensed under MIT (https://github.com/cast-org/figuration/blob/master/LICENSE)
 * --------------------------------------------------------------------------
 */

(function($) {
    'use strict';

    var dismiss = '[data-cfw-dismiss="alert"]';

    var CFW_Widget_Alert = function(element, options) {
        this.$element = $(element);
        this.$parent = null;
        this.inTransition = null;

        var parsedData = this.$element.CFW_parseData('alert', CFW_Widget_Alert.DEFAULTS);
        this.settings = $.extend({}, CFW_Widget_Alert.DEFAULTS, parsedData, options);

        this._init();
    };

    CFW_Widget_Alert.DEFAULTS = {
        target  : null,
        animate : true  // If alert targets should fade out
    };

    CFW_Widget_Alert.prototype = {

        _init : function() {
            var $selfRef = this;

            this.findParent();

            this.$element
                .data('cfw.alert', this)
                .on('click.cfw.alert', function(e) {
                    $selfRef.handleClose(e);
                });

            this.$parent
                .CFW_trigger('init.cfw.alert');
        },

        handleClose : function(e) {
            e.preventDefault();

            if (e.currentTarget === this.$parent[0]) {
                return;
            }

            if ($(e.currentTarget).not('.disabled, :disabled').length) {
                this.close();
            }
        },

        close : function(e) {
            var $selfRef = this;

            if (e) { e.preventDefault(); }

            if (this.inTransition) { return; }

            if (!this.$parent.CFW_trigger('beforeClose.cfw.alert')) {
                return;
            }

            if (this.settings.animate) {
                this.$parent.addClass('fade in');
            }

            this.inTransition = 1;

            var removeElement = function() {
                // Detach from parent, fire event then clean up data
                $selfRef.$parent
                    .detach()
                    .CFW_trigger('afterClose.cfw.alert');
                $selfRef.$parent.remove();
                $selfRef.inTransition = 0;
            };

            this.$parent
                .removeClass('in')
                .CFW_mutateTrigger()
                .CFW_transition(null, removeElement);
        },

        findParent : function() {
            var selector = this.$element.CFW_getSelectorFromChain('alert', this.settings.target);
            if (selector) {
                this.$parent = $(selector);
            } else {
                this.$parent = this.$element.closest('.alert');
            }
        },

        dispose : function() {
            this.$element
                .off('.cfw.alert')
                .removeData('cfw.alert');

            this.$element = null;
            this.$parent = null;
            this.inTransition = null;
            this.settings = null;
        }
    };

    var Plugin = function(option) {
        var args = [].splice.call(arguments, 1);
        return this.each(function() {
            var $this = $(this);
            var data = $this.data('cfw.alert');
            var options = typeof option === 'object' && option;

            if (!data) {
                $this.data('cfw.alert', data = new CFW_Widget_Alert(this, options));
            }
            if (typeof option === 'string') {
                data[option].apply(data, args);
            }
        });
    };

    $.fn.CFW_Alert = Plugin;
    $.fn.CFW_Alert.Constructor = CFW_Widget_Alert;

    // API
    // ===
    if (typeof CFW_API === 'undefined' || CFW_API !== false) {
        $(document).on('click.cfw.alert', dismiss, function(e) {
            $(this).CFW_Alert('handleClose', e);
        });
    }
}(jQuery));

/**
 * --------------------------------------------------------------------------
 * Figuration (v4.0.1): lazy.js
 * Licensed under MIT (https://github.com/cast-org/figuration/blob/master/LICENSE)
 * --------------------------------------------------------------------------
 */

(function($) {
    'use strict';

    var CFW_Widget_Lazy = function(element, options) {
        this.$element = $(element);
        this.$window = $(window);
        this.instance = null;
        this.inTransition = null;

        var parsedData = this.$element.CFW_parseData('lazy', CFW_Widget_Lazy.DEFAULTS);
        this.settings = $.extend({}, CFW_Widget_Lazy.DEFAULTS, parsedData, options);

        this._init();
    };

    CFW_Widget_Lazy.DEFAULTS = {
        src       : '',
        throttle  : 250,        // Throttle speed to limit event firing
        trigger   : 'scroll resize mutate',   // Events to trigger loading source
        delay     : 0,          // Delay before loading source
        animate   : false,      // Should the image fade in
        threshold : 0,          // Amount of pixels below viewport to triger show
        container : window,     // Where to watch for events
        invisible : false,      // Load sources that are not :visible
        placeholder: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    };

    CFW_Widget_Lazy.prototype = {

        _init : function() {
            var checkInitViewport = false;

            this.$element.attr('data-cfw', 'lazy');

            this.settings.delay = parseInt(this.settings.delay, 10);
            if (isNaN(this.settings.delay) || this.settings.delay < 0) {
                this.settings.delay = CFW_Widget_Lazy.DEFAULTS.delay;
            }

            // Add placholder if src is not defined
            if (this.$element.attr('src') === '' || typeof this.$element.attr('src') === 'undefined' || this.$element.attr('src') === false) {
                if (this.$element.is('img')) {
                    this.$element.attr('src', this.settings.placeholder);
                }
            }

            this.instance = this.$element.CFW_getID('cfw-lazy');

            // Bind events
            var eventTypes = this.settings.trigger.split(' ');
            for (var i = eventTypes.length; i--;) {
                var eventType = eventTypes[i];
                if (eventType === 'scroll' || eventType === 'resize') {
                    $(this.settings.container).on(eventType + '.cfw.lazy.' + this.instance, $.CFW_throttle(this._handleTrigger.bind(this), this.settings.throttle));
                    checkInitViewport = true;
                } else if (eventType === 'mutate') {
                    this.$element
                        .attr('data-cfw-mutate', '')
                        .on('mutate.cfw.mutate', this._handleTrigger.bind(this));
                } else {
                    this.$element.on(eventType + '.cfw.lazy', this.show.bind(this));
                }
            }

            this.$element.CFW_trigger('init.cfw.lazy');

            if (checkInitViewport && this.inViewport()) { this.show(); }
        },

        isVisible : function() {
            // Normalize on using the newer jQuery 3 visibility method
            var elem = this.$element[0];
            return Boolean(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
        },

        inViewport : function() {
            if (!this.settings.invisible && !this.isVisible) {
                return false;
            }
            return !this.belowFold() && !this.afterRight() && !this.aboveTop() && !this.beforeLeft();
        },

        belowFold : function() {
            var fold;
            if (this.settings.container === window) {
                fold = (window.innerHeight ? window.innerHeight : this.$window.height()) + this.$window.scrollTop();
            } else {
                fold = $(this.settings.container).offset().top + $(this.settings.container).height();
            }
            return fold <= this.$element.offset().top - this.settings.threshold;
        },

        afterRight : function() {
            var fold;
            if (this.settings.container === window) {
                fold = this.$window.width() + this.$window.scrollLeft();
            } else {
                fold = $(this.settings.container).offset().left + $(this.settings.container).width();
            }
            return fold <= this.$element.offset().left - this.settings.threshold;
        },

        aboveTop : function() {
            var fold;
            if (this.settings.container === window) {
                fold = this.$window.scrollTop();
            } else {
                fold = $(this.settings.container).offset().top;
            }
            return fold >= this.$element.offset().top + this.settings.threshold + this.$element.height();
        },

        beforeLeft: function() {
            var fold;
            if (this.settings.container === window) {
                fold = this.$window.scrollLeft();
            } else {
                fold = $(this.settings.container).offset().left;
            }
            return fold >= this.$element.offset().left + this.settings.threshold + this.$element.width();
        },

        loadSrc : function() {
            var $selfRef = this;

            this.$element.attr('src', this.settings.src);

            $.CFW_imageLoaded(this.$element, this.instance, function() {
                var complete = function() {
                    $selfRef.$element.removeClass('lazy in');
                    $selfRef.$element.CFW_trigger('afterShow.cfw.lazy');
                    $selfRef.dispose();
                };

                // Use slight delay when setting `.in` so animation occurs
                var DELAY_ANIMATION = 15;
                if ($selfRef.settings.animate) { $selfRef.$element.addClass('lazy'); }
                setTimeout(function() {
                    $selfRef.$element
                        .addClass('in')
                        .CFW_transition(null, complete);
                }, DELAY_ANIMATION);
            });
        },

        show : function() {
            var $selfRef = this;
            if (this.inTransition) { return; }

            if (!this.$element.CFW_trigger('beforeShow.cfw.lazy')) {
                return;
            }

            this.inTransition = true;

            setTimeout(function() {
                $selfRef.loadSrc();
            }, $selfRef.settings.delay);
        },

        _handleTrigger : function() {
            // Handle delayed event calls by checking for null
            if (this.$element !== null) {
                if (this.inViewport()) { this.show(); }
            }
        },

        dispose : function() {
            $(this.settings.container).off('.cfw.lazy.' + this.instance);
            this.$element
                .off('.cfw.lazy')
                .off('load.cfw.imageLoaded.' + this.instance)
                .off('.cfw.mutate')
                .removeData('cfw.lazy')
                .removeAttr('data-cfw')
                .removeAttr('data-cfw-mutate');

            this.$element = null;
            this.$window = null;
            this.instance = null;
            this.inTransition = null;
            this.settings = null;
        }
    };

    var Plugin = function(option) {
        var args = [].splice.call(arguments, 1);
        return this.each(function() {
            var $this = $(this);
            var data = $this.data('cfw.lazy');
            var options = typeof option === 'object' && option;

            if (!data) {
                $this.data('cfw.lazy', data = new CFW_Widget_Lazy(this, options));
            }
            if (typeof option === 'string') {
                data[option].apply(data, args);
            }
        });
    };

    $.fn.CFW_Lazy = Plugin;
    $.fn.CFW_Lazy.Constructor = CFW_Widget_Lazy;
}(jQuery));

/**
 * --------------------------------------------------------------------------
 * Figuration (v4.0.1): equalize.js
 * Licensed under MIT (https://github.com/cast-org/figuration/blob/master/LICENSE)
 * --------------------------------------------------------------------------
 */

(function($) {
    'use strict';

    var CFW_Widget_Equalize = function(element, options) {
        this.$element = $(element);
        this.$target = null;
        this.$window = $(window);
        this.instance = '';

        var parsedData = this.$element.CFW_parseData('equalize', CFW_Widget_Equalize.DEFAULTS);
        this.settings = $.extend({}, CFW_Widget_Equalize.DEFAULTS, parsedData, options);

        this._init();
    };

    CFW_Widget_Equalize.DEFAULTS = {
        target   : '',
        throttle : 250,     // Throttle speed to limit event firing
        stack    : false,   // Equalize items when stacked
        row      : false,   // Equalize items by row
        minimum  : false    // Use minimum height
    };

    CFW_Widget_Equalize.prototype = {
        _init : function() {
            var $selfRef = this;

            // Get group ID
            var groupID = this.settings.target;
            if (typeof groupID === 'undefined' || (groupID.length <= 0)) { return; }

            // Find target by id/css selector
            this.$target = $(groupID, this.$element);
            if (!this.$target.length) {
                // Get group items
                this.$target = $('[data-cfw-equalize-group="' + groupID + '"]', this.$element);
            }
            if (!this.$target.length) { return; }

            this.instance = $('<div/>').CFW_getID('cfw-equalize');

            if (this._hasNested()) {
                this.$element.on('afterEqual.cfw.equalize', function(e) {
                    if (e.target !== $selfRef.$element[0]) {
                        $selfRef._equalize();
                    }
                });
            }

            this.$target.CFW_mutationListen();
            this.$element
                .attr('data-cfw-mutate', '')
                .on('mutate.cfw.mutate', this._equalize.bind(this));

            this.$window.on('resize.cfw.equalize.' + this.instance, $.CFW_throttle(this._equalize.bind(this), this.settings.throttle));

            this.$element.attr('data-cfw', 'equalize');
            this.$element.CFW_trigger('init.cfw.equalize');
            this.update();
        },

        _hasNested : function() {
            return this.$element.find('[data-cfw="equalize"]').length > 0;
        },

        _isNested : function() {
            return this.$element.parentsUntil(document.body, '[data-cfw="equalize"]').length > 0;
        },

        _isStacked : function($targetElm) {
            if (!$targetElm[0] || !$targetElm[1]) {
                return false;
            }
            return $targetElm[0].getBoundingClientRect().top !== $targetElm[1].getBoundingClientRect().top;
        },

        _equalize : function() {
            var $targetElm = this.$target.filter(':visible');
            if (!$targetElm.length) { return; }

            if (!this.$element.CFW_trigger('beforeEqual.cfw.equalize')) {
                return;
            }

            this._equalizeGroup($targetElm);

            this.$element.CFW_trigger('afterEqual.cfw.equalize');
        },

        _equalizeGroup : function($targetElm) {
            $targetElm.height('');

            if (!this.settings.row && !this.settings.stack) {
                this._applyHeight($targetElm);
                return;
            }
            if (!this.settings.stack && this._isStacked($targetElm)) {
                return;
            }
            if (this.settings.row) {
                this._equalizeByRow($targetElm);
            } else {
                this._applyHeight($targetElm);
            }
        },

        _equalizeByRow : function($targetElm) {
            var $selfRef = this;
            var total = $targetElm.length;
            var topOffset = $targetElm.first().offset().top;
            var rowOffset = 0;
            var $rowElm = $();

            $targetElm.each(function(count) {
                var $node = $(this);

                rowOffset = $node.offset().top;
                if (rowOffset !== topOffset) {
                    // Update current row
                    if ($rowElm.length > 1) {
                        $selfRef._applyHeight($rowElm);
                    }
                    // Start new row and get revised offset
                    $rowElm = $();
                    topOffset = $node.offset().top;
                }

                // Continue on row
                $rowElm = $rowElm.add($node);

                // If last element - update remaining heights
                if (count === total - 1) {
                    $selfRef._applyHeight($rowElm);
                }
            });
        },

        _applyHeight : function($nodes, callback) {
            var heights = $nodes
                .map(function() {
                    return $(this).outerHeight(false);
                })
                .get();

            if (this.settings.minimum) {
                var min = Math.min.apply(null, heights);
                $nodes.css('height', min);
            } else {
                var max = Math.max.apply(null, heights);
                $nodes.css('height', max);
            }

            if (!callback) { return; }
            callback();
        },

        update : function() {
            var $selfRef = this;
            var $images = this.$element.find('img');
            if (!$images.length) {
                $images.each(function() {
                    $.CFW_imageLoaded($(this), $selfRef.instance, function() {
                        $selfRef._equalize();
                    });
                });
            }

            this._equalize();
        },

        dispose : function() {
            this.$window.off('.cfw.equalize.' + this.instance);
            this.$element
                .off('mutate.cfw.mutate')
                .removeAttr('data-cfw-mutate')
                .removeData('cfw.equalize')
                .find('img')
                .off('load.cfw.imageLoaded.' + this.instance);

            this.$target.CFW_mutationIgnore();

            this.$element = null;
            this.$target = null;
            this.$window = null;
            this.instance = null;
            this.settings = null;
        }
    };

    var Plugin = function(option) {
        var args = [].splice.call(arguments, 1);
        return this.each(function() {
            var $this = $(this);
            var data = $this.data('cfw.equalize');
            var options = typeof option === 'object' && option;

            if (!data) {
                $this.data('cfw.equalize', data = new CFW_Widget_Equalize(this, options));
            }
            if (typeof option === 'string') {
                data[option].apply(data, args);
            }
        });
    };

    $.fn.CFW_Equalize = Plugin;
    $.fn.CFW_Equalize.Constructor = CFW_Widget_Equalize;
}(jQuery));

/* eslint-disable no-magic-numbers */
/**
 * --------------------------------------------------------------------------
 * Figuration (v4.0.1): player.js
 * Licensed under MIT (https://github.com/cast-org/figuration/blob/master/LICENSE)
 * --------------------------------------------------------------------------
 */

(function($) {
    'use strict';

    // Borrowed on 12/05/2014 from: https://github.com/Modernizr/Modernizr/blob/master/feature-detects/audio.js
    var audioTest = function() {
        var elem = document.createElement('audio');
        var bool = false;

        /* eslint-disable no-cond-assign, no-implicit-coercion, no-new-wrappers */
        try {
            if (bool = !!elem.canPlayType) {
                bool      = new Boolean(bool);
                bool.ogg  = elem.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, '');
                bool.mp3  = elem.canPlayType('audio/mpeg;').replace(/^no$/, '');
                bool.opus = elem.canPlayType('audio/ogg; codecs="opus"') || elem.canPlayType('audio/webm; codecs="opus"').replace(/^no$/, '');

                // Mimetypes accepted:
                // http://developer.mozilla.org/En/Media_formats_supported_by_the_audio_and_video_elements
                // http://bit.ly/iphoneoscodecs
                bool.wav  = elem.canPlayType('audio/wav; codecs="1"').replace(/^no$/, '');
                bool.m4a  = (elem.canPlayType('audio/x-m4a;') || elem.canPlayType('audio/aac;')).replace(/^no$/, '');
            }
        } catch (e) {}
        /* eslint-enable no-cond-assign, no-implicit-coercion, no-new-wrappers */

        return bool;
    };

    // Borrowed on 12/05/2014 from: https://github.com/Modernizr/Modernizr/blob/master/feature-detects/video.js
    var videoTest = function() {
        var elem = document.createElement('video');
        var bool = false;

        /* eslint-disable no-cond-assign, no-implicit-coercion, no-new-wrappers */
        try {
            if (bool = !!elem.canPlayType) {
                bool = new Boolean(bool);
                bool.ogg = elem.canPlayType('video/ogg; codecs="theora"').replace(/^no$/, '');

                // Without QuickTime, this value will be `undefined`. github.com/Modernizr/Modernizr/issues/546
                bool.h264 = elem.canPlayType('video/mp4; codecs="avc1.42E01E"').replace(/^no$/, '');
                bool.webm = elem.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/^no$/, '');
                bool.vp9 = elem.canPlayType('video/webm; codecs="vp9"').replace(/^no$/, '');
                bool.hls = elem.canPlayType('application/x-mpegURL; codecs="avc1.42E01E"').replace(/^no$/, '');
            }
        } catch (e) {}
        /* eslint-enable no-cond-assign, no-implicit-coercion, no-new-wrappers */

        return bool;
    };

    var html5 = {
        audio: null,
        video: null
    };
    html5.audio = audioTest();
    html5.video = videoTest();

    var CFW_Widget_Player = function(element, options) {
        this.$element = $(element);
        this.type = 'audio';
        this.$media = null;
        this.media = null;
        this.$player = null;
        this.$focus = null;
        this.$sources = null;
        this.$sliderSeek = null;
        this.$volSeek = null;
        this.activity = null;
        this.over = null;
        this.userActive = true;
        this.activityTimer = null;
        this.mouseActivity = null;
        this.scrubPlay = null;
        this.played = false;

        this.status = {
            duration: 0,
            currentTime: 0,
            remaining: 0
        };
        this.support = {
            mute: true,
            volume: true
        };
        this.trackValid = [];
        this.trackCurrent = -1;
        this.$captionWrapper = null;

        // Transcript
        this.$scriptElm = null;
        this.scriptCurrent = -1;
        this.scriptCues = null;
        this.seekPoint = '.player-transcript-seekpoint, .player-description-seekpoint';

        // Description for transcript
        this.descCurrent = -1;
        this.descCues = null;

        // Text-based description for screen reader
        this.trackDescription = [];
        this.$textDescribeElm = null;
        this.textDescribeCurrent = -1;
        this.textDescribeCues = null;

        var parsedData = this.$element.CFW_parseData('player', CFW_Widget_Player.DEFAULTS);
        this.settings = $.extend({}, CFW_Widget_Player.DEFAULTS, parsedData, options);

        this._init();
    };

    CFW_Widget_Player.DEFAULTS = {
        mediaDescribe: false,        // Show description source media
        textDescribe: -1,            // Text-based description off
        textDescribeAnnounce: false, // If text-based description should announced by screen readers
        textDescribeVisible: true,   // If text-based description should be visible
        transcript: -1,              // Default transcript off
        transcriptScroll : true,     // Scroll transcript
        transcriptDescribe: true,    // Show descriptions in transcript
        transcriptOption : true      // Show transcript options
    };

    CFW_Widget_Player.prototype = {
        _init : function() {
            this.$media = this.$element.find('audio, video');
            this.media = this.$media[0];

            if (typeof this.media === 'undefined') {
                return;
            }

            if (this.media.nodeName.toLowerCase() === 'video') {
                this.type = 'video';
            }

            if ((this.type === 'audio' && !html5.audio) || (this.type === 'video' && !html5.video)) {
                this.$media.CFW_trigger('noSupport.cfw.player');
                return;
            }

            // Save source items for later use
            this.$sources = this.$media.find('source');
            if (!this.$sources.length) { return; }

            // Also set data attr for original source
            this.$sources.each(function() {
                $(this).attr('data-src-orig', $(this).attr('src'));
            });

            this.$element.attr('data-cfw', 'player')
                .addClass('player-unstarted');

            this.$player = this.$element.find('[data-cfw-player="player"]');
            if (this.$player.length > 0) {
                // Hide browsers default player
                this.media.controls = false;
            }

            // Swap to description media
            if (this.settings.mediaDescribe) {
                this.description();
            }

            // Check if loaded
            // this.loadCheck();
            this.loadComplete();
        },

        insertPlayer : function() {
            var $newPlayer = $(document.createElement('div'))
                .addClass('player');

            // Insert player
            this.$media.after($newPlayer);
        },

        loadCheck : function() {
            /* Need better method - do not use for now - assume media loads fine */

            var $selfRef = this;
            var timeout = 0;

            // Work around some players wehre track is not loaded until played
            try {
                this.media.play();
                this.media.pause();
            } catch (e) {
                this.error();
                return;
            }

            var isLoaded = setInterval(function() {
                var NETWORK_NO_SOURCE = 3;
                var TIMEOUT_MAX_COUNT = 75;
                if ($selfRef.media.readyState > 0) {
                    clearInterval(isLoaded);
                    $selfRef.loadComplete();
                    return;
                }
                if ($selfRef.media.networkState === NETWORK_NO_SOURCE || timeout === TIMEOUT_MAX_COUNT) {
                    clearInterval(isLoaded);
                    $selfRef.error();
                    return;
                }
                timeout++;
            }, 50);
        },

        loadComplete : function() {
            var $selfRef = this;

            // Attach event handlers
            this.$media.on('error', function() {
                $selfRef.error();
            });
            this.$media.on('play canplay pause', function() {
                $selfRef.controlStatus();
                $selfRef.playedStatus();
            });
            this.$media.on('loadedmetadata loadeddata progress canplay canplaythrough timeupdate durationchange', function() {
                $selfRef.playedStatus();
                $selfRef.timeStatus();
                $selfRef.seekStatus();
            });
            this.$media.on('ended', function() {
                $selfRef.seekReset();
            });
            this.$media.on('volumechange', function() {
                $selfRef.muteStatus();
                $selfRef.volumeStatus();
            });
            if (this.type === 'video') {
                // http://stackoverflow.com/questions/9621499/fullscreen-api-which-events-are-fired
                $(document).on('webkitfullscreenchange mozfullscreenchange MSFullscreenChange fullscreenchange', function() {
                    $selfRef.fullscreenStatus();
                });
                this.$player.on('mouseenter mouseleave', function(e) {
                    $selfRef.activity = true;
                    /* eslint-disable default-case */
                    switch (e.type) {
                        case 'mouseenter': {
                            $selfRef.over = true;
                            break;
                        }
                        case 'mouseleave': {
                            $selfRef.over = false;
                            break;
                        }
                    }
                    /* eslint-enable default-case */
                });
                this.$element.on('mousemove mousedown mouseup keydown keyup touchmove touchstart touchend', function(e) {
                    $selfRef.activity = true;
                    /* eslint-disable default-case */
                    switch (e.type) {
                        case 'mousedown':
                        case 'touchstart': {
                            clearInterval($selfRef.mouseActivity);
                            $selfRef.mouseActivity = setInterval(function() {
                                $selfRef.activity = true;
                            }, 250);
                            break;
                        }
                        case 'mouseup':
                        case 'touchend': {
                            clearInterval($selfRef.mouseActivity);
                            break;
                        }
                    }
                    /* eslint-enable default-case */
                });
                this.$media.on('click', function() {
                    $selfRef.toggle();
                    $selfRef._focusHelper();
                });
                this.activityInit();
            }

            // Link controls
            this.$player.on('click', '[data-cfw-player="play"]', function(e) {
                e.preventDefault();
                $selfRef.media.play();
                $selfRef._focusControl($selfRef.$player.find('[data-cfw-player="pause"]')[0]);
            });
            this.$player.on('click', '[data-cfw-player="pause"]', function(e) {
                e.preventDefault();
                $selfRef.media.pause();
                $selfRef._focusControl($selfRef.$player.find('[data-cfw-player="play"]')[0]);
            });
            this.$player.on('click', '[data-cfw-player="stop"]', function(e) {
                e.preventDefault();
                $selfRef.stop();
                $selfRef._focusControl(this);
            });
            this.$player.on('click', '[data-cfw-player="mute"]', function(e) {
                e.preventDefault();
                $selfRef.mute();
                $selfRef._focusControl(this);
            });
            this.$player.on('click', '[data-cfw-player="loop"]', function(e) {
                e.preventDefault();
                $selfRef.loop();
                $selfRef._focusControl(this);
            });
            this.$player.on('click', '[data-cfw-player="fullscreen"]', function(e) {
                e.preventDefault();
                $selfRef.fullscreen();
                $selfRef._focusControl(this);
            });
            this.$player.on('click', '[data-cfw-player="description"]', function(e) {
                e.preventDefault();
                $selfRef.description();
                $selfRef._focusControl(this);
            });

            // Key handler
            this.$element.on('keydown', function(e) {
                $selfRef._actionsKeydown(e);
            });

            // Update indicators
            this.controlStatus();
            this.volumeSupport();
            this.timeStatus();
            this.seekStatus();
            this.muteStatus();
            this.volumeStatus();
            this.loopStatus();


            // Check for caption container {
            var $captionWrapper =  this.$element.find('[data-cfw-player="caption-display"]');
            if ($captionWrapper.length) {
                this.$captionWrapper = $captionWrapper;
                // Hide wrapper to start
                this.captionDisplayUpdate(null);
            }

            this.trackList();
            this.trackInit();
            this.scriptInit();
            this.textDescriptionInit();

            this.$player.addClass('ready');

            // Inject focus helper item
            var focusDiv = document.createElement('div');
            focusDiv.className = 'player-focus sr-only';
            focusDiv.tabIndex = '-1';
            this.$focus = $(focusDiv);
            this.$element.prepend(this.$focus);

            this.$media.CFW_trigger('ready.cfw.player');

            // Handle element attributes
            if (this.media.autoplay) {
                this.media.play();
            }
        },

        error : function() {
            this.$media.CFW_trigger('error.cfw.player');
        },

        toggle : function() {
            if (this.media.paused) {
                this.playedStatus(true);
                this.media.play();
            } else {
                this.media.pause();
            }
        },

        play : function() {
            this.playedStatus(true);
            this.media.play();
        },

        pause : function() {
            this.media.pause();
        },

        stop : function() {
            this.media.pause();
            this.seekTo(0.0);
        },

        controlStatus : function() {
            var $ctlElm = this.$player.find('[data-cfw-player="control"]');
            var $playElm = this.$player.find('[data-cfw-player="play"]');
            var $pauseElm = this.$player.find('[data-cfw-player="pause"]');

            $ctlElm.removeClass('pause play');
            $playElm.add($pauseElm).removeClass('on off').addClass('off');

            if (this.media.paused) {
                // Paused/stopped
                $ctlElm.addClass('pause');
                $playElm.removeClass('off').addClass('on');
                this.$element.addClass('player-paused');
            } else {
                // Playing
                $ctlElm.addClass('play');
                $pauseElm.removeClass('off').addClass('on');
                this.$element.removeClass('player-paused');
            }
        },

        playedStatus : function(force) {
            if (typeof force === 'undefined') { force = false; }
            if (!this.played) {
                if (force || this.media.played.length > 0) {
                    this.played = true;
                    this.$element.removeClass('player-unstarted');
                }
            }
        },

        timeStatus : function() {
            this.status.duration    = this.media.duration;
            this.status.currentTime = this.media.currentTime;
            this.status.remaining   = this.status.duration - this.status.currentTime;
            if (this.status.remaining < 0) { this.status.remaining = 0; }

            var $durElm = this.$player.find('[data-cfw-player="time-duration"]');
            var $curElm = this.$player.find('[data-cfw-player="time-current"]');
            var $remElm = this.$player.find('[data-cfw-player="time-remainder"]');

            if (this.status.duration > 0) {
                this.$player.removeClass('player-notime');
            } else {
                this.$player.addClass('player-notime');
            }
            if (this.status.duration === Infinity) {
                this.$player.addClass('player-live');
            } else {
                this.$player.removeClass('player-live');
            }

            $durElm.html(this.timeSplit(this.status.duration));
            $curElm.html(this.timeSplit(this.status.currentTime));
            $remElm.html(this.timeSplit(this.status.remaining));
        },

        timeSplit : function(t) {
            if (isNaN(t) || t === Infinity) { t = 0; }

            var hours = Math.floor(t / 3600);
            var minutes = Math.floor(t / 60) - (hours * 60);
            var seconds = Math.floor(t) - (hours * 3600) - (minutes * 60);
            var timeStr = this.timeDigits(minutes) + ':' + this.timeDigits(seconds);
            if (hours > 0) {
                timeStr = hours + ':' + timeStr;
            }
            if (timeStr.indexOf('0') === 0) {
                timeStr = timeStr.substr(1);
            }
            return timeStr;
        },

        timeDigits : function(t) {
            return ('0' + t).slice(-2);
        },

        seekStatus : function() {
            var $seekElm = this.$player.find('[data-cfw-player="seek"]');

            if ($seekElm.find('input[type="range"]').length) {
                this.seekRange();
            } else if ($seekElm.hasClass('progress')) {
                this.seekProgress();
            }
        },

        seekRange : function() {
            var $selfRef = this;

            if (isNaN(this.media.duration) || this.media.duration === Infinity) { return; }
            var $seekElm = this.$player.find('[data-cfw-player="seek"]');
            var $inputElm = $seekElm.find('input[type="range"]').eq(0);

            if (this.$sliderSeek === null) {
                this.$sliderSeek = $inputElm;

                $inputElm.prop({
                    min: 0,
                    max: this.media.duration,
                    step: 1 // 1-second step
                });

                // Update on both `onchange` and `oninput` events. Seems to
                // help with jumping back to previous timestamp.
                $inputElm.on('change input', function() {
                    var newTime = parseFloat($inputElm.val());
                    // Pause/resume when changing
                    var isPaused = $selfRef.media.paused;
                    $selfRef.media.pause();
                    $selfRef.seekTo(newTime);
                    if (!isPaused) {
                        $selfRef.media.play();
                    }
                });

                // Allow keyboard to do the proper thing here
                $inputElm.on('keydown', function(e) {
                    if (e.type === 'keydown') { e.stopPropagation(); }
                    $(this).off('keyup.cfw.playerSeek');
                    $(this).one('keyup.cfw.playerSeek', function(e) {
                        if (e.type === 'keyup') { e.stopPropagation(); }
                    });
                });
            }

            $inputElm.val(this.media.currentTime);

            // Output a more meaningful description text
            var timeText = this.timeSplit(this.media.currentTime) + ' / ' + this.timeSplit(this.media.duration);
            $inputElm.attr('aria-valuetext', timeText);
        },

        seekProgress : function() {
            if (isNaN(this.media.duration) || this.media.duration === Infinity) { return; }

            var $curElm = this.$player.find('[data-cfw-player="seek-current"]');
            $curElm.attr('role', 'progressbar').attr('aria-label', 'Playback progress');

            var cp = (this.media.currentTime / this.media.duration) * 100;
            if (cp > 100) { cp = 100; }

            $curElm
                .attr({
                    'aria-valuemin' : 0,
                    'aria-valuemax' : 100,
                    'aria-valuenow' : cp
                })
                .css('width', cp + '%');
        },

        seekReset : function() {
            if (!this.media.loop) {
                this.media.pause();
            } else {
                this.media.play();
            }
        },

        seekIncrement : function(delta) {
            var time = this.media.currentTime + delta;
            if (time < 0) { time = 0; }
            if (time > this.media.duration) { time = this.media.duration; }
            this.seekTo(time);
        },

        seekTo : function(timestamp) {
            var seekable = this.media.seekable;
            if (seekable.length > 0 && timestamp >= seekable.start(0) && timestamp <= seekable.end(0)) {
                this.media.currentTime = timestamp;
            }
        },

        mute : function() {
            this.media.muted = !this.media.muted;
            this.muteStatus();
            this.volumeStatus();
        },

        muteStatus : function() {
            var $muteElm = this.$player.find('[data-cfw-player="mute"]');

            if (!this.support.mute) {
                this._controlDisable($muteElm);
            } else if (this.media.muted) {
                $muteElm.addClass('active');
            } else {
                $muteElm.removeClass('active');
            }
        },

        volumeSupport : function() {
            var muted = this.media.muted;
            var holdVol = this.media.volume;
            var testVol = 0.5;

            if (this.media.volume === 0.5) {
                testVol = 0.25;
            }
            this.media.volume = testVol;
            if (this.media.volume !== testVol) {
                this.support.mute = false;
                this.support.volume = false;
            }
            this.media.volume = holdVol;
            this.media.muted = muted;
        },

        volumeStatus : function() {
            var $volElm = this.$player.find('[data-cfw-player="volume"]');

            if ($volElm.find('input[type="range"]').length) {
                this.volumeRange();
            }
        },

        volumeRange : function() {
            var $selfRef = this;
            var $volElm = this.$player.find('[data-cfw-player="volume"]');

            if (!this.support.mute) {
                this._controlDisable($volElm);
                return;
            }
            var $inputElm = $volElm.find('input[type="range"]').eq(0);

            if (this.$volSeek === null) {
                this.$volSeek = $inputElm;
                $inputElm.prop({
                    min: 0,
                    max: 1,
                    step: 0.05  // 5% increment
                });

                // Update on both `onchange` and `oninput` events.
                $inputElm.on('change input', function() {
                    var newVol = parseFloat($inputElm.val());

                    if (newVol === 0) {
                        $selfRef.media.muted = true;
                    } else {
                        $selfRef.media.muted = false;
                        $selfRef.media.volume = newVol;
                    }
                });

                // Allow keyboard to do the proper thing here
                $inputElm.on('keydown', function(e) {
                    if (e.type === 'keydown') { e.stopPropagation(); }
                    $(this).off('keyup.cfw.playerSeek');
                    $(this).one('keyup.cfw.playerSeek', function(e) {
                        if (e.type === 'keyup') { e.stopPropagation(); }
                    });
                });
            }

            // Update range value and output text to percentage
            if (!this.media.muted) {
                $inputElm.val(this.media.volume);
                var level = parseInt(this.media.volume * 100, 10);
                $inputElm.attr('aria-valuetext', level + '%');
            } else {
                $inputElm.val(0);
                $inputElm.attr('aria-valuetext', '0%');
            }
        },

        volumeIncrement : function(delta) {
            var vol = (this.media.volume * 100) + delta;
            if (vol < 0) { vol = 0; }
            if (vol > 100) { vol = 100; }
            this.media.volume = parseInt(vol, 10) / 100;
        },

        loop : function(setting) {
            if (typeof setting !== 'undefined') {
                // set on/off
                this.media.loop = setting;
            } else {
                // toggle
                this.media.loop = !this.media.loop;
            }
            this.loopStatus();
        },

        speed : function(setting) {
            if (typeof setting !== 'undefined') {
                this.media.playbackRate = setting;
            }
        },

        loopStatus : function() {
            var $loopElm = this.$player.find('[data-cfw-player="loop"]');
            if (this.media.loop) {
                $loopElm.addClass('active');
                this._pressedState($loopElm, true);
            } else {
                $loopElm.removeClass('active');
                this._pressedState($loopElm, false);
            }
        },

        // Fullscreen concepts from:
        // https://github.com/iandevlin/iandevlin.github.io/blob/master/mdn/video-player-with-captions/js/video-player.js
        isFullScreen : function() {
            // Checks if the player instance is currently in fullscreen mode
            var $fsNode = $(document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
            return $fsNode.is(this.$element);
        },

        fullscreen : function() {
            if (this.type === 'audio') { return; }
            if (this.isFullScreen()) {
                // Exit fullscreen
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.webkitCancelFullScreen) {
                    document.webkitCancelFullScreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
            } else {
                // Go fullscreen
                // (Note: can be called on document, but here the specific element is used as it will also ensure that the element's children, e.g. the custom controls, go fullscreen also)
                var videoContainer = this.$element[0];
                if (videoContainer.requestFullscreen) {
                    videoContainer.requestFullscreen();
                } else if (videoContainer.mozRequestFullScreen) {
                    videoContainer.mozRequestFullScreen();
                } else if (videoContainer.webkitRequestFullScreen) {
                    videoContainer.webkitRequestFullScreen();
                } else if (videoContainer.msRequestFullscreen) {
                    videoContainer.msRequestFullscreen();
                }
            }
        },

        fullscreenStatus : function() {
            var $fullElm = this.$player.find('[data-cfw-player="fullscreen"]');
            if (this.isFullScreen()) {
                $fullElm.addClass('active');
                this.$element.addClass('player-fulldisplay');
                this.$media.CFW_trigger('enterFullscreen.cfw.player');
            } else {
                $fullElm.removeClass('active');
                this.$element.removeClass('player-fulldisplay');
                this.$media.CFW_trigger('exitFullscreen.cfw.player');
            }
        },

        _srcHasAlternate : function(name) {
            return this.$sources[0].hasAttribute('data-src-' + name);
        },

        _srcIsAlternate : function(name) {
            return this.$sources.first().attr('data-src-' + name) === this.$sources.first().attr('src');
        },

        _srcLoadAlternate : function(name) {
            var $selfRef = this;
            var currTime = this.media.currentTime;
            var isPaused = this.media.paused;

            this.$sources.each(function() {
                $(this).attr('src', $(this).attr('data-src-' + name));
            });

            // Reload the source, skip ahead, and resume playing
            this.$media
                .one('loadeddata', function() {
                    $selfRef.seekTo(currTime);
                    if (!isPaused) { $selfRef.media.play(); }
                });
            this.media.load();
        },

        description : function() {
            if (this._srcHasAlternate('describe')) {
                var $descElm = this.$player.find('[data-cfw-player="description"]');

                if (this._srcIsAlternate('describe')) {
                    // Reset to original source
                    this._srcLoadAlternate('orig');
                    $descElm.removeClass('active');
                } else {
                    // Load description source
                    this._srcLoadAlternate('describe');
                    $descElm.addClass('active');
                }
            }
        },

        trackList : function() {
            var $selfRef = this;

            var tracks = this.media.textTracks;
            if (tracks.length <= 0) {
                return;
            }

            var validTracks = [];
            var descTracks = [];
            for (var i = 0; i < tracks.length; i++) {
                if (tracks[i].kind === 'captions' || tracks[i].kind === 'subtitles') {
                    validTracks.push(i);
                }
                if (tracks[i].kind === 'descriptions') {
                    descTracks.push(i);
                }
            }
            this.trackValid = validTracks;
            this.trackDescription = descTracks;

            /* not fully supported by any browser?
                 - only fires once for some reason from browser default controls
            */
            this.media.textTracks.addEventListener('change', function() {
                $selfRef.trackStatus();
            });
        },

        trackInit : function() {
            var $selfRef = this;
            var $captionElm = this.$player.find('[data-cfw-player="caption"]');
            if ($captionElm.length <= 0) {
                return;
            }

            if (this.trackValid.length <= 0) {
                this._controlDisable($captionElm);
                return;
            }

            if (this.trackValid.length === 1) {
                // Use toggle style
                this.$player.on('click', '[data-cfw-player="caption"]', function(e) {
                    e.preventDefault();
                    if ($captionElm.hasClass('active')) {
                        $selfRef.trackSet(-1);
                    } else {
                        $selfRef.trackSet(0);
                    }
                    $selfRef._focusControl(this);
                });

                if (this.media.textTracks[0].mode === 'showing') {
                    this.trackSet(0);
                }
            } else {
                // Build menu
                var wrapper = '<span class="player-caption-wrapper"></span>';
                var $menu = $('<ul class="player-caption-menu dropdown-menu"></ul>');
                $captionElm.wrap(wrapper);

                var $wrapper = $captionElm.parent(); /* Because $().wrap() clones element */

                $wrapper.append($menu);
                var menuID = $menu.CFW_getID('cfw-player');

                var $menuItem = $('<li class="player-caption-off"><button type="button" class="dropdown-item" data-cfw-player-track="-1">Off</button></li>');
                $menu.append($menuItem);

                var tracks = this.media.textTracks;

                for (var j = 0; j < tracks.length; j++) {
                    if (tracks[j].mode === 'showing') {
                        this.trackSet(j);
                    }
                }

                for (var i = 0; i < this.trackValid.length; i++) {
                    var trackID = this.trackValid[i];
                    $menuItem = $('<li><button type="button" class="dropdown-item" data-cfw-player-track="' + trackID + '">' + tracks[trackID].label + '</button></li>');
                    $menu.append($menuItem);
                }

                this.$player.on('click', '[data-cfw-player-track]', function(e) {
                    e.preventDefault();
                    var $this = $(this);
                    var num = $this.attr('data-cfw-player-track');
                    $selfRef.trackSet(num);
                });

                $captionElm.CFW_Dropdown({
                    target: '#' + menuID
                });
            }

            this.trackStatus();
        },

        trackSet : function(trackID) {
            trackID = parseInt(trackID, 10);

            var tracks = this.media.textTracks;
            if (tracks.length <= 0) {
                return;
            }

            // Disable any previous cuechange handling
            if (this.trackCurrent !== -1) {
                this._cuechangeDisable(this.trackCurrent, 'captionDisplay');
            }

            this.trackCurrent = trackID;

            for (var i = 0; i < tracks.length; i++) {
                if (tracks[i].mode === 'showing') {
                    tracks[i].mode = 'hidden';
                }
                if (i === trackID) {
                    // tracks[i].mode = 'showing';
                    tracks[i].mode = this.$captionWrapper !== null ? 'hidden' : 'showing';
                }
            }

            // Hook in cuechange handler if using custom captions
            if (this.trackCurrent !== -1 && this.$captionWrapper !== null) {
                this._cuechangeEnable(this.trackCurrent, 'captionDisplay', this.captionDisplayUpdate);
            }

            this.trackStatus();
        },

        trackStatus : function() {
            var tracks = this.media.textTracks;
            if (tracks.length <= 0) {
                return;
            }

            var $captionElm = this.$player.find('[data-cfw-player="caption"]');
            if ($captionElm.length <= 0) {
                return;
            }

            if (this.trackValid.length === 1) {
                // Toggle style
                if (this.trackCurrent === -1) {
                    $captionElm.removeClass('active');
                    this._pressedState($captionElm, false);
                } else {
                    $captionElm.addClass('active');
                    this._pressedState($captionElm, true);
                }
            } else {
                // Menu style
                var $captionPar = $captionElm.parent();
                $captionElm.removeClass('active');
                $captionPar.removeClass('active');
                $captionPar.find('[data-cfw-player-track]')
                    .removeClass('active')
                    .removeAttr('aria-pressed');

                for (var i = 0; i < tracks.length; i++) {
                    if (i === this.trackCurrent) {
                        $captionElm.addClass('active');
                        $captionPar.addClass('active');
                        $captionPar.find('[data-cfw-player-track="' + i + '"]')
                            .addClass('active')
                            .attr('aria-pressed', 'true');
                    }
                }
            }
        },

        scriptInit : function() {
            var $selfRef = this;
            var $tsElm = this.$player.find('[data-cfw-player="transcript"]');
            if ($tsElm.length <= 0) {
                return;
            }

            if (this.trackValid.length <= 0) {
                this._controlDisable($tsElm);
                return;
            }

            if (this.trackValid.length === 1 && !this.settings.transcriptOption) {
                // Use toggle style
                $tsElm.removeClass('active');
                this._pressedState($tsElm, false);
                $tsElm.on('click', function(e) {
                    e.preventDefault();
                    if ($tsElm.hasClass('active')) {
                        $selfRef.scriptSet(-1);
                    } else {
                        $selfRef.scriptSet(0);
                    }
                    $selfRef._focusControl(this);
                });
            } else {
                // Build menu
                var wrapper = '<span class="player-script-wrapper"></span>';
                var $menu = $('<ul class="player-script-menu dropdown-menu"></ul>');
                $tsElm.wrap(wrapper);

                var $wrapper = $tsElm.parent(); /* Because $().wrap() clones element */

                $wrapper.append($menu);
                var menuID = $menu.CFW_getID('cfw-player');

                var $menuItem = $('<li class="player-script-off"><button type="button" class="dropdown-item" data-cfw-player-script="-1">Off</button></li>');
                $menu.append($menuItem);

                var tracks = this.media.textTracks;
                for (var i = 0; i < this.trackValid.length; i++) {
                    var trackID = this.trackValid[i];
                    $menuItem = $('<li><button type="button" class="dropdown-item" data-cfw-player-script="' + trackID + '">' + tracks[trackID].label + '</a></li>');
                    $menu.append($menuItem);
                }
                if (this.settings.transcriptOption) {
                    $menuItem = $('<li class="dropdown-divider"></li>');
                    $menu.append($menuItem);
                    // Add scroll toggle
                    var scrollCheck = this.settings.transcriptScroll ? 'checked' : '';
                    var scrollID = 'transcriptScroll-' + menuID;
                    $menuItem = $('<li class="dropdown-text"><div class="form-check"><input type="checkbox" data-cfw-player-script-scroll class="form-check-input" ' + scrollCheck + ' id="' + scrollID + '"> <label class="form-check-label" for="' + scrollID + '">Auto-scroll</label></div></li>');
                    $menu.append($menuItem);
                    // Add description toggle
                    var descCheck = this.settings.transcriptDescribe ? 'checked' : '';
                    var descID = 'transcriptDescribe-' + menuID;
                    $menuItem = $('<li class="dropdown-text"><div class="form-check"><input type="checkbox" data-cfw-player-script-describe class="form-check-input" ' + descCheck + ' id="' + descID + '"> <label class="form-check-label" for="' + descID + '">Show Description</label></div></li>');
                    $menu.append($menuItem);
                }

                // Event handlers
                this.$player.on('click', '[data-cfw-player-script]', function(e) {
                    e.preventDefault();
                    var $this = $(this);
                    var num = $this.attr('data-cfw-player-script');
                    $selfRef.scriptSet(num);
                });
                if (this.settings.transcriptOption) {
                    this.$player.on('click', '[data-cfw-player-script-scroll]', function() {
                        $selfRef.settings.transcriptScroll = !$selfRef.settings.transcriptScroll;
                        $(this).prop('checked', $selfRef.settings.transcriptScroll);
                    });
                    this.$player.on('click', '[data-cfw-player-script-describe]', function(e) {
                        if (!$selfRef._controlIsDisabled($(e.target))) {
                            $selfRef.settings.transcriptDescribe = !$selfRef.settings.transcriptDescribe;
                            $(this).prop('checked', $selfRef.settings.transcriptDescribe);
                            $selfRef.scriptLoad();
                        }
                    });
                }

                $tsElm.CFW_Dropdown({
                    target: '#' + menuID
                });
            }

            // Show transcript if set
            if (this.settings.transcript !== -1) {
                this.scriptSet(this.settings.transcript);
            }
        },

        scriptSet : function(trackID) {
            trackID = parseInt(trackID, 10);

            if (this.trackValid.length <= 0) {
                return;
            }
            if (this.trackValid.indexOf(trackID) === -1 && trackID !== -1) {
                return;
            }

            // No update if same track is selected
            if (trackID === this.scriptCurrent) {
                return;
            }

            if (trackID === -1 && this.$scriptElm !== null) {
                if (!this.$media.CFW_trigger('beforeTranscriptHide.cfw.player')) {
                    return;
                }
            }

            if (!this.$media.CFW_trigger('beforeTranscriptShow.cfw.player')) {
                return;
            }

            var $tsElm = this.$player.find('[data-cfw-player="transcript"]');

            if (this.$scriptElm !== null) {
                this.$scriptElm.remove();
                this.$scriptElm = null;
            }
            this.$element.removeClass('player-scriptshow');

            if ($tsElm.length) {
                if (this.trackValid.length === 1 && !this.settings.transcriptOption) {
                    // Update toggle
                    $tsElm.removeClass('active');
                    this._pressedState($tsElm, false);
                } else {
                    // Update menu
                    var $tsPar = $tsElm.parent();
                    $tsElm.removeClass('active');
                    $tsPar.removeClass('active');
                    $tsPar.find('[data-cfw-player-script]')
                        .removeClass('active')
                        .removeAttr('aria-pressed');
                }
            }

            // Disable any previous cuechange handling
            if (this.scriptCurrent !== -1) {
                this._cuechangeDisable(this.scriptCurrent, 'transcript');
            }

            this.scriptCurrent = trackID;

            if (trackID === -1) {
                this.scriptCues = null;
                this.descCues = null;
                this.$media.CFW_trigger('afterTranscriptHide.cfw.player');
            } else {
                this.scriptLoad();
            }
        },

        scriptLoad : function(forced) {
            var $selfRef = this;

            if (typeof forced === 'undefined') { forced = false; }

            this.$media.off('loadeddata.cfw.player.script');

            var tracks = this.media.textTracks;
            var tracksLength = tracks.length;
            if (tracksLength <= 0) {
                this.scriptCues = null;
                this.descCurrent = -1;
                this.descCues = null;
            }

            // Preload all tracks to stop future `load` event triggers on transcript change
            var hold = this.trackCurrent === -1 ? null : tracks[this.trackCurrent].mode;

            for (var i = 0; i < tracksLength; i++) {
                tracks[i].mode = 'hidden';
            }
            // reset the caption track state
            if (hold !== null) {
                tracks[this.trackCurrent].mode = hold;
            }

            // Find description track
            var descAvailable = false;
            this.descCurrent = -1;
            this.descCues = null;
            if (this.scriptCurrent !== -1) {
                var descLang = tracks[this.scriptCurrent].language;
                for (var j = 0; j < tracksLength; j++) {
                    if (descLang === tracks[j].language && tracks[j].kind === 'descriptions') {
                        if ($selfRef.settings.transcriptDescribe) {
                            $selfRef.descCurrent = j;
                        }
                        descAvailable = true;
                    }
                }
            }
            var $descControl = this.$player.find('[data-cfw-player-script-describe]');
            if (!descAvailable) {
                this._controlDisable($descControl);
            } else {
                this._controlEnable($descControl);
            }

            // Test again for text-based description
            var textDescAvailable = false;
            for (var k = 0; k < tracksLength; k++) {
                if (tracks[k].kind === 'descriptions') {
                    textDescAvailable = true;
                }
            }
            var $textDescControl = this.$player.find('[data-cfw-player="textdescription"]');
            if (!textDescAvailable) {
                this._controlDisable($textDescControl);
            } else {
                this._controlEnable($textDescControl);
            }

            var scriptLoad2 = function(forced) {
                var tracks = $selfRef.media.textTracks; // Reload object to get update
                var cues = $selfRef.scriptCurrent === -1 ? null : tracks[$selfRef.scriptCurrent].cues;
                var descCues = $selfRef.descCurrent === -1 ? null : tracks[$selfRef.descCurrent].cues;
                var textDescCues = $selfRef.textDescribeCurrent === -1 ? null : tracks[$selfRef.textDescribeCurrent].cues;

                if (cues && cues.length <= 0 && !forced) {
                    // Force media to load
                    $selfRef.$media.one('loadeddata.cfw.player.script', function() {
                        $selfRef.scriptLoad(true);
                    });
                    $selfRef.$media.trigger('load');
                    return;
                }

                $selfRef.scriptCues = cues;
                $selfRef.descCues = descCues;
                $selfRef.textDescribeCues = textDescCues;
                $selfRef.scriptProcess();
            };

            // Short delay to next part
            setTimeout(function() {
                scriptLoad2(forced);
            }, 100);
        },

        scriptProcess : function() {
            var $selfRef = this;

            if (this.scriptCues === null && this.descCues === null) {
                return;
            }

            var addCaption = function($div, cap) {
                var $capSpan = $('<span class="player-transcript-seekpoint player-transcript-caption"></span>');
                var capHTML = cap.getCueAsHTML();
                $capSpan.append(capHTML);
                $capSpan.attr({
                    'data-start' : cap.startTime.toString(),
                    'data-end'   : cap.endTime.toString()
                });
                $div.append($capSpan);
                $div.append('\n');
            };

            var addDescription = function($div, desc) {
                var $descDiv = $('<div class="player-description"></div>');
                $descDiv.append('<span class="sr-only">Description: </span>');

                var $descSpan = $('<span class="player-description-seekpoint player-description-caption"></span>');
                var descHTML = desc.getCueAsHTML();
                $descSpan.append(descHTML);
                $descSpan.attr({
                    'data-start' : desc.startTime.toString(),
                    'data-end'   : desc.endTime.toString()
                });
                $descDiv.append($descSpan);

                $div.append($descDiv);
                $div.append('\n');
            };

            var $tsElm = this.$player.find('[data-cfw-player="transcript"]');
            this.$element.addClass('player-scriptshow');

            if (this.trackValid.length === 1 && !this.settings.transcriptOption) {
                // Update toggle state
                $tsElm.addClass('active');
                this._pressedState($tsElm, true);
            } else if ($tsElm.length) {
                // Update transcript menu
                var $tsPar = $tsElm.parent();
                $tsElm.addClass('active');
                $tsPar.addClass('active');
                $tsPar.find('[data-cfw-player-script="' + this.scriptCurrent + '"]')
                    .addClass('active')
                    .attr('aria-pressed', 'true');
            }

            // Remove any existing transcript container
            this.$element.find('.player-transcript').remove();

            // Insert transcript container
            var $newElm = $('<div class="player-transcript"></div>');
            this.$element.append($newElm);
            this.$scriptElm = this.$element.find('.player-transcript');

            // Loop through all captions/descriptions and add to transcript container
            var captions = this.scriptCues || [];
            var descriptions = this.descCues || [];
            var capIdx = 0;
            var descIdx = 0;
            var timeStamp = null;

            while ((capIdx < captions.length) || (descIdx < descriptions.length)) {
                if ((descIdx < descriptions.length) && (capIdx < captions.length)) {
                    // Both descriptions and captions have content
                    timeStamp = Math.min(descriptions[descIdx].startTime, captions[capIdx].startTime);
                } else {
                    // Only one item has content
                    timeStamp = null;
                }

                if (timeStamp !== null) {
                    if (typeof descriptions[descIdx] !== 'undefined' && descriptions[descIdx].startTime === timeStamp) {
                        addDescription(this.$scriptElm, descriptions[descIdx]);
                        descIdx += 1;
                    } else {
                        addCaption(this.$scriptElm, captions[capIdx]);
                        capIdx += 1;
                    }
                } else if (descIdx < descriptions.length) {
                    addDescription(this.$scriptElm, descriptions[descIdx]);
                    descIdx += 1;
                } else if (capIdx < captions.length) {
                    addCaption(this.$scriptElm, captions[capIdx]);
                    capIdx += 1;
                }
            }

            // Hook in cuechange handler
            this._cuechangeEnable(this.scriptCurrent, 'transcript', this.scriptHighlight);

            // Seekpoint event handlers
            $(this.seekPoint, this.$scriptElm)
                .off('click.cfw.player.scriptseek')
                .on('click.cfw.player.scriptseek', function() {
                    var spanStart = parseFloat($(this).attr('data-start'));
                    $selfRef.scriptSeek(spanStart);
                });

            this.$media.CFW_trigger('afterTranscriptShow.cfw.player');
        },

        scriptHighlight : function(activeCues) {
            // Remove any active highlights
            $('.player-transcript-active', this.$scriptElm).removeClass('player-transcript-active');

            if (activeCues.length <= 0) {
                return;
            }

            var cueStart = activeCues[0].startTime;
            var $matchCap = $('.player-transcript-caption[data-start="' + cueStart + '"]', this.$scriptElm);
            $matchCap.addClass('player-transcript-active');

            if (this.settings.transcriptScroll) {
                var tsScroll = this.$scriptElm.scrollTop();
                var tsMid = this.$scriptElm.innerHeight() / 2;
                var mcTop = $matchCap.position().top;
                var mcMid = $matchCap.height() / 2;

                var newTop = Math.floor(tsScroll + mcTop - tsMid + mcMid);
                if (newTop !== Math.floor(tsScroll)) {
                    this.$scriptElm.scrollTop(newTop);
                }
            }
        },

        scriptSeek : function(timestamp) {
            var $selfRef = this;

            timestamp += 0.01; // pad timestamp to put 'inside' the cue

            if (this.media.readyState < 2) {
                this.$media.one('canplay', function() {
                    $selfRef.seekTo(timestamp);
                });
                this.$media.trigger('load');
            } else {
                this.seekTo(timestamp);
            }
        },

        textDescriptionInit : function() {
            var $selfRef = this;
            var $tdElm = this.$player.find('[data-cfw-player="textdescription"]');
            if ($tdElm.length <= 0) {
                return;
            }

            if (this.trackDescription.length <= 0) {
                this._controlDisable($tdElm);
                return;
            }

            // Build menu
            var wrapper = '<span class="player-text-describe-wrapper"></span>';
            var $menu = $('<ul class="player-text-describe-menu dropdown-menu"></ul>');
            $tdElm.wrap(wrapper);

            var $wrapper = $tdElm.parent(); /* Because $().wrap() clones element */

            $wrapper.append($menu);
            var menuID = $menu.CFW_getID('cfw-player');

            var $menuItem = $('<li class="player-text-describe-off"><button type="button" class="dropdown-item" data-cfw-player-text-describe="-1">Off</button></li>');
            $menu.append($menuItem);

            var tracks = this.media.textTracks;
            for (var i = 0; i < this.trackDescription.length; i++) {
                var trackID = this.trackDescription[i];
                $menuItem = $('<li><button type="button" class="dropdown-item" data-cfw-player-text-describe="' + trackID + '">' + tracks[trackID].label + '</a></li>');
                $menu.append($menuItem);
            }
            if (this.settings.transcriptOption) {
                $menuItem = $('<li class="dropdown-divider"></li>');
                $menu.append($menuItem);
                // Add announce toggle
                var announceCheck = this.settings.textDescribeAnnounce ? 'checked' : '';
                var announceID = 'textDescribeAnnounce-' + menuID;
                $menuItem = $('<li class="dropdown-text"><div class="form-check"><input type="checkbox" data-cfw-player-text-describe-announce class="form-check-input" ' + announceCheck + ' id="' + announceID + '"> <label class="form-check-label" for="' + announceID + '">Announce with Screen Reader</label></div></li>');
                $menu.append($menuItem);
                // Add visibility toggle
                var visibleCheck = this.settings.textDescribeVisible ? 'checked' : '';
                var visibleID = 'textDescribeVisible-' + menuID;
                $menuItem = $('<li class="dropdown-text"><div class="form-check"><input type="checkbox" data-cfw-player-text-describe-visible class="form-check-input" ' + visibleCheck + ' id="' + visibleID + '"> <label class="form-check-label" for="' + visibleID + '">Visible Description</label></div></li>');
                $menu.append($menuItem);
            }

            // Event handlers
            this.$player.on('click', '[data-cfw-player-text-describe]', function(e) {
                e.preventDefault();
                var $this = $(this);
                var num = $this.attr('data-cfw-player-text-describe');
                $selfRef.textDescriptionSet(num);
            });
            if (this.settings.transcriptOption) {
                this.$player.on('click', '[data-cfw-player-text-describe-announce]', function() {
                    $selfRef.settings.textDescribeAnnounce = !$selfRef.settings.textDescribeAnnounce;
                    $(this).prop('checked', $selfRef.settings.textDescribeAnnounce);
                    $selfRef.textDescriptionSet($selfRef.textDescribeCurrent);
                });
                this.$player.on('click', '[data-cfw-player-text-describe-visible]', function(e) {
                    if (!$selfRef._controlIsDisabled($(e.target))) {
                        $selfRef.settings.textDescribeVisible = !$selfRef.settings.textDescribeVisible;
                        $(this).prop('checked', $selfRef.settings.textDescribeVisible);
                        $selfRef.textDescriptionSet($selfRef.textDescribeCurrent);
                    }
                });
            }

            $tdElm.CFW_Dropdown({
                target: '#' + menuID
            });

            this.textDescriptionSet(this.settings.textDescribe);
        },

        textDescriptionSet : function(trackID) {
            trackID = parseInt(trackID, 10);

            if (this.trackDescription.length <= 0) {
                return;
            }
            if (this.trackDescription.indexOf(trackID) === -1 && trackID !== -1) {
                return;
            }

            if (trackID === -1 && this.$textDescribeElm !== null) {
                if (!this.$media.CFW_trigger('beforeTextDescriptionHide.cfw.player')) {
                    return;
                }
            } else if (!this.$media.CFW_trigger('beforeTextDescriptionShow.cfw.player')) {
                return;
            }

            if (this.$textDescribeElm !== null) {
                this.$textDescribeElm.remove();
                this.$textDescribeElm = null;
            }
            this.$element.removeClass('player-textdescshow');

            // Remove any existing text description containers
            this.$element.find('.player-textdesc-announce').remove();
            this.$element.find('.player-textdesc-visible').remove();

            var $tdElm = this.$player.find('[data-cfw-player="textdescription"]');
            if ($tdElm.length) {
                // Update menu
                var $tdPar = $tdElm.parent();
                $tdElm.removeClass('active');
                $tdPar.removeClass('active');
                $tdPar.find('[data-cfw-player-text-describe]')
                    .removeClass('active')
                    .removeAttr('aria-pressed');

                if (trackID !== -1) {
                    $tdElm.addClass('active');
                    $tdPar.addClass('active');
                    $tdPar.find('[data-cfw-player-text-describe="' + trackID + '"]')
                        .addClass('active')
                        .attr('aria-pressed', 'true');
                }
            }

            // Disable any previous cuechange handling
            if (this.textDescribeCurrent !== -1) {
                this._cuechangeDisable(this.textDescribeCurrent, 'textdescribe');
            }

            this.textDescribeCurrent = trackID;

            if (trackID === -1) {
                this.textDescribeCues = null;
                this.$media.CFW_trigger('afterTextDescriptionHide.cfw.player');
            } else {
                this.scriptLoad();
            }

            if (trackID !== -1) {
                // Insert new text description container
                var $newElm = $('<div class="player-textdesc"></div>');

                var trackLang = this.media.textTracks[trackID].language;
                if (trackLang.length) {
                    $newElm.attr('lang', trackLang);
                }
                if (this.settings.textDescribeAnnounce) {
                    $newElm.attr({
                        'aria-live': 'assertive',
                        'aria-atomic' : 'true'
                    });
                }
                if (!this.settings.textDescribeVisible) {
                    $newElm.addClass('sr-only');
                }
                this.$element.append($newElm);
                this.$textDescribeElm = this.$element.find('.player-textdesc');

                // Hook in cuechange handler
                this._cuechangeEnable(this.textDescribeCurrent, 'textdescribe', this.textDescribeUpdate);

                this.$media.CFW_trigger('afterTextDescriptionShow.cfw.player');
            }
        },

        textDescribeUpdate : function(activeCues) {
            if (activeCues === null || activeCues.length <= 0) {
                this.$textDescribeElm.empty();
            } else {
                // Show caption area and update caption
                var $tmp = $(document.createElement('div'));
                $tmp.append(activeCues[0].getCueAsHTML());

                var cueHTML = $tmp.html().replace('\n', '<br>');
                this.$textDescribeElm.append(cueHTML);
            }
        },

        activityInit : function() {
            var $selfRef = this;

            setInterval(function() {
                if ($selfRef.activity && !$selfRef.over) {
                    $selfRef.activity = false;

                    clearTimeout($selfRef.activityTimer);

                    $selfRef.activityStatus(true);

                    $selfRef.activityTimer = setTimeout(function() {
                        if (!$selfRef.activity) {
                            $selfRef.activityStatus(false);
                        }
                    }, 1000);
                }
            }, 250);
        },

        activityStatus : function(bool) {
            if (bool !== this.userActive) {
                this.userActive = bool;
                if (bool) {
                    this.activity = true;
                    this.$element.removeClass('player-inactive');
                } else {
                    this.activity = false;
                    // Stop pointer change from triggering false mousemove event when changing pointers
                    this.$element.one('mousemove', function(e) {
                        e.stopPropagation();
                        e.preventDefault();
                    });
                    this.$element.addClass('player-inactive');
                }
            }
        },

        captionDisplayUpdate : function(activeCues) {
            if (this.$captionWrapper === null) { return; }

            if (this.trackCurrent === -1 || activeCues === null || activeCues.length <= 0) {
                // Clear and hide caption area - nothing to show
                this.$captionWrapper
                    .attr('aria-hidden', 'true')
                    .css('display', 'none')
                    .empty();
            } else {
                // Show caption area and update caption
                var $tmp = $(document.createElement('div'));
                $tmp.append(activeCues[0].getCueAsHTML());

                var cueHTML = $tmp.html().replace('\n', '<br>');
                this.$captionWrapper
                    .removeAttr('aria-hidden')
                    .css('display', '')
                    .append(cueHTML);
            }
        },

        _actionsKeydown : function(e) {
            // 32-space, 33-pgup, 34-pgdn, 35-end, 36-home, 37-left, 38-up, 39-right, 40-down, 70-f/F, 77-m/M
            if (!/(32|33|34|35|36|37|38|39|40|70|77)/.test(e.which)) { return; }

            // Ignore space use on button/role="button" items
            if (e.which === 32 || e.target.tagName === 'button' || $(e.target).attr('role') === 'button') { return; }

            e.stopPropagation();
            e.preventDefault();

            switch (e.which) {
                case 32: { // space
                    if (this.media.paused) {
                        // Paused/stopped
                        this.media.play();
                    } else {
                        // Playing
                        this.media.pause();
                    }
                    this._focusHelper();
                    break;
                }
                case 38: { // up
                    this.volumeIncrement(5);
                    break;
                }
                case 40: { // down
                    this.volumeIncrement(-5);
                    break;
                }
                case 36: { // home
                    this.seekTo(0.0);
                    break;
                }
                case 35: { // end
                    this.seekTo(this.media.duration);
                    break;
                }
                case 37: { // left
                    this.seekIncrement(-5);
                    break;
                }
                case 39: { // right
                    this.seekIncrement(5);
                    break;
                }
                case 33: { // pgup
                    this.seekIncrement(this.status.duration / 5);
                    break;
                }
                case 34: { // pgdn
                    this.seekIncrement(this.status.duration / -5);
                    break;
                }
                case 70: { // f/F
                    this.fullscreen();
                    break;
                }
                case 77: { // m/M
                    this.mute();
                    break;
                }
                default:
            }
        },

        _pressedState : function($node, state) {
            if ($node.length <= 0) { return; }

            // True button
            var nodeName = $node.get(0).nodeName.toLowerCase();
            // role="button"
            var nodeRole = $node.attr('role');
            if (nodeName === 'button' || nodeRole === 'button') {
                $node.attr('aria-pressed', state);
            }
        },

        _focusControl : function(control) {
            var $control = $(control);
            if ($control.length <= 0) { return; }

            setTimeout(function() {
                if ($control.is('a, button')) {
                    $control.trigger('focus');
                } else {
                    $control.find('a:visible, button:visible').eq(0).trigger('focus');
                }
            }, 150);
        },

        _focusHelper : function() {
            var $selfRef = this;

            var $focusCurr = $(document.activeElement);
            setTimeout(function() {
                if (!$focusCurr.is(':visible')) {
                    $selfRef.$focus.trigger('focus');
                }
            }, 10);
        },

        _controlEnable : function($control) {
            $control
                .removeClass('disabled')
                .removeAttr('disabled')
                .closest('label')
                .removeClass('disabled');
        },

        _controlDisable : function($control) {
            if ($control.is('button, input')) {
                $control.prop('disabled', true);
                $control
                    .closest('label')
                    .addClass('disabled');
            } else {
                $control.addClass('disabled');
            }
        },

        _controlIsDisabled : function($control) {
            return $control.is('.disabled, :disabled');
        },

        _cuechangeEnable : function(trackID, namespace, callback) {
            var $selfRef = this;
            if (typeof this.media.textTracks[trackID].oncuechange !== 'undefined') {
                $(this.media.textTracks[trackID])
                    .on('cuechange.cfw.player.' + namespace, function() {
                        callback.call($selfRef, this.activeCues);
                    });
            } else {
                // Firefox does not currently support oncuechange event
                this.$media
                    .on('timeupdate.cfw.player.' + namespace, function() {
                        var activeCues = $selfRef.media.textTracks[trackID].activeCues;
                        callback.call($selfRef, activeCues);
                    });
            }

            // Artificially trigger a cuechange - in case already in middle of a cue
            var cueEvent;
            if (typeof this.media.textTracks[trackID].oncuechange !== 'undefined') {
                cueEvent = $.Event('cuechange');
                $(this.media.textTracks[trackID]).trigger(cueEvent);
            } else {
                // Firefox
                cueEvent = $.Event('timeupdate');
                this.$media.trigger(cueEvent);
            }
        },

        _cuechangeDisable : function(trackID, namespace) {
            $(this.media.textTracks[trackID]).off('cuechange.cfw.player.' + namespace);
            this.$media.off('timeupdate.cfw.player.' + namespace);
        },

        dispose : function() {
            clearTimeout(this.activityTimer);
            if (this.$scriptElm) {
                $(this.seekPoint, this.$scriptElm).off('.cfw.player.seekpoint');
                this.$scriptElm.remove();
            }
            if (this.$sliderSeek) {
                this.$sliderSeek.off();
            }
            if (this.$volSeek) {
                this.$volSeek.off();
            }
            if ($.hasData(this.$player.find('[data-cfw-player="caption"]'))) {
                this.$player.find('[data-cfw-player="caption"]').CFW_Dropdown('dispose');
            }
            if ($.hasData(this.$player.find('[data-cfw-player="transcript"]'))) {
                this.$player.find('[data-cfw-player="transcript"]').CFW_Dropdown('dispose');
            }
            this.$player.off();
            this.$media.off();

            this.$element
                .off()
                .removeData('cfw.player');

            this.$element = null;
            this.type = null;
            this.$media = null;
            this.media = null;
            this.$player = null;
            this.$sources = null;
            this.$focus = null;
            this.$sliderSeek = null;
            this.$volSeek = null;
            this.activity = null;
            this.over = null;
            this.userActive = null;
            this.activityTimer = null;
            this.mouseActivity = null;
            this.scrubPlay = null;
            this.played = null;
            this.status = null;
            this.support = null;
            this.trackValid = null;
            this.trackCurrent = null;
            this.$captionWrapper = null;
            this.$scriptElm = null;
            this.scriptCurrent = null;
            this.scriptCues = null;
            this.descCues = null;
            this.trackDescription = null;
            this.$textDescribeElm = null;
            this.textDescribeCurrent = null;
            this.textDescribeCues = null;
            this.settings = null;
        }
    };

    var Plugin = function(option) {
        var args = [].splice.call(arguments, 1);
        return this.each(function() {
            var $this = $(this);
            var data = $this.data('cfw.player');
            var options = typeof option === 'object' && option;

            if (!data) {
                $this.data('cfw.player', data = new CFW_Widget_Player(this, options));
            }
            if (typeof option === 'string') {
                data[option].apply(data, args);
            }
        });
    };

    $.fn.CFW_Player = Plugin;
    $.fn.CFW_Player.Constructor = CFW_Widget_Player;
}(jQuery));

/**
 * --------------------------------------------------------------------------
 * Figuration (v4.0.1): common.js
 * Licensed under MIT (https://github.com/cast-org/figuration/blob/master/LICENSE)
 * --------------------------------------------------------------------------
 */

(function($) {
    'use strict';

    var cfwList = {
        '[data-cfw-dismisss="alert"]': 'CFW_Alert',
        '[data-cfw="collapse"]': 'CFW_Collapse',
        '[data-cfw="dropdown"]': 'CFW_Dropdown',
        '[data-cfw="tab"]': 'CFW_Tab',
        '[data-cfw="tooltip"]': 'CFW_Tooltip',
        '[data-cfw="popover"]': 'CFW_Popover',
        '[data-cfw="modal"]': 'CFW_Modal',
        '[data-cfw="affix"]': 'CFW_Affix',
        '[data-cfw="tabResponsive"]': 'CFW_TabResponsive',
        '[data-cfw="accordion"]': 'CFW_Accordion',
        '[data-cfw="slideshow"]': 'CFW_Slideshow',
        '[data-cfw="scrollspy"]': 'CFW_Scrollspy',
        '[data-cfw="lazy"]': 'CFW_Lazy',
        '[data-cfw="equalize"]': 'CFW_Equalize',
        '[data-cfw="player"]': 'CFW_Player'
    };

    $.fn.CFW_Init = function() {
        var $scope = $(this);
        if (!$scope.length) { $scope = $(document.body); }

        for (var key in cfwList) {
            if (typeof $.fn[cfwList[key]] === 'function') {
                /* eslint-disable-next-line no-loop-func */
                $scope.find(key).add($scope.filter(key)).each(function() {
                    $(this)[cfwList[key]]();
                });
            }
        }
        return this;
    };

    $.fn.CFW_Dispose = function() {
        var $scope = $(this);
        if (!$scope.length) { $scope = $(document.body); }

        for (var key in cfwList) {
            if (typeof $.fn[cfwList[key]] === 'function') {
                /* eslint-disable-next-line no-loop-func */
                $scope.find(key).add($scope.filter(key)).each(function() {
                    $(this)[cfwList[key]]('dispose');
                });
            }
        }
        return this;
    };

    $(window).ready(function() {
        if (typeof CFW_API === 'undefined' || CFW_API !== false) {
            $(document.body).CFW_Init();
        }
    });
}(jQuery));
