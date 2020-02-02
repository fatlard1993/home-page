// includes dom js-util log socket-client menu dialog sortablejs relevancy color-picker
// babel
/* global dom util log socketClient menu dialog Sortable relevancy colorPicker */

const homePage = {
	websiteRegex: /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/,
	init: function(){
		var content = dom.getElemById('content');

		homePage.searchBar = dom.createElem('input', dom.basicTextElem({ id: 'search', placeholder: 'Search', appendTo: content }));
		homePage.linkContainer = dom.createElem('div', { className: 'linkContainer', appendTo: content });

		homePage.searchBar.onblur = () => { homePage.searchBar.placeholder = 'Search (Press / to focus)';	};
		homePage.searchBar.onfocus = () => { homePage.searchBar.placeholder = 'Search';	};

		Sortable.create(homePage.linkContainer, {
			animation: 200,
			onSort: function(evt){
				log()('drag sort', evt);

				if(homePage.searchBar.value) return;

				socketClient.reply('updateOrder', util.adjustArr(homePage.bookmarks.__sortOrder, evt.oldIndex, evt.newIndex));
			}
		});

		menu.init({
			main: ['Add Bookmark:~:default'],
			single: ['Edit', 'Delete']
		}, { discardDirection: 'static' });

		menu.on('selection', homePage.menuSelection);

		socketClient.init();

		socketClient.on('bookmarks', homePage.updateBookmarks);

		socketClient.on('search', function(search){//todo load in search results separately (for slow internet)
			log()('search', search.suggestions);

			dom.remove(document.getElementsByClassName('link'));

			var relativeOrder = relevancy.sort(homePage.bookmarks.__sortOrder, search.keyword).slice(0, 5).concat(relevancy.sort(homePage.history, search.keyword).slice(0, 5), relevancy.sort(search.suggestions, search.keyword).slice(0, 5));

			log()('search', search.keyword, relativeOrder);

			for(var x = 0, count = relativeOrder.length, bookmark, link; x < count; ++x){
				bookmark = homePage.bookmarks[relativeOrder[x]];
				link = homePage.createLink(relativeOrder[x], bookmark ? bookmark.url : `http://google.com/search?q=${relativeOrder[x]}`, bookmark ? bookmark.color : 'hsl(209, 55%, 45%)');

				if(search.suggestions.includes(relativeOrder[x])) link.classList.add('search');
				else if(homePage.history.includes(relativeOrder[x])) link.classList.add('history');
				else link.classList.add('bookmark');

				homePage.linkContainer.appendChild(link);
			}
		});

		dom.interact.on('pointerDown', (evt) => {
			if(evt.target.parentElement && evt.target.parentElement.parentElement && evt.target.parentElement.parentElement === dom.colorPickerDialog) homePage.usingColorPicker = true;
		});

		dom.interact.on('pointerUp', homePage.pointerUp);

		dom.interact.on('keyUp', homePage.keyUp);

		homePage.loadHistory();

		setTimeout(() => { homePage.searchBar.focus(); }, 500);
	},
	keyUp: function(evt){
		var selectedLink = document.getElementsByClassName('link selected')[0];

		if({ 'UP': 1, 'DOWN': 1, 'LEFT': 1, 'RIGHT': 1 }[evt.keyPressed]){
			log()('link nav', evt.keyPressed, selectedLink);

			if(selectedLink) selectedLink.classList.remove('selected');

			if(homePage.linkContainer.children.length){
				if({ 'UP': 1, 'LEFT': 1 }[evt.keyPressed]){
					if(!selectedLink) homePage.linkContainer.children[homePage.linkContainer.children.length - 1].classList.add('selected');

					else if(selectedLink.previousElementSibling) selectedLink.previousElementSibling.classList.add('selected');
				}

				else if({ 'DOWN': 1, 'RIGHT': 1 }[evt.keyPressed]){
					if(!selectedLink) homePage.linkContainer.children[0].classList.add('selected');

					else if(selectedLink.nextElementSibling) selectedLink.nextElementSibling.classList.add('selected');
				}
			}
		}

		else if(evt.keyPressed === 'ENTER' && selectedLink) return homePage[homePage.websiteRegex.test(selectedLink.href) ? 'goToWebsite' : 'google'](selectedLink.href);

		else if(evt.target === homePage.searchBar){
			log()('search keyup', evt);

			var keyword = homePage.searchBar.value;

			if(evt.keyPressed === 'ENTER' && keyword.length) return homePage[homePage.websiteRegex.test(keyword) ? 'goToWebsite' : 'google'](keyword);

			if(!keyword.length) return homePage.updateBookmarks(homePage.bookmarks);

			homePage.search(keyword);
		}

		else if(evt.keyPressed === 'SLASH' && document.activeElement !== homePage.searchBar) homePage.searchBar.focus();
	},
	pointerUp: function(evt){
		if(evt.which === 3){
			evt.preventDefault();

			if(evt.target.className === 'link'){
				homePage.targetedLink = evt.target;

				menu.open('single');
			}

			else{
				homePage.clickTarget = evt.target;

				delete homePage.targetedLink;

				menu.open('main');
			}

			return menu.drawAtCursor(evt);
		}

		if(!evt.target.parentElement || evt.target.parentElement.id !== 'menu') menu.close();
	},
	menuSelection: function(evt){
		if(evt.item === 'Add Bookmark') homePage.addBookmark();

		else if(evt.item === 'Edit') homePage.editBookmark();

		else if(evt.item === 'Delete') homePage.deleteBookmark();

		menu.close();
	},
	createLink: function(name, url, color){
		if(!homePage.websiteRegex.test(url)) url = `http://google.com/search?q=${url}`;

		return dom.createElem('a', { className: 'link', textContent: name, href: url, style: { backgroundColor: color } });
	},
	updateBookmarks: function(bookmarks){
		homePage.bookmarks = bookmarks;

		dom.empty(homePage.linkContainer);

		for(var x = 0, count = homePage.bookmarks.__sortOrder.length, bookmark; x < count; ++x){
			bookmark = bookmarks[homePage.bookmarks.__sortOrder[x]];

			homePage.linkContainer.appendChild(homePage.createLink(homePage.bookmarks.__sortOrder[x], bookmark.url, bookmark.color));
		}
	},
	loadHistory: function(){
		try{
			homePage.history = JSON.parse(dom.storage.get('history')) || [];
		}
		catch(err){
			log.warn()('Could not parse history', err);

			homePage.history = [];
		}
	},
	clearHistory: function(){ dom.storage.delete('history'); },
	search: function(keyword){
		if(homePage.lastSearch === keyword) return;

		homePage.lastSearch = keyword;

		socketClient.reply('getSearchSuggestions', keyword);
	},
	google: function(keyword){
		homePage.goToWebsite(`http://google.com/search?q=${keyword}`);
	},
	goToWebsite: function(website){
		homePage.history.push(website);

		dom.storage.set('history', JSON.stringify(homePage.history));

		if(!/http:\/\/|https:\/\//.test(website)) website = `http://${website}`;

		location.href = website;
	},
	addBookmark: function(){
		dialog.form('Add Bookmark', { name: '$required$', url: '$required$', color: 'hsl(209, 55%, 45%)' }, 2, function(choice, changes){
			if(choice !== 'OK') return;

			socketClient.reply('addBookmark', changes);
		});
	},
	editBookmark: function(){
		if(!homePage.targetedLink) return log.error()('No targeted link to edit');

		var old = { name: homePage.targetedLink.textContent, url: homePage.targetedLink.href, color: homePage.bookmarks[homePage.targetedLink.textContent].color };

		dialog.form('Edit Bookmark', old, 2, function(choice, changes){
			if(choice !== 'OK') return;

			socketClient.reply('editBookmark', { old: homePage.targetedLink.textContent, new: changes });

			delete homePage.targetedLink;
		});
	},
	deleteBookmark: function(){
		if(!homePage.targetedLink) return log.error()('No targeted link to delete');

		dialog('warning deleteBookmark', 'Warning', 'You are about to delete this bookmark, do you wish to continue?', 'yes|no');

		dialog.resolve.deleteBookmark = function(choice){
			if(choice !== 'yes') return;

			socketClient.reply('deleteBookmark', homePage.targetedLink.textContent);

			delete homePage.targetedLink;
		};
	}
};

document.oncontextmenu = (evt) => {	evt.preventDefault(); };

dom.onLoad(homePage.init);