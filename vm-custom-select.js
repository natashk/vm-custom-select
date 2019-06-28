"use strict";

/*
VMCustomSelect
	IN:
		csOptions - <object>:
			targetId - <string> id of HTML tag, which will contain the select
			data - [optional] <array> array of arrays with data in format: [[value1, text1], [value2, text2], ...])
				(default: [])
			initValue - [optional] initial value
				(default: "")
			listItemTextTemplate - [optional] <string>; template, how to show text in list items
				"{value}" and "{text}" can be used and will be replaced with value and text from data array
				(default: "{value} -- {text}")
			onChange - [optional] <function>; handler to call when component changes value
	OUT: <object>
			{
				...
				value,
				text,
				...
			}

example:
	<div id="my-list" style="width: 100px;"></div>
	<script language="javascript">
		var list = new VMCustomSelect({
				containerId: "my-list",
				data: [[1,"one"],[2,"two"],[3,"tree"]],
				listItemTextTemplate: "{value} -- {text}",
				onChange: function(e) {
					console.log(e.detail.value + " - " + e.detail.text);
				}
		});
		console.log(list.value + " - " + list.text);
	</script>
*/

var VMCustomSelect = function(csOptions) {
	if(typeof(csOptions) !== "object" || csOptions.containerId === undefined) {
		console.log("VMCustomSelect: Required parameters not provided.");
		return;
	}
	this.elContainer = document.getElementById(csOptions.containerId);
	if(!this.elContainer) {
		console.log("VMCustomSelect: No HTML element with id = \"" + csOptions.containerId + "\".");
		return;
	}
	this.elInput = null;
	this.elListContainer = null;
	this.blurTimeoutId;
	this.scrollTimeoutId;
	var defaultOptions = {
		data: [],
		initValue: "",
		listItemTextTemplate: "{value} -- {text}",
		onChange: null
	};
	this.options = Object.assign({}, defaultOptions, csOptions);
	this.initList();
}

VMCustomSelect.prototype.buildGUI = function() {
	var options = this.options;
	var data = options.data;
	var thisList = this;

	var elInput = this.elInput = document.createElement("input");
	elInput.className = "vm-cs-input";
	this.elContainer.appendChild(elInput);

	var elListContainer = this.elListContainer = document.createElement("div");
	elListContainer.className = "vm-cs-list-container";

	var elList = this.elList = document.createElement("ul");
	var elListItem, liText;
	for(var i = 0, len = data.length; i < len; i++) {
		elListItem = document.createElement("li");
		elListItem.setAttribute("data-id",data[i][0]);
		elListItem.setAttribute("data-text",data[i][1]);
		if (options.initValue === data[i][0]) {
			elListItem.classList.add("vm-cs-selected");
		}
		liText = options.listItemTextTemplate.replace("{value}",data[i][0]).replace("{text}",data[i][1]);
		elListItem.appendChild(document.createTextNode(liText));
		elListItem.addEventListener("click", function(e) {
			e.preventDefault();
			thisList.onListItemClick(this);
		});

		elList.appendChild(elListItem);
	}
	elListContainer.appendChild(elList);

	this.elContainer.appendChild(elListContainer);
}

VMCustomSelect.prototype.initList = function() {
	var options = this.options;
	var thisList = this;
	this.buildGUI();
	var elListContainer = this.elListContainer;
	var elInput = this.elInput;
	var elList = this.elList;

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
		var selected = elListContainer.querySelector("li.vm-cs-selected");
		if(selected) selected.classList.remove("vm-cs-selected");
	});
	elList.addEventListener("scroll", function() {
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
		elListContainer.classList.add("vm-cs-hide");
	});
	//elInput.addEventListener("vmChange", options.onChange);

	var selected = elListContainer.querySelector("li.vm-cs-selected");
	if(selected) {
		this.setValue(selected.getAttribute("data-id"), selected.getAttribute("data-text"));
	}
	else {
		this.setValue("","");
	}
	this.hideList();
}

VMCustomSelect.prototype.showList = function() {
	this.elListContainer.classList.remove("vm-cs-hide");
	this.filterList();
}
VMCustomSelect.prototype.hideList = function() {
	this.elListContainer.classList.add("vm-cs-hide");
}

VMCustomSelect.prototype.filterList = function() {
	var val = this.elInput.value.toLowerCase();
	var listItems = this.elListContainer.querySelectorAll("li");
	var li;
	for(var i = 0, len = listItems.length; i < len; i++) {
		li = listItems[i];
		if(li.getAttribute("data-id").toLowerCase().indexOf(val) === -1 && li.getAttribute("data-text").toLowerCase().indexOf(val) === -1) {
			li.classList.add("vm-cs-hide");
		}
		else {
			li.classList.remove("vm-cs-hide");
		}
	}
}

VMCustomSelect.prototype.onListItemClick = function(li) {
	this.setValue(li.getAttribute("data-id"), li.getAttribute("data-text"));
	var selected = this.elListContainer.querySelector("li.vm-cs-selected");
	if(selected) selected.classList.remove("vm-cs-selected");
	li.classList.add("vm-cs-selected");
}

VMCustomSelect.prototype.setValue = function(value, text) {
	this.elInput.value = text;
	this.value = value;
	this.text = text;
	this.elInput.dispatchEvent(this.evChange);
}

VMCustomSelect.prototype.clear = function() {
	this.setValue("","");
	var selected = this.elListContainer.querySelector("li.vm-cs-selected");
	if(selected) selected.classList.remove("vm-cs-selected");
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
