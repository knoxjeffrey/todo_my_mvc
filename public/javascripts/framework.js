function ModelConstructor(options) {
  
  var id_count = 0;
  
  // passing in attrs allows to set attributes on the model to initialize it
  function Model(attrs) {
    id_count++;
    
    var self = this;
    self.attributes = attrs || {}; // take the attributes if any passed in or use empty model if not
    self.id = id_count;
    // Have the id exposed in attributes object so view template can render out id 
    // of attributes object rather than the object as a whole
    self.attributes.id = id_count; 
    
    // check if options is passed in and if one of those options is change and also that change is a function
    // if true then add change to the events array
    if (options && options.change && _.isFunction(options.change)) {
      this.__events.push(options.change);
    }
  }
  
  Model.prototype = {
    // __ signifies that this should be considered private
    // this is used to store any call backs that we pass in on the events property 
    // of the options object
    __events: [],
    
    // dummy callback for the remove event
    __remove: function() {},
    
    // used to modify the attributes object
    // when we call set we also want to fire all of the change events stored in the events array 
    // by calling triggerChange
    set: function(key, val) {
      this.attributes[key] = val;
      this.triggerChange();
    },
    
    get: function(key) {
      return this.attributes[key];
    },
    
    remove: function(key) {
      delete this.attributes[key];
      this.triggerChange();
    },
    
    triggerChange: function() {
      // for each callback in the events array we will call it
      this.__events.forEach(function(cb) {
        cb();
      });
    },
    
    // want to be able to add more change events after the model is instantiated
    addCallBack: function(cb) {
      this.__events.push(cb);
    }
  };
  
  _.extend(Model.prototype, options);
  
  return Model;
}

function CollectionConstructor(options) {
  
  function Collection(model_constructor) {
    this.models = []; // want to start with an empty collection of models
    this.model = model_constructor;
    
  }
  
  Collection.prototype = {
    
    // add a model to the collection
    add: function(model) {
      // check if the model already exists by checking if the id already exists
      var old_model = _(this.models).findWhere({ id: model.id });
      var new_model;
      
      // if the model already exists then just return it
      if (old_model) { return old_model; }
      
      new_model = new this.model(model); //create the new model
      this.models.push(new_model); // then add it to the collection
      
      return new_model;
    },
    
    get: function(id) {
      return _(this.models).findWhere({ id: id });
    },
    
    remove: function(model) {
      // this method allows us to pass in a model id or an actual model
      // first we check which one it is to find the model 
      model = _.isNumber(model) ? { id: model } : model;
      
      // find the model in the collection array
      var m = _(this.models).findWhere(model);
      
      // just return if it can't be found
      if (!m) { return; }
      
      // call the models remove event. By default thsi won't do anything if there is no view attached
      // to the model
      m.__remove();
      
      // take the current models collection and return a new one without the model that has been found
      // note that attributes.id was defined in the Model constructor
      this.models = this.models.filter(function(existing_m) {
        return existing_m.attributes.id !== m.id;
      });
    },
    
    // can receive a collection of models. Clears any existing models from the collection array
    // then adds in the new collection of models
    set: function(models) {
      this.reset();
      models.forEach(this.add.bind(this));
    },
    
    reset: function() {
      this.models = [];
    }
  };
  
  _.extend(Collection.prototype, options);
  
  return Collection;
}

function ViewConstructor(options) {
  
  function View(model) {
    this.model = model;
    // addCallback on the model is called every time the properties on the model are changed or removed. We can bind 
    // render to this automatically when a view is created
    this.model.addCallBack(this.render.bind(this));
    // in this case there is a view attached to the model so this makes sure that the view gets removed if the model
    // gets removed
    this.model.__remove = this.remove.bind(this);
    this.model.view = this; // adds a pointer on the model pointing back to the view object
    this.attributes["data-id"] = this.model.id;
    this.$el = $("<" + this.tag_name + " />", this.attributes); // create the parent element and pass in any attributes
    this.render();  // call render after all the initial setup

  }
  
  View.prototype = {
    // the tag type used to create the parent html element for the view. div is the default
    tag_name: "div",
    
    attributes: {},
    
    // we have a blank template function so we don't have to see if the template function
    // is instantiated. We can simply call and know there is either a blank function or custom function
    // passed into the constructor
    template: function() {},
    
    // empty by default.  Different event handlers, such as click can be passed in
    events: {},
    
    // take the current element and replace the html with current template, rendered using the model
    // with the attributes passed in. Then bind the events.
    // return the current element so that if we call render outside of the constructor we can chain
    // any jQuery methods off it
    render: function() {
      this.unbindEvents();
      this.$el.html(this.template(this.model.attributes));
      this.bindEvents();
    },
    
    bindEvents: function() {
      var $el = this.$el; // cache current view element
      var event, selector, parts;
      
      // iterate over events object. The properties will include the event and/or selector
      for (var prop in this.events) {
        parts = prop.split(" "); // split the properties up into their seperate components
        // if just 1 property after split then selector is undefined.  Otherwise join everything after
        // the first entry in the split array (separated by a space) to make up the selector
        selector = parts.length > 1 ? parts.slice(1).join(" ") : undefined;

        event = parts[0];
        
        if (selector) {
          // for the current element, bind the callback function to it for an event suchas click on a
          // particular selector. Note the .view namespace - see unbindEvents
          $el.on(event + ".view", selector, this.events[prop].bind(this));
        } else {
          // same as above but doesn't need to be on a selector
          $el.on(event + ".view", this.events[prop].bind(this));
        }
      }
    },
    
    // only unbind the events we bound using this view constructor. Therefore we use the .view namespace
    unbindEvents: function() {
      this.$el.off(".view");
    },
    
    // unbind any events, then take the parent element and remove
    remove: function() {
      this.unbindEvents();
      this.$el.remove();
    }
  };
  
  _.extend(View.prototype, options);
  
  return View;
}