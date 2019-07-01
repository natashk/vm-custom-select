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
	var thisList = this;
	var options = thisList.options;
	var data = options.data;

	var elInput = thisList.elInput = document.createElement("input");
	elInput.className = "vm-cs-input";
	thisList.elContainer.appendChild(elInput);

	var elListContainer = thisList.elListContainer = document.createElement("div");
	elListContainer.className = "vm-cs-list-container";

	var elList = thisList.elList = document.createElement("ul");
	var elListItem, liText;
	for(var i = 0, len = data.length; i < len; i++) {
		var currValue = data[i][0];
		var currText = data[i][1];
		elListItem = document.createElement("li");
		elListItem.setAttribute("data-id",currValue);
		elListItem.setAttribute("data-text",currText);
		liText = options.listItemTextTemplate.replace("{value}",currValue).replace("{text}",currText);
		elListItem.appendChild(document.createTextNode(liText));
		if (options.initValue === currValue) {
			elListItem.classList.add("vm-cs-selected");
			thisList.value = currValue;
			thisList.text = currText;
			elInput.value = currText;
		}
		elList.appendChild(elListItem);
	}
	elListContainer.appendChild(elList);

	thisList.elContainer.appendChild(elListContainer);
	thisList.elContainer.tabIndex = 0;
}

VMCustomSelect.prototype.initList = function() {
	var thisList = this;
	this.buildGUI();
	var elListContainer = this.elListContainer;
	var elInput = this.elInput;
	thisList.hideList();

	
	// event handlers
	elInput.addEventListener("focus", function() {
console.log("elInput focus");
		thisList.showList();
	});

	elInput.addEventListener("blur", function(e) {
console.log("elInput blur");
		/*
			in IE e.relatedTarget always null, and document.activeElement is focused element
			in FF and Chrome e.relatedTarget is focused element, and document.activeElement is always body element
		*/
		if(e.relatedTarget && e.relatedTarget === thisList.elContainer || document.activeElement === thisList.elContainer) {

		}
		else {
			thisList.value = "";
			thisList.text = thisList.elInput.value;
			thisList.onValueChanged();
		}
	});

	elInput.addEventListener("input", function() {
		thisList.filterList();
		var selected = elListContainer.querySelector("li.vm-cs-selected");
		if(selected) selected.classList.remove("vm-cs-selected");
	});

	var listItems = elListContainer.querySelectorAll("li");
	Array.prototype.forEach.call(listItems, function(elListItem) {
		elListItem.addEventListener("click", function() {
console.log("elListItem click");
			thisList.onListItemClick(this);
		});
	});

	thisList.elList.addEventListener("scroll", function() {
		//finished scrolling
		thisList.elInput.focus();
	});
}

VMCustomSelect.prototype.showList = function() {
	this.elListContainer.classList.remove("vm-cs-hide");
	//this.filterList();
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
	var selected = this.elListContainer.querySelector("li.vm-cs-selected");
	if(selected) selected.classList.remove("vm-cs-selected");
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

/*
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
*/


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
