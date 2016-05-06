/*global main */
var main = main || {};

(function() {
	'use strict';

	main.init = function() {

		this.title = 'luis michel jaggy'
		this.headerItems = ko.observableArray(headerItems);
		this.navItems = ko.observableArray(navItems);
		this.projects = ko.observableArray();

		ko.applyBindings(main);

		this.setNavItems();
		this.setNumLines();
	},
	main.getTitle = function() {
		return this.title.split(' ');
	},
	main.setNavItems = function() {
		/*
		 * TODO	- move a lot of this into knockout
		 * 		- split out functionality for reuse
		 */
		for (var i=0; i<this.navItems().length; i++){

			var navItem = this.navItems()[i];
			var DOMelement = document.getElementById(navItem.name);

			var header = document.createElement('div');
			var content = document.createElement('div');
			var showContent = document.createElement('div');
			var title = document.createElement('div');

			var self = this;

			showContent.classList.add('nav-item-content-show');
			showContent.innerText = '{...}';

			title.innerHTML = "+ " + navItem.name + '()';
			title.classList.add('nav-item-content-title');

			header.appendChild(title);
			header.appendChild(showContent);
			header.classList.add('nav-item-header');
			header.addEventListener('click', function() {
				this.classList.toggle('open');
				if (this.classList.contains('open')){
					this.firstChild.innerText = this.firstChild.innerText.replace('+', '-');
				} else {
					this.firstChild.innerText = this.firstChild.innerText.replace('-', '+');
				}
				this.nextSibling.classList.toggle('hidden');
				this.children[1].classList.toggle('hidden');
			});

			DOMelement.appendChild(header);	
			DOMelement.appendChild(content);
			
			content.classList.add('hidden');
			content.classList.add('nav-item-content');
			content.classList.add('outlined-left');
			
			navItem.content.forEach(function(contentItem) {
				var item = document.createElement('div');
				item.classList.add('nav-item-content-el')
				item.id = contentItem.name;
				item.innerHTML = "_"+contentItem.name.replace(/ /g, '.');
				content.appendChild(item);
				self.projects().push(contentItem);
			});

			if (content.innerHTML) {
				content.innerHTML = '{'+ content.innerHTML+ '}'	;
			} else {
				content.innerHTML = '{<br><div class="nav-item-content-el">//coming soon</div>}';
			}
		}
		main.setNumLines = function() {
			var num = document.getElementById('num'),
		    	nl = 30;
		    for (var i = 0; i < nl; i++) {
		    	var  numDiv = document.createElement("div");
		    	numDiv.classList.toggle('num-div');
		    	numDiv.innerText = i;
		    	num.appendChild(numDiv);
		    }
		}
			
	},
	main.init();

})();