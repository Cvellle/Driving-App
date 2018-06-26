webpackJsonp([1],{

/***/ 1425:
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var stylesInDom = {},
	memoize = function(fn) {
		var memo;
		return function () {
			if (typeof memo === "undefined") memo = fn.apply(this, arguments);
			return memo;
		};
	},
	isOldIE = memoize(function() {
		return /msie [6-9]\b/.test(self.navigator.userAgent.toLowerCase());
	}),
	getHeadElement = memoize(function () {
		return document.head || document.getElementsByTagName("head")[0];
	}),
	singletonElement = null,
	singletonCounter = 0,
	styleElementsInsertedAtTop = [];

module.exports = function(list, options) {
	if(typeof DEBUG !== "undefined" && DEBUG) {
		if(typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
	}

	options = options || {};
	// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
	// tags it will allow on a page
	if (typeof options.singleton === "undefined") options.singleton = isOldIE();

	// By default, add <style> tags to the bottom of <head>.
	if (typeof options.insertAt === "undefined") options.insertAt = "bottom";

	var styles = listToStyles(list);
	addStylesToDom(styles, options);

	return function update(newList) {
		var mayRemove = [];
		for(var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];
			domStyle.refs--;
			mayRemove.push(domStyle);
		}
		if(newList) {
			var newStyles = listToStyles(newList);
			addStylesToDom(newStyles, options);
		}
		for(var i = 0; i < mayRemove.length; i++) {
			var domStyle = mayRemove[i];
			if(domStyle.refs === 0) {
				for(var j = 0; j < domStyle.parts.length; j++)
					domStyle.parts[j]();
				delete stylesInDom[domStyle.id];
			}
		}
	};
}

function addStylesToDom(styles, options) {
	for(var i = 0; i < styles.length; i++) {
		var item = styles[i];
		var domStyle = stylesInDom[item.id];
		if(domStyle) {
			domStyle.refs++;
			for(var j = 0; j < domStyle.parts.length; j++) {
				domStyle.parts[j](item.parts[j]);
			}
			for(; j < item.parts.length; j++) {
				domStyle.parts.push(addStyle(item.parts[j], options));
			}
		} else {
			var parts = [];
			for(var j = 0; j < item.parts.length; j++) {
				parts.push(addStyle(item.parts[j], options));
			}
			stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
		}
	}
}

function listToStyles(list) {
	var styles = [];
	var newStyles = {};
	for(var i = 0; i < list.length; i++) {
		var item = list[i];
		var id = item[0];
		var css = item[1];
		var media = item[2];
		var sourceMap = item[3];
		var part = {css: css, media: media, sourceMap: sourceMap};
		if(!newStyles[id])
			styles.push(newStyles[id] = {id: id, parts: [part]});
		else
			newStyles[id].parts.push(part);
	}
	return styles;
}

function insertStyleElement(options, styleElement) {
	var head = getHeadElement();
	var lastStyleElementInsertedAtTop = styleElementsInsertedAtTop[styleElementsInsertedAtTop.length - 1];
	if (options.insertAt === "top") {
		if(!lastStyleElementInsertedAtTop) {
			head.insertBefore(styleElement, head.firstChild);
		} else if(lastStyleElementInsertedAtTop.nextSibling) {
			head.insertBefore(styleElement, lastStyleElementInsertedAtTop.nextSibling);
		} else {
			head.appendChild(styleElement);
		}
		styleElementsInsertedAtTop.push(styleElement);
	} else if (options.insertAt === "bottom") {
		head.appendChild(styleElement);
	} else {
		throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");
	}
}

function removeStyleElement(styleElement) {
	styleElement.parentNode.removeChild(styleElement);
	var idx = styleElementsInsertedAtTop.indexOf(styleElement);
	if(idx >= 0) {
		styleElementsInsertedAtTop.splice(idx, 1);
	}
}

function createStyleElement(options) {
	var styleElement = document.createElement("style");
	styleElement.type = "text/css";
	insertStyleElement(options, styleElement);
	return styleElement;
}

function createLinkElement(options) {
	var linkElement = document.createElement("link");
	linkElement.rel = "stylesheet";
	insertStyleElement(options, linkElement);
	return linkElement;
}

function addStyle(obj, options) {
	var styleElement, update, remove;

	if (options.singleton) {
		var styleIndex = singletonCounter++;
		styleElement = singletonElement || (singletonElement = createStyleElement(options));
		update = applyToSingletonTag.bind(null, styleElement, styleIndex, false);
		remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true);
	} else if(obj.sourceMap &&
		typeof URL === "function" &&
		typeof URL.createObjectURL === "function" &&
		typeof URL.revokeObjectURL === "function" &&
		typeof Blob === "function" &&
		typeof btoa === "function") {
		styleElement = createLinkElement(options);
		update = updateLink.bind(null, styleElement);
		remove = function() {
			removeStyleElement(styleElement);
			if(styleElement.href)
				URL.revokeObjectURL(styleElement.href);
		};
	} else {
		styleElement = createStyleElement(options);
		update = applyToTag.bind(null, styleElement);
		remove = function() {
			removeStyleElement(styleElement);
		};
	}

	update(obj);

	return function updateStyle(newObj) {
		if(newObj) {
			if(newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap)
				return;
			update(obj = newObj);
		} else {
			remove();
		}
	};
}

var replaceText = (function () {
	var textStore = [];

	return function (index, replacement) {
		textStore[index] = replacement;
		return textStore.filter(Boolean).join('\n');
	};
})();

function applyToSingletonTag(styleElement, index, remove, obj) {
	var css = remove ? "" : obj.css;

	if (styleElement.styleSheet) {
		styleElement.styleSheet.cssText = replaceText(index, css);
	} else {
		var cssNode = document.createTextNode(css);
		var childNodes = styleElement.childNodes;
		if (childNodes[index]) styleElement.removeChild(childNodes[index]);
		if (childNodes.length) {
			styleElement.insertBefore(cssNode, childNodes[index]);
		} else {
			styleElement.appendChild(cssNode);
		}
	}
}

function applyToTag(styleElement, obj) {
	var css = obj.css;
	var media = obj.media;

	if(media) {
		styleElement.setAttribute("media", media)
	}

	if(styleElement.styleSheet) {
		styleElement.styleSheet.cssText = css;
	} else {
		while(styleElement.firstChild) {
			styleElement.removeChild(styleElement.firstChild);
		}
		styleElement.appendChild(document.createTextNode(css));
	}
}

function updateLink(linkElement, obj) {
	var css = obj.css;
	var sourceMap = obj.sourceMap;

	if(sourceMap) {
		// http://stackoverflow.com/a/26603875
		css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
	}

	var blob = new Blob([css], { type: "text/css" });

	var oldSrc = linkElement.href;

	linkElement.href = URL.createObjectURL(blob);

	if(oldSrc)
		URL.revokeObjectURL(oldSrc);
}


/***/ }),

/***/ 173:
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(176);
if(typeof content === 'string') content = [[module.i, content, '']];
// add the styles to the DOM
var update = __webpack_require__(1425)(content, {});
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../node_modules/css-loader/index.js!./style.css", function() {
			var newContent = require("!!../node_modules/css-loader/index.js!./style.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),

/***/ 174:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = __webpack_require__(6);

var _react2 = _interopRequireDefault(_react);

var _reactDom = __webpack_require__(59);

var _reactDom2 = _interopRequireDefault(_reactDom);

__webpack_require__(173);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var routes = JSON.parse(localStorage.getItem('routes')) || [];

var App = function (_React$Component) {
  _inherits(App, _React$Component);

  function App(props) {
    _classCallCheck(this, App);

    var _this = _possibleConstructorReturn(this, (App.__proto__ || Object.getPrototypeOf(App)).call(this, props));

    _this.state = { routes: _this.props.routes };

    _this.add = _this.add.bind(_this);
    _this.done = _this.done.bind(_this);
    return _this;
  }

  _createClass(App, [{
    key: 'add',
    value: function add(e) {
      var routes = this.props.routes;

      routes.push([_reactDom2.default.findDOMNode(this.refs.myInput).value, _reactDom2.default.findDOMNode(this.refs.myInput2).value]);

      localStorage.setItem('routes', JSON.stringify(routes));

      this.setState({ routes: routes });

      e.target.previousElementSibling.value = null;
      e.target.previousElementSibling.previousElementSibling.value = null;
    }
  }, {
    key: 'done',
    value: function done(route) {
      routes.splice(routes.indexOf(route), 1);
      localStorage.setItem('routes', JSON.stringify(routes));

      this.setState({ routes: routes });
    }
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      _reactDom2.default.findDOMNode(this.refs.myInput).value = "Belgrade";
      _reactDom2.default.findDOMNode(this.refs.myInput2).value = "Novi Sad";
    }
  }, {
    key: 'render',
    value: function render() {

      var mapped = this.state.routes.map(function (route, i) {
        return _react2.default.createElement(
          'li',
          null,
          _react2.default.createElement(
            'b',
            { className: 'index' },
            '#',
            i + 1
          ),
          _react2.default.createElement(RouteItem, { route: route, done: this.done })
        );
      }.bind(this));

      return _react2.default.createElement(
        'div',
        { id: 'app' },
        _react2.default.createElement(
          'div',
          { id: 'add' },
          _react2.default.createElement('input', { type: 'text', id: 'input1', ref: 'myInput' }),
          _react2.default.createElement('input', { type: 'text', id: 'input2', ref: 'myInput2' }),
          _react2.default.createElement(
            'button',
            { className: 'submit', onClick: this.add },
            'Submit'
          ),
          _react2.default.createElement(
            'ul',
            null,
            mapped
          ),
          _react2.default.createElement(
            'b',
            { 'class': 'counter' },
            'You have ',
            this.props.routes.length,
            ' route(s) '
          )
        ),
        _react2.default.createElement(ContactBody, null)
      );
    }
  }]);

  return App;
}(_react2.default.Component);

;

var RouteItem = function (_React$Component2) {
  _inherits(RouteItem, _React$Component2);

  function RouteItem(props) {
    _classCallCheck(this, RouteItem);

    var _this2 = _possibleConstructorReturn(this, (RouteItem.__proto__ || Object.getPrototypeOf(RouteItem)).call(this, props));

    _this2.done = _this2.done.bind(_this2);
    _this2.show = _this2.show.bind(_this2);
    return _this2;
  }

  _createClass(RouteItem, [{
    key: 'componentDidMount',
    value: function componentDidMount() {}
  }, {
    key: 'done',
    value: function done() {
      this.props.done(this.props.route);
    }
  }, {
    key: 'show',
    value: function show(e) {
      add.style.display = "none";
      map.style.display = "block";
      hide.style.display = "block";
      descr.style.display = "block";

      descr.innerHTML = e.target.parentNode.previousElementSibling.innerHTML + ' ' + e.target.previousElementSibling.previousElementSibling.innerHTML + ' - ' + e.target.previousElementSibling.innerHTML;

      var start = e.target.previousElementSibling.previousElementSibling.innerHTML;
      var end = e.target.previousElementSibling.innerHTML;

      setTimeout(function (e) {

        var directionsDisplay = void 0;
        var directionsService = new google.maps.DirectionsService();

        var map;

        var belgrade = new google.maps.LatLng(44.8089237, 20.4813078);
        var mapOptions = {
          zoom: 6,
          center: belgrade
        };

        var map = new google.maps.Map(document.getElementById('map'), mapOptions);

        directionsDisplay = new google.maps.DirectionsRenderer();

        var waypts = [];

        var request = {
          origin: start,
          destination: end,
          waypoints: waypts,
          optimizeWaypoints: true,
          travelMode: google.maps.TravelMode.DRIVING
        };

        directionsService.route(request, function (response, status) {

          if (status == google.maps.DirectionsStatus.OK) {

            directionsDisplay.setDirections(response);

            var length = Math.round(directionsDisplay.getDirections().routes[directionsDisplay.getRouteIndex()].legs[0].distance.value / 1000);
            var time = (length / 80).toFixed(2);
            var timearray = time.split('.').map(parseFloat);

            var hours = time.toString()[0];
            var hours2 = '' + Number(time.toString()[0]) + Number(time.toString()[1]);

            var mins = '' + time.toString()[2] + time.toString()[3];
            var mins2 = '' + time.toString()[3] + time.toString()[4];

            var minsfin = (Number(mins) * 60 / 100).toFixed(0);
            var minsfin2 = (Number(mins2) * 60 / 100).toFixed(0);

            if (hours <= 1) {
              output.innerHTML = length + " km. About " + hours + " hour and " + mins + " mins";
            } else if (time.toString().length == 5) {
              output.innerHTML = length + " km. About " + hours2 + " hour and " + minsfin2 + " mins";
            } else output.innerHTML = length + " km. About " + hours + " hours and " + minsfin + " mins";

            var route = response.routes[0];
          }
        });

        directionsDisplay.setMap(map);

        setTimeout(function (e) {
          output.style.display = "block";
        }, 100);
      }, 0);
    }
  }, {
    key: 'render',
    value: function render() {

      return _react2.default.createElement(
        'li',
        null,
        _react2.default.createElement(
          'span',
          null,
          '-'
        ),
        _react2.default.createElement(
          'p',
          { id: 'start' },
          this.props.route[0],
          ' '
        ),
        _react2.default.createElement(
          'p',
          { id: 'end' },
          ' ',
          this.props.route[1],
          ' '
        ),
        _react2.default.createElement(
          'button',
          { id: 'show', onClick: this.show },
          'Details'
        ),
        _react2.default.createElement(
          'button',
          { id: 'del', onClick: this.done },
          'Delete'
        )
      );
    }
  }]);

  return RouteItem;
}(_react2.default.Component);

var ContactBody = function (_React$Component3) {
  _inherits(ContactBody, _React$Component3);

  function ContactBody(props) {
    _classCallCheck(this, ContactBody);

    var _this3 = _possibleConstructorReturn(this, (ContactBody.__proto__ || Object.getPrototypeOf(ContactBody)).call(this, props));

    _this3.hide = _this3.hide.bind(_this3);
    return _this3;
  }

  _createClass(ContactBody, [{
    key: 'getGoogleMaps',
    value: function getGoogleMaps() {

      if (!this.googleMapsPromise) {
        this.googleMapsPromise = new Promise(function (resolve) {
          window.resolveGoogleMapsPromise = function () {
            resolve(google);
            delete window.resolveGoogleMapsPromise;
          };
          var script = document.createElement("script");
          script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDbAz1XXxDoKSU2nZXec89rcHPxgkvVoiw&callback=resolveGoogleMapsPromise';
          script.async = true;
          document.body.appendChild(script);
        });
      }

      return this.googleMapsPromise;
    }
  }, {
    key: 'componentWillMount',
    value: function componentWillMount() {
      this.getGoogleMaps();
    }
  }, {
    key: 'hide',
    value: function hide(e) {
      map.style.display = "none";
      e.target.style.display = "none";
      add.style.display = "block";
      map.innerHTML = "";
      descr.style.display = "none";
      output.style.display = "none";
    }
  }, {
    key: 'render',
    value: function render() {
      return _react2.default.createElement(
        'div',
        { div: true, id: 'mapvid' },
        _react2.default.createElement(
          'button',
          { id: 'hide', onClick: this.hide },
          'Go Back'
        ),
        _react2.default.createElement(
          'b',
          { id: 'descr' },
          'Go Back'
        ),
        _react2.default.createElement('div', { id: 'map' }),
        _react2.default.createElement('p', { id: 'output' })
      );
    }
  }]);

  return ContactBody;
}(_react2.default.Component);

_reactDom2.default.render(_react2.default.createElement(App, { routes: routes }), document.getElementById('root'));

/***/ }),

/***/ 176:
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(177)();
// imports


// module
exports.push([module.i, "body {\r\n  display:-webkit-flex;\r\n  justify-content:center;\r\n  font-family:Arial, Helvetica, sans-serif;\r\n}\r\n\r\n#app{\r\n  margin-top:4rem;\r\n  height:100%;\r\n  width:35rem;\r\n}\r\n\r\n.add {\r\n  width:100%;\r\n  display:-webkit-flex;\r\n}\r\n\r\nul {\r\n  list-style:none;\r\n  font-family:Arial;\r\n  font-size:100%;\r\n  font-weight:500;\r\n}\r\n\r\n#input1 {\r\n  margin-left:0%;\r\n  width:30%;\r\n  height:1.8rem;\r\n  border-radius:0.2rem;\r\n  border:1px solid gray;\r\n  padding-left:0.3rem;\r\n}\r\n\r\n#input2 {\r\n  margin-left:1.5%;\r\n  margin-right:1.4%;\r\n  width:50%;\r\n  height:1.8rem;\r\n  border-radius:0.2rem;\r\n  border:1px solid gray;\r\n  padding-left:0.3rem;\r\n}\r\n\r\n.submit {\r\n  display:inline;\r\n  align-items:center;\r\n  background:skyblue;\r\n  border-radius:0.1rem;\r\n  outline:none;\r\n  width:4rem;\r\n  height:2.05rem;\r\n  color:white;\r\n  border:none;\r\n  border-radius:0.2rem;\r\n  font-size:100%;\r\n}\r\n\r\nul {\r\n  margin-top:4rem;\r\n}\r\n\r\nli {\r\n  position:relative;\r\n  display:-webkit-flex;\r\n  width:100%;\r\n  margin-left:-2%;\r\n}\r\n\r\nspan {\r\n  position:relative;\r\n  left:14%;\r\n  top:30%;\r\n}\r\n\r\n.index {\r\n  position:absolute;\r\n  left:-6%;\r\n  top:32%;\r\n}\r\n\r\n#start {\r\n  width:15%;\r\n}\r\n\r\n#end {\r\n  width:20%;\r\n}\r\n\r\n#show {\r\n  margin-left:0%;\r\n  background:skyblue;\r\n  border-radius:0.1rem;\r\n  outline:none;\r\n  width:4rem;\r\n  height:2rem;\r\n  margin-top:auto;\r\n  margin-bottom:auto;\r\n  color:white;\r\n  border:none;\r\n  border-radius:0.2rem;\r\n  font-size:1rem;\r\n}\r\n\r\n#del {\r\n  margin-left:2%;\r\n  width:4rem;\r\n  height:2rem;\r\n  margin-top:auto;\r\n  margin-bottom:auto;\r\n  background:brown;\r\n  color:white;\r\n  border:none;\r\n  border-radius:0.2rem;\r\n  font-size:1rem;\r\n}\r\n\r\nbutton {\r\n  cursor:pointer;\r\n  display:-webkit-flex;\r\n  justify-content:center;\r\n}\r\n\r\n.counter {\r\n  margin-left:0%;\r\n}\r\n\r\n.mapvid {\r\n  display:flex;\r\n  width:90%;\r\n}\r\n\r\n#hide {\r\n  display:none;\r\n  background:rgb(235, 157, 12);\r\n  border:none;\r\n  border-radius:0.3rem;\r\n  height:2rem;\r\n  width: 5.3rem;\r\n  margin-top:0.4rem;\r\n  margin-bottom:1rem;\r\n  margin-left:1.45rem;\r\n  color:white;\r\n}\r\n\r\n#hide:focus {\r\n  outline:none;\r\n}\r\n\r\n#map {\r\n  width: 32rem;\r\n  height: 23rem;\r\n  margin:auto;\r\n  margin-top:1.8rem;\r\n}\r\n\r\n#descr {\r\n  margin-left:4%;\r\n  font-size:1.6rem;\r\n  display:none;\r\n  font-weight:500;\r\n}\r\n\r\n#mapp {\r\n  height: 10rem;\r\n  width: 78%;\r\n  float: left;\r\n  border: 1px solid #996699;\r\n  border-radius: 5px;\r\n}\r\n\r\n#floating-panel {\r\n  position: float top;\r\n  z-index: 5;\r\n  background-color: #BF5FFF;\r\n  padding: 5px;\r\n  border: 1px solid #996699;\r\n  border-radius: 5px;\r\n  text-align: center;\r\n  font-family: 'Roboto', 'sans-serif';\r\n  line-height: 30px;\r\n  padding-left: 10px;\r\n}\r\n\r\n#output {\r\n  float: left;\r\n  height: 100%;\r\n  margin-left:4.5%;\r\n  display:none;\r\n  font-size: 100%;\r\n}\r\n", ""]);

// exports


/***/ }),

/***/ 177:
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function() {
	var list = [];

	// return the list of modules as css string
	list.toString = function toString() {
		var result = [];
		for(var i = 0; i < this.length; i++) {
			var item = this[i];
			if(item[2]) {
				result.push("@media " + item[2] + "{" + item[1] + "}");
			} else {
				result.push(item[1]);
			}
		}
		return result.join("");
	};

	// import a list of modules into the list
	list.i = function(modules, mediaQuery) {
		if(typeof modules === "string")
			modules = [[null, modules, ""]];
		var alreadyImportedModules = {};
		for(var i = 0; i < this.length; i++) {
			var id = this[i][0];
			if(typeof id === "number")
				alreadyImportedModules[id] = true;
		}
		for(i = 0; i < modules.length; i++) {
			var item = modules[i];
			// skip already imported module
			// this implementation is not 100% perfect for weird media query combinations
			//  when a module is imported multiple times with different media queries.
			//  I hope this will never occur (Hey this way we have smaller bundles)
			if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
				if(mediaQuery && !item[2]) {
					item[2] = mediaQuery;
				} else if(mediaQuery) {
					item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
				}
				list.push(item);
			}
		}
	};
	return list;
};


/***/ })

},[174]);