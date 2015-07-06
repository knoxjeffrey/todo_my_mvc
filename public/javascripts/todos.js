// Master app - done frequently with front end frameworks. If application gets imported
// into another larger project with other single page applications then it can easily be renamed.
var TodoApp = {
  $el: $("section"),
  
  $todos: $("#todo-list"),
  
  $footer_info: $("#footer"),
  
	pluralize: function (count, word) {
		return count === 1 ? word : word + 's';
	},
  
  newTodo: function(e) {
    e.preventDefault();
    
    var title = $("#new-todo").val();
    var model, view;
    
    if (!title) { return; } // if the name is empty, we don't want to create a new model on a view

    model = this.Todos.add({
      title: title,
      completed: false
    });
    
    view = new TodoApp.TodoViewConstructor(model);
    view.$el.appendTo(TodoApp.$todos);
    
    $("#new-todo").val("");
    
    TodoApp.renderFooter();
  },
  
  renderFooter: function() {
    footer_template = templates.footer_template;
    
    var todo_count = TodoApp.Todos.models.length;
		var active_todo_count = TodoApp.getActiveTodos().length;
		var template = footer_template({
			activeTodoCount: active_todo_count,
			activeTodoWord: TodoApp.pluralize(active_todo_count, 'item'),
			completedTodos: todo_count - active_todo_count,
		});

    $("#footer").toggle(todo_count > 0).html(template);
    
    active_todo_count === 0 ? $("#toggle-all").prop("checked", true) : $("#toggle-all").removeProp("checked");
    
    this.$el.find("#all").on("click", this.renderAllTodos.bind(this));
    this.$el.find("#active").on("click", this.renderActiveTodos.bind(this));
    this.$el.find("#completed").on("click", this.renderCompletedTodos.bind(this));
    this.$el.find("#clear-completed").on("click", this.clearCompletedTodos.bind(this));
  },
  
  getActiveTodos: function() {
    return TodoApp.Todos.models.filter(function(model) {
      return model.attributes.completed === false;
    });
  },
  
  renderAllTodos: function(e) {
    e.preventDefault(); 
    
    TodoApp.Todos.models.forEach(function(model) {
      model.view.remove();
    });
    
    TodoApp.Todos.models.forEach(function(model) {
      var view = new TodoApp.TodoViewConstructor(model);
      view.$el.appendTo(TodoApp.$todos);
    });
	},
  
  renderActiveTodos: function(e) {
    e.preventDefault(); 
    
    TodoApp.renderAllTodos(e);
    
    var active_models = TodoApp.Todos.models.filter(function(model) {
      return model.attributes.completed === false;
    });
    
    TodoApp.removeSelectedModels(active_models);
	},
  
  renderCompletedTodos: function(e) {
    e.preventDefault(e); 
    
    TodoApp.renderAllTodos(e);
    
    var completed_models = TodoApp.Todos.models.filter(function(model) {
      return model.attributes.completed === true;
    });
    
    TodoApp.removeSelectedModels(completed_models);
	},
  
  clearCompletedTodos: function() {
    TodoApp.Todos.models.filter(function(model) {
      if (model.attributes.completed === true) {
        TodoApp.Todos.remove(model);
      }
    });
    
    TodoApp.renderFooter();
  },
  
  removeSelectedModels: function(selected_models) {
    TodoApp.Todos.models.forEach(function(model) {
      if (selected_models.indexOf(model) === -1) {
        model.view.remove();
      }
    });
  },
  
  edit: function (e) {
		var $input = $(e.target).closest("li").addClass("editing").find(".edit");
		$input.val($input.val()).focus();
	},
  
  editTodo: function(e) {
		var $input = $(e.target).closest("li").addClass("editing").find(".edit");
		$input.val($input.val()).focus();
    
    $input.val($input.val()).on("focusout", TodoApp.removeEdit.bind(TodoApp));
    $input.on("keypress", function(e) {
      if (e.which == 13) {
        TodoApp.removeEdit(e);
      }
    }).bind(TodoApp);
  },
  
  removeEdit: function(e) {
    var $input = ((e.type === "keypress") ? $(e.target) : $(e.currentTarget));
    var $li = $input.closest("li");
    var title = $input.val();
    var id = +$li.attr("data-id");
    var model = TodoApp.Todos.get(id);

    model.set("title", title);
    $li.removeClass("editing");
  },
  
  toggleComplete: function(e) {
    var $li = $(e.target).closest("li");
    var id = +$li.attr("data-id");
    var model = TodoApp.Todos.get(id);

    model.set("completed", !model.get("completed")); // set the complete property to the opposite of what it currently is
    TodoApp.renderFooter();
  },
  
  toggleAllComplete: function(e) { 
    var all_checked = true;
    
    TodoApp.Todos.models.forEach(function(model) {
      if (model.get("completed") !== true) {
        all_checked = false;
      }
    });
    
    if (!all_checked) {
      TodoApp.Todos.models.forEach(function(model) {
        model.set("completed", true);
      });
    }
    
    if (all_checked) {
      TodoApp.Todos.models.forEach(function(model) {
        model.set("completed", false);
      });
    } 
    TodoApp.renderFooter(); 
  },
  
  deleteTodo: function(e) {
    e.preventDefault();
    
    var $li = $(e.target).closest("li");
    var id = +$li.attr("data-id");
    var model = TodoApp.Todos.get(id);

    TodoApp.Todos.remove(model);
    TodoApp.renderFooter();
  },
  
  bind: function() {
    this.$el.find("#new-todo").on("keypress", function(e) {
      if (e.which == 13) {
        this.newTodo(e);
      }
    }.bind(this));
    this.$el.find("#toggle-all").on("click", this.toggleAllComplete.bind(this));
  },
  
  init: function() {
    this.bind();
  }
};

var templates = {};

$("[type='text/x-handlebars-template']").each(function() {
  var $template = $(this);
  // this will give a templates object with our 2 objects on it
  templates[$template.attr("id")] = Handlebars.compile($template.html());
});

// Todo model constructor - used in our todos collection
TodoApp.TodoConstructor = new ModelConstructor();

// Todo collection constructor
TodoApp.TodosConstructor = new CollectionConstructor();

// The todo collection creation
TodoApp.Todos = new TodoApp.TodosConstructor(TodoApp.TodoConstructor);

// Todo view constructor - used to create a new view for each model
TodoApp.TodoViewConstructor = new ViewConstructor({
  //tag_name: "empty",
  template: templates.todo_template,
  events: {
    "dblclick": TodoApp.editTodo,
    "click .toggle": TodoApp.toggleComplete,
    "click .destroy": TodoApp.deleteTodo
  }
});

TodoApp.init();