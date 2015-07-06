(function() {
  
  var findObjs = function(element, properties, multiple) {
    var match = multiple ? [] : undefined;
    
    element.some(function(obj) {
      var all_match = true;
      
      for (var prop in properties) {
        if (!(prop in obj) || obj[prop] !== properties[prop]) {
          all_match = false;
        }
      }
      
      if (all_match) {
        if (multiple) {
          match.push(obj);
        } else {
        match = obj;
        return true;
        }
      }
    });
    
    return match;
  };
  
  var _ = function(element) {
    var u = {
      first: function() {
        return element[0];
      },
      
      last: function() {
        return element[element.length - 1];
      },
      
      without: function() {
        var new_array = [];
        var args = Array.prototype.slice.call(arguments);
        
        element.forEach(function(value) {
          if (args.indexOf(value) === -1) {
            new_array.push(value);
          }
        });
        
        return new_array;
      },
      
      lastIndexOf: function(arg) {
        var index_position = -1;
        
        for (var i = element.length -1; i >= 0; i--) {
          if (element[i] === arg) {
            index_position = i;
            break;
          }
        }
        
        return index_position;
      },
      
      sample: function(qty) {
        var sampled = [];
        var copy = element.slice();
        var get = function() {
          var index = Math.floor(Math.random() * copy.length);
          var element = copy[index];
          
          copy.splice(index, 1);
          return element;
        };
        
        if (!qty) { return get(); }
        while(qty) {
          sampled.push(get());
          qty--;
        }
        
        return sampled;
      },
      
      findWhere: function(properties) {
        return findObjs(element, properties, false);
      },
      
      where: function(properties) {
        return findObjs(element, properties, true);
      },
      
      pluck: function(query) {
        var values = [];
        
        element.forEach(function(obj) {
          if (obj[query]) {
            values.push(obj[query]);
          }
        });
        
        return values;
      },
      
      keys: function() {
        var keys = [];
        
        for (var prop in element) {
          keys.push(prop);
        }
        return keys;
      },
      
      values: function() {
        var values = [];
        
        for (var prop in element) {
          values.push(element[prop]);
        }
        
        return values;
      },
      
      pick: function() {
        var args = [].slice.call(arguments);
        var new_obj = {};
        
        args.forEach(function(prop) {
          if (prop in element) {
            new_obj[prop] = element[prop];
          }
        });
        
        return new_obj;
      },
      
      omit: function() {
        var args = [].slice.call(arguments);
        var new_obj = {};
        
        for (var prop in element) {
          if (args.indexOf(prop) === -1) {
            new_obj[prop] = element[prop];
          }
        }
        return new_obj;
      },
      
      has: function(prop) {
        return {}.hasOwnProperty.call(element, prop);
      }
    };
    
    (["isElement", "isArray", "isObject", "isFunction", "isBoolean", "isString", "isNumber"]).forEach(function(method) {
      u[method] = function() { _[method].call(u, element); };
    });

    return u;
  };
  
  _.range = function(start, stop) {
    var range = [];
    
    if (stop === undefined) {
      stop = start;
      start = 0;
    }
    
    for (var i = start; i < stop; i++) {
      range.push(i);
    }
    
    return range;
  };
  
  _.extend = function() {
    var args = [].slice.call(arguments);
    var old_obj = args.pop();
    var new_obj = args[args.length -1];
    
    for (var prop in old_obj) {
      new_obj[prop] = old_obj[prop];
    }
    
    return args.length === 1 ? new_obj : _.extend.apply(_, args);
  };
  
  _.isElement = function(obj) {
    return obj && obj.nodeType === 1;
  };
  
  _.isArray = Array.isArray || function(obj) {
    return toString.call(obj) === "[object Array]";
  };
  
  _.isObject = function(obj) {
    var type = typeof obj;
    
    return type === "function" || type === "object" && !!obj;
  };
  
  _.isFunction = function(obj) {
    var type = typeof obj;
    
    return type === "function";
  };
  
  (["Boolean", "String", "Number"]).forEach(function(method) {
    _["is" + method] = function(obj) {
      return toString.call(obj) === "[object " + method + "]";
    };
  });
  
  //attach _ variable as a property of the window object
  window._ = _;
})();
