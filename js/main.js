/*global main */
var main = main || {};

(function() {
	'use strict';

	main.init = function() {

		this.title = 'luis michel jaggy'
		this.footerItems = ko.observableArray(footerItems);
		this.navItems = ko.observableArray(navItems);
		this.projects = ko.observableArray();

		ko.applyBindings(main);

		this.setNavItems();
		console.log(this.projects());

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

			var self = this;


			header.innerHTML = this.getNavItemName(navItem);
			header.classList.add('nav-item-header');
			header.addEventListener('click', function() {
				this.classList.toggle('open');
				if (this.classList.contains('open')){
					this.innerText = this.innerText.replace('+', '-');
				} else {
					this.innerText = this.innerText.replace('-', '+');
				}
				this.nextSibling.classList.toggle('hidden');
			});
		
			
			if (Math.random()  < 0.5 ) {
				//DOMelement.classList.add('outlined-right');
				DOMelement.classList.add('outlined-left');
			} else {
				DOMelement.classList.add('outlined-left');
			}

			DOMelement.appendChild(header);	
			DOMelement.appendChild(content);

			
			content.classList.add('hidden');
			content.classList.add('nav-item-content');

			
			navItem.content.forEach(function(contentItem) {
				var item = document.createElement('div');
				item.classList.add('nav-item-content-el')
				//item.classList.add('outlined-top')
				//item.classList.add('outlined-right')
				if (Math.random()  < 0.5 ) {
					//item.classList.add('outlined-right');
					item.classList.add('outlined-left');
				} else {
					item.classList.add('outlined-left');
				}
				item.id = contentItem.name;
				item.innerHTML = contentItem.name;
				content.appendChild(item);

				self.projects().push(contentItem);
			});			
		}
			
	},
	main.getNavItemName = function(navItem) {
		if (navItem.content.length > 0) { return navItem.name + ' +'; }
		else{ return navItem.name; }
	};

	main.init();

})();