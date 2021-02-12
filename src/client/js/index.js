import Log from 'log';
import util from 'js-util';
import dom from 'dom';
import menu from 'menu';
import dialog from 'dialog';
import relevancy from 'relevancy';
import Sortable from 'sortablejs';
import socketClient from 'socket-client';
import 'color-picker';

const log = new Log({ verbosity: parseInt(dom.storage.get('logVerbosity') || 0) });

const homePage = {
	websiteRegex: /^(https?:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/,
	ipRegex: /^(https?:\/\/)?(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(:[0-9]{1,5})?(\/.*)?$/,
	localhostRegex: /^(https?:\/\/)?localhost(:[0-9]{1,5})?(\/.*)?$/,
	init: function(){
		const content = dom.getElemById('content');

		dom.onPointerPress(content, homePage.pointerPress);

		homePage.searchBar = dom.createElem('input', dom.basicTextElem({ id: 'search', placeholder: 'Search', appendTo: content }));
		homePage.linkContainer = dom.createElem('div', { className: 'linkContainer', appendTo: content, onPointerPress: homePage.pointerPress });

		homePage.searchBar.onblur = () => { homePage.searchBar.placeholder = 'Search (Press / to focus)';	};
		homePage.searchBar.onfocus = () => {
			if(menu.isOpen) menu.close();

			homePage.searchBar.placeholder = 'Search';
		};

		Sortable.create(homePage.linkContainer, {
			animation: 200,
			onSort: (evt) => {
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

		socketClient.on('search', (search) => {
			dom.empty(homePage.linkContainer);

			const suggestions = search.suggestions.slice(0, 5);
			const relativeOrder = relevancy.sort(homePage.bookmarks.__sortOrder, search.keyword).slice(0, 1).concat(relevancy.sort(suggestions.concat(homePage.history)).slice(0, 5));

			log(1)('search', search.keyword, relativeOrder);

			for(let x = 0, count = relativeOrder.length, bookmark, link; x < count; ++x){
				bookmark = homePage.bookmarks[relativeOrder[x]];
				link = homePage.createLink(relativeOrder[x], bookmark ? bookmark.url : `http://google.com/search?q=${relativeOrder[x]}`, bookmark ? bookmark.color : 'hsl(209, 55%, 45%)');

				if(bookmark) link.classList.add('bookmark');
				else if(homePage.history.includes(relativeOrder[x])) link.classList.add('history');
				else link.classList.add('search');

				homePage.linkContainer.appendChild(link);
			}
		});

		dom.interact.on('pointerDown', (evt) => {
			if(evt.target.parentElement && evt.target.parentElement.parentElement && evt.target.parentElement.parentElement === dom.colorPickerDialog) homePage.usingColorPicker = true;
		});

		dom.interact.on('keyUp', homePage.keyUp);

		homePage.loadHistory();

		setTimeout(() => { homePage.searchBar.focus(); }, 500);

		log.info()('Loaded');
	},
	pointerPress: function(evt){
		log()(evt);

		if(evt.which === 3){
			delete homePage.targetedLink;

			menu.open('main');

			menu.drawAtCursor(evt);
		}

		else menu.close();
	},
	keyUp: function({ target, keyPressed }){
		const selectedLink = document.getElementsByClassName('link selected')[0];

		if({ 'UP': 1, 'DOWN': 1, 'LEFT': 1, 'RIGHT': 1 }[keyPressed]){
			log()('link nav', keyPressed, selectedLink);

			if(document.activeElement) document.activeElement.blur();

			if(selectedLink) selectedLink.classList.remove('selected');

			if(homePage.linkContainer.children.length){
				if({ 'UP': 1, 'LEFT': 1 }[keyPressed]){
					if(!selectedLink) homePage.linkContainer.children[homePage.linkContainer.children.length - 1].classList.add('selected');

					else if(selectedLink.previousElementSibling) selectedLink.previousElementSibling.classList.add('selected');
				}

				else if({ 'DOWN': 1, 'RIGHT': 1 }[keyPressed]){
					if(!selectedLink) homePage.linkContainer.children[0].classList.add('selected');

					else if(selectedLink.nextElementSibling) selectedLink.nextElementSibling.classList.add('selected');
				}
			}
		}

		else if(keyPressed === 'ENTER' && selectedLink) homePage.goTo(selectedLink.href);

		else if(keyPressed === 'ESCAPE' && menu.isOpen) menu.close();

		else if(target === homePage.searchBar){
			log()('Search keyup', keyPressed);

			const keyword = homePage.searchBar.value;

			if(keyPressed === 'ENTER' && keyword.length) homePage.goTo(keyword);

			if(!keyword.length) return homePage.updateBookmarks(homePage.bookmarks);

			homePage.search(keyword);
		}

		else if(keyPressed === 'SLASH' && document.activeElement !== homePage.searchBar && !dialog.active) homePage.searchBar.focus();
	},
	menuSelection: function({ item }){
		if(item === 'Add Bookmark') homePage.addBookmark();

		else if(item === 'Edit') homePage.editBookmark();

		else if(item === 'Delete') homePage.deleteBookmark();

		menu.close();
	},
	goTo: function(name, newTab){
		const cleanName = homePage.fixLink(name).replace('http://google.com/search?q=', '');

		if(!homePage.history.includes(cleanName) && !	homePage.bookmarks.__links.includes(cleanName)){
			homePage.history.push(cleanName);

			dom.storage.set('history', JSON.stringify(homePage.history));
		}

		name = homePage.fixLink(name);

		if(newTab) window.open(name, '_blank');
		else location.href = name;
	},
	fixLink: function(url){
		if(homePage.websiteRegex.test(url) || homePage.ipRegex.test(url) || homePage.localhostRegex.test(url)){
			if(!/http:\/\/|https:\/\//.test(url)) url = `http://${url}`;
		}

		else url = `http://google.com/search?q=${url}`;

		return url;
	},
	createLink: function(name, url, color){
		if(url.startsWith('http://google') && homePage.websiteRegex.test(name)) url = name;

		url = homePage.fixLink(url);

		return dom.createElem('span', {
			className: 'link',
			title: name,
			textContent: name,
			href: url,
			style: { backgroundColor: color },
			onPointerPress: (evt) => {
				log()(evt);

				if(evt.which === 3){
					evt.preventDefault();

					homePage.targetedLink = evt.target;

					menu.open('single');

					menu.drawAtCursor(evt);
				}

				else homePage.goTo(evt.target.href, evt.which === 2);
			}
		});
	},
	updateBookmarks: function(bookmarks){
		homePage.bookmarks = bookmarks;

		homePage.bookmarks.__links = [];

		dom.empty(homePage.linkContainer);

		for(let x = 0, count = homePage.bookmarks.__sortOrder.length, bookmark; x < count; ++x){
			bookmark = bookmarks[homePage.bookmarks.__sortOrder[x]];

			bookmark.url = homePage.fixLink(bookmark.url);

			homePage.bookmarks.__links.push(bookmark.url.replace());

			bookmark = homePage.createLink(homePage.bookmarks.__sortOrder[x], bookmark.url, bookmark.color);

			bookmark.classList.add('bookmark');

			homePage.linkContainer.appendChild(bookmark);
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

		dom.remove(document.getElementsByClassName('link'));

		socketClient.reply('getSearchSuggestions', keyword);
	},
	addBookmark: function(){
		dialog.form('Add Bookmark', { name: '$required$', url: '$required$', color: 'hsl(209, 55%, 45%)' }, 2, (choice, changes) => {
			if(choice !== 'OK') return;

			socketClient.reply('addBookmark', changes);
		});
	},
	editBookmark: function(){
		if(!homePage.targetedLink) return log.error()('No targeted link to edit');

		const old = { name: homePage.targetedLink.textContent, url: homePage.targetedLink.href, color: homePage.bookmarks[homePage.targetedLink.textContent].color };

		dialog.form('Edit Bookmark', old, 2, (choice, changes) => {
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