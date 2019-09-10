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
				onChange: function(params) {
					console.log(params.value + " - " + params.text);
				}
		});
		console.log(list.value + " - " + list.text);
		list.setValue(3);
		console.log(list.value + " - " + list.text);
		list.setValue({"value":"", "text":"new text"});
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
	this.value = "";
	this.text = "";
	this.elInput = null;
	this.elListContainer = null;
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

	var elInput = this.elInput = document.createElement("input");
	elInput.className = "vm-cs-input";
	this.elContainer.appendChild(elInput);

	var elListContainer = this.elListContainer = document.createElement("div");
	elListContainer.className = "vm-cs-list-container";

	var elList = this.elList = document.createElement("ul");
	var elListItem, liText;
	for(var i = 0, len = data.length; i < len; i++) {
		var currValue = data[i][0];
		var currText = data[i][1];
		elListItem = document.createElement("li");
		elListItem.classList.add("vm-cs-list-item");
		elListItem.setAttribute("data-id",currValue);
		elListItem.setAttribute("data-text",currText);
		liText = options.listItemTextTemplate.replace("{value}",currValue).replace("{text}",currText);
		elListItem.appendChild(document.createTextNode(liText));
		if (options.initValue === currValue) {
			elListItem.classList.add("vm-cs-selected");
			this.value = currValue;
			this.text = currText;
			elInput.value = currText;
		}
		elListItem.tabIndex = 0;
		elList.appendChild(elListItem);
	}
	elListContainer.appendChild(elList);
	elListContainer.tabIndex = 0;

	this.elContainer.appendChild(elListContainer);
}

VMCustomSelect.prototype.initList = function() {
	this.buildGUI();
	this.hideList();
	
	// event handlers
	var elInput = this.elInput;
	elInput.addEventListener("click", this.onInputClick.bind(this));
	elInput.addEventListener("blur", this.onInputBlur.bind(this));
	elInput.addEventListener("input", this.onInputInput.bind(this));
	elInput.addEventListener("keydown", this.onInputKeydown.bind(this));
	this.elList.addEventListener("scroll", this.onListScroll.bind(this));

	var thisList = this;
	var listItems = this.elListContainer.querySelectorAll("li");
	Array.prototype.forEach.call(listItems, function(elListItem) {
		elListItem.addEventListener("click", thisList.onListItemClick.bind(thisList));
	});
}

VMCustomSelect.prototype.showList = function() {
	this.elListContainer.classList.remove("vm-cs-hide");
	this.filterList();
}
VMCustomSelect.prototype.hideList = function() {
	this.elListContainer.classList.add("vm-cs-hide");
}
VMCustomSelect.prototype.toggleList = function() {
	if(this.elListContainer.classList.contains("vm-cs-hide")) {
		this.showList();
	}
	else {
		this.hideList();
	}
}

VMCustomSelect.prototype.deselectAll = function() {
	var selected = this.elListContainer.querySelector("li.vm-cs-selected");
	if(selected) selected.classList.remove("vm-cs-selected");
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

VMCustomSelect.prototype.onInputClick = function() {
	this.toggleList();
}

VMCustomSelect.prototype.onInputBlur = function(e) {
	/*
		in IE e.relatedTarget always null, and document.activeElement is focused element
		in FF and Chrome e.relatedTarget is focused element, and document.activeElement is always body element
	*/
	var focusedElement = e.relatedTarget || document.activeElement;
	if(focusedElement.className === "vm-cs-list-item") return;
	if(focusedElement === this.elListContainer) {
		this.elInput.focus();
		if(document.activeElement !== this.elInput) {
			/*
				For FF only because of bug https://bugzilla.mozilla.org/show_bug.cgi?id=53579
				focus doesn't move into input inside of onblur event.
				So try to do it out of the event (in timeout).
			*/
			setTimeout((function() { this.elInput.focus(); }).bind(this), 0);
		}
	}
	else {
		this.onValueChanged();
	}
}

VMCustomSelect.prototype.onInputInput = function() {
	this.value = "";
	this.text = this.elInput.value;
	this.showList();
	this.deselectAll();
	this.filterList();
}

VMCustomSelect.prototype.onInputKeydown = function(e) {
	switch(e.key) {
		case "Enter":
			this.elInput.blur();
			break;
		case "Tab":
			this.hideList();
			break;
		}
}

VMCustomSelect.prototype.onListScroll = function() {
	//finished scrolling
	this.elInput.focus();
}

VMCustomSelect.prototype.onListItemClick = function(e) {
	e.stopPropagation();
	var li = e.currentTarget;
	this.deselectAll();
	li.classList.add("vm-cs-selected");
	this.value = li.getAttribute("data-id");
	this.text = this.elInput.value = li.getAttribute("data-text");
	this.onValueChanged();
}

VMCustomSelect.prototype.onValueChanged = function() {
	var options = this.options;
	if(typeof(options.onChange) === "function") {
		options.onChange({
			value: this.value,
			text: this.text
		});
	}
	this.hideList();
}

VMCustomSelect.prototype.setValue = function(newSelectValue) {
	var newValue, newText;
	if(typeof(newSelectValue) === "object") {
		newValue = newSelectValue["value"];
		newText = newSelectValue["text"];
console.log("object");
	}
	else {
		newValue = newSelectValue;
console.log("just value");
	}

	if(newValue) {
		var listItems = this.elListContainer.querySelectorAll("li");
		var li;
		for(var i = 0, len = listItems.length; i < len; i++) {
			li = listItems[i];
			if(li.getAttribute("data-id").indexOf(newSelectValue) !== -1) {
				this.value = newSelectValue;
				this.text = this.elInput.value = li.getAttribute("data-text");
				this.deselectAll();
				li.classList.add("vm-cs-selected");
				return true;
			}
		}
	}
	else {
		if(!newText) newText = "";
		this.value = "";
		this.text = this.elInput.value = newText;
		this.deselectAll();
		return true;
	}
	return false;
}

VMCustomSelect.prototype.destroy = function() {
	if(!this.elContainer) return;

	// remove event handlers
	var elInput = this.elInput;
	elInput.removeEventListener("click", this.onInputClick);
	elInput.removeEventListener("blur", this.onInputBlur);
	elInput.removeEventListener("input", this.onInputInput);
	elInput.removeEventListener("keydown", this.onInputKeydown);
	this.elList.removeEventListener("scroll", this.onListScroll);

	var thisList = this;
	var listItems = this.elListContainer.querySelectorAll("li");
	Array.prototype.forEach.call(listItems, function(elListItem) {
		elListItem.removeEventListener("click", thisList.onListItemClick);
	});

	this.elContainer.innerHTML = "";
}


/**************************************/

//Polyfill for Object.assign (source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
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
