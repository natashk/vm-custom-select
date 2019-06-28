"use strict";

/*
VMCustomSelect
	IN:
		containerId - <string> id of HTML tag, which will contain the select
		data - <array> array with data (now each row MUST have 2 columns: [value, text])
		options - (optional) <object> additional options:
			initValue - ("" - default value) initial value
			listItemTextTemplate - <string> ("{value} -- {text}" - default value) template, how to show text in list items
				"{value}" and "{text}" can be used and will be replaced with value and text from data array
			onChange - <function> handler to call when component changes value
	OUT: <object>
			{
				...
				value,
				text,
				...
			}

example:
	<div id="my-list" style="width: 10%; max-width: 100px;"></div>
	<script language="javascript">
		var data = [[1,"one"],[2,"two"],[3,"tree"]];
		var list = new VMCustomSelect(
			"my-list",
			data,
			{
				listItemTextTemplate: "{value} -- {text}",
				onChange: function(e) {
					console.log(e.detail.value + " - " + e.detail.text);
				}
			}
		);
		console.log(list.value + " - " + list.text);
	</script>
*/

var VMCustomSelect = function(containerId, data, options) {
	var defaultOptions = {
		initValue: "",
		listItemTextTemplate: "{value} -- {text}",
		onChange: null
	};
	this.options = Object.assign({}, defaultOptions, options);
	this.elContainer = document.getElementById(containerId);
	this.elInput = null;
	this.elListContainer = null;
	this.data = data || [];
	this.blurTimeoutId;
	this.scrollTimeoutId;
	this.initList();
}

VMCustomSelect.prototype.initList = function() {
	var data = this.data;
	var options = this.options;
	var thisList = this;

	var elInput = this.elInput = document.createElement("input");
	elInput.className = "vm-select-input";
	this.elContainer.appendChild(elInput);

	var elListContainer = this.elListContainer = document.createElement("div");
	elListContainer.classList.add("vm-select-list-container");

	var elUl = document.createElement("ul");
	var elLi, liText;
	for(var i = 0, len = data.length; i < len; i++) {
		elLi = document.createElement("li");
		elLi.setAttribute("data-id",data[i][0]);
		elLi.setAttribute("data-text",data[i][1]);
		if (options.initValue === data[i][0]) {
			elLi.classList.add("selected");
		}
		liText = options.listItemTextTemplate.replace("{value}",data[i][0]).replace("{text}",data[i][1]);
		elLi.appendChild(document.createTextNode(liText));
		elLi.addEventListener("click", function(e) {
			e.preventDefault();
			thisList.onListItemClick(this);
		});

		elUl.appendChild(elLi);
	}
	elListContainer.appendChild(elUl);

	this.elContainer.appendChild(elListContainer);


	// event handlers
	elInput.addEventListener("focus", function() {
		thisList.showList();
	});
	elInput.addEventListener("blur", function() {
		thisList.blurTimeoutId = setTimeout((function(){
			var elInput = this.elInput;
			var inputVal = elInput.value;
			if(this.text !== inputVal) {
				this.setValue("",inputVal);
			}
			else {
				this.hideList();
			}
		}).bind(thisList),500);
	});
	elInput.addEventListener("input", function() {
		thisList.filterList();
		var selected = elListContainer.querySelector("li.selected");
		if(selected) selected.classList.remove("selected");
	});
	elUl.addEventListener("scroll", function() {
		clearTimeout(thisList.blurTimeoutId);
		clearTimeout(thisList.scrollTimeoutId);
		thisList.scrollTimeoutId = setTimeout((function(){
			//finished scrolling
			this.elInput.focus();
		}).bind(thisList),500);
	});

	this.evChange = new CustomEvent('vmChange', {
		detail: thisList
	});
	elInput.addEventListener("vmChange", function(e) {
		clearTimeout(thisList.blurTimeoutId);
		clearTimeout(thisList.scrollTimeoutId);
		if(typeof(options.onChange) === "function") options.onChange(e);
		elListContainer.classList.add("hide");
	});
	//elInput.addEventListener("vmChange", options.onChange);

	var selected = elListContainer.querySelector("li.selected");
	if(selected) {
		this.setValue(selected.getAttribute("data-id"), selected.getAttribute("data-text"));
	}
	else {
		this.setValue("","");
	}
	this.hideList();
}

VMCustomSelect.prototype.showList = function() {
	this.elListContainer.classList.remove("hide");
	this.filterList();
}
VMCustomSelect.prototype.hideList = function() {
	this.elListContainer.classList.add("hide");
}

VMCustomSelect.prototype.filterList = function() {
	var val = this.elInput.value.toLowerCase();
	var listItems = this.elListContainer.querySelectorAll("li");
	var li;
	for(var i = 0, len = listItems.length; i < len; i++) {
		li = listItems[i];
		if(li.getAttribute("data-id").toLowerCase().indexOf(val) === -1 && li.getAttribute("data-text").toLowerCase().indexOf(val) === -1) {
			li.classList.add("hide");
		}
		else {
			li.classList.remove("hide");
		}
	}
}

VMCustomSelect.prototype.onListItemClick = function(li) {
	this.setValue(li.getAttribute("data-id"), li.getAttribute("data-text"));
	var selected = this.elListContainer.querySelector("li.selected");
	if(selected) selected.classList.remove("selected");
	li.classList.add("selected");
}

VMCustomSelect.prototype.setValue = function(value, text) {
	this.elInput.value = text;
	this.value = value;
	this.text = text;
	this.elInput.dispatchEvent(this.evChange);
}

VMCustomSelect.prototype.clear = function() {
	this.setValue("","");
	var selected = this.elListContainer.querySelector("li.selected");
	if(selected) selected.classList.remove("selected");
}

VMCustomSelect.prototype.destroy = function() {
	if(!this.elContainer) return;
	clearTimeout(this.blurTimeoutId);
	clearTimeout(this.scrollTimeoutId);
	this.elContainer.innerHTML = "";
	var thisList = this;
	Object.getOwnPropertyNames(thisList).forEach(function (val, idx, array) {
		delete thisList[val];
	});
}



/**************************************/

//Polyfill for Object.assign
if (typeof Object.assign != 'function') {
	// Must be writable: true, enumerable: false, configurable: true
	Object.defineProperty(Object, "assign", {
		value: function assign(target, varArgs) { // .length of function is 2
			'use strict';
			if (target == null) { // TypeError if undefined or null
				throw new TypeError('Cannot convert undefined or null to object');
			}

			var to = Object(target);

			for (var index = 1; index < arguments.length; index++) {
				var nextSource = arguments[index];

				if (nextSource != null) { // Skip over if undefined or null
					for (var nextKey in nextSource) {
						// Avoid bugs when hasOwnProperty is shadowed
						if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
							to[nextKey] = nextSource[nextKey];
						}
					}
				}
			}
			return to;
		},
		writable: true,
		configurable: true
	});
}

// Polyfill for CustomEvent()
(function () {
	if ( typeof window.CustomEvent === "function" ) return false;

	function CustomEvent ( event, params ) {
		params = params || { bubbles: false, cancelable: false, detail: undefined };
		var evt = document.createEvent( 'CustomEvent' );
		evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
		return evt;
	}

	CustomEvent.prototype = window.Event.prototype;
	window.CustomEvent = CustomEvent;
})();
