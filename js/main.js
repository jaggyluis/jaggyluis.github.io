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
		this.setProjects();

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

			//DOMelement.classList.add('outlined-left');

			DOMelement.appendChild(header);	
			DOMelement.appendChild(content);

			
			content.classList.add('hidden');
			content.classList.add('nav-item-content');

			
			navItem.content.forEach(function(contentItem) {
				var item = document.createElement('div');
				item.classList.add('nav-item-content-el')
				item.classList.add('outlined-left');
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
	},
	main.setProjects = function() {

		var DOMelement = document.getElementById("canvas-featured");
		var width = document.width;
		var cols = [];

		for (var i=0; i<3; i++){
			var col = document.createElement('div');
			col.classList.add("canvas-featured-col");
			cols.push(col);
		};

		for (var i=0; i<this.projects().length; i++){
			var project = document.createElement('div');
			var img = document.createElement('div');
			var title = document.createElement('div')

			project.classList.add('canvas-featured-el')
			project.classList.add('outlined-bottom');
			if (Math.random() > 0.5) {
				project.classList.add('outlined-right');
			} else {
				project.classList.add('outlined-left');
			}
			img.innerHTML = '<img src="' + this.projects()[i].url + '/splash.jpg" >';
			title.innerHTML = this.projects()[i].name;
			img.classList.add("featured-img");
			img.classList.add('collapsed');
			title.classList.add('featured-title')

			project.appendChild(img);
			project.appendChild(title);

			project.addEventListener('mouseenter', (function(){
				this.classList.remove("collapsed");
			}).bind(img));
			project.addEventListener('mouseleave', (function(){
				this.classList.add("collapsed");
			}).bind(img));


			cols[i%3].appendChild(project);
		}
		cols.forEach(function(col) {
			DOMelement.appendChild(col);
		})
	}

	main.init();

})();