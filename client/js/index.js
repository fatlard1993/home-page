// includes dom log socket-client menu dialog
// babel
/* global dom log socketClient menu dialog */

dom.onLoad(function onLoad(){
	menu.init({
		main: ['Add Bookmark:~:default'],
		single: ['Edit', 'Delete']
	}, { discardDirection: 'static' });

	var searchBar = dom.createElem('input', { type: 'text', id: 'search', autocapitalize: 'none', placeholder: 'Search', appendTo: dom.getElemById('content') });

	searchBar.focus();

	socketClient.init();

	socketClient.on('bookmarks', function(bookmarks){
		dom.remove(document.getElementsByClassName('link'));

		for(var x = 0, arr = Object.keys(bookmarks), count = arr.length; x < count; ++x){
			log()(arr[x], bookmarks[arr[x]]);

			dom.createElem('a', { className: 'link', textContent: arr[x], href: bookmarks[arr[x]], appendTo: dom.getElemById('content') });
		}
	});

	var targetedLink;

	dom.interact.on('pointerUp', function(evt){
		if(!evt.target.parentElement || evt.target.parentElement.id !== 'menu') menu.close();

		if(evt.which !== 3) return;

		evt.preventDefault();

		if(evt.target.className === 'link'){
			targetedLink = evt.target;

			menu.open('single');
		}

		else{
			targetedLink = null;

			menu.open('main');
		}

		menu.elem.style.top = (evt.pageY >= document.body.clientHeight - menu.elem.clientHeight ? evt.pageY - menu.elem.clientHeight : evt.pageY) +'px';
		menu.elem.style.left = (evt.pageX >= document.body.clientWidth - menu.elem.clientWidth ? evt.pageX - menu.elem.clientWidth : evt.pageX) +'px';
	});

	dom.interact.on('keyUp', function(evt){
		if(evt.keyPressed === 'ENTER' && searchBar.value.length){
			location.href = `http://google.com/search?q=${searchBar.value}`;
		}
	});

	menu.on('selection', function(evt){
		if(menu.isOpen === 'main'){
			if(evt.item === 'Add Bookmark'){
				dialog.form('Add Bookmark', { name: '', url: '' }, 'cancel|OK', function(choice, changes){
					if(choice === 'Cancel') return;

					socketClient.reply('addBookmark', changes);
				});
			}
		}

		else if(menu.isOpen === 'single'){
			if(evt.item === 'Edit'){
				var old = { name: targetedLink.textContent, url: targetedLink.href };

				dialog.form('Edit Bookmark', old, 'cancel|OK', function(choice, changes){
					if(choice === 'Cancel') return;

					socketClient.reply('editBookmark', { old, new: changes });
				});
			}

			else if(evt.item === 'Delete'){
				dialog('warning deleteBookmark', 'Warning', 'You are about to delete this bookmark, do you wish to continue?', 'no|yes');

				dialog.resolve.deleteBookmark = function(choice){
					if(choice === 'no') return;

					socketClient.reply('deleteBookmark', targetedLink.textContent);
				};
			}
		}

		menu.close();
	});
});