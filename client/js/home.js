// includes dom log socket-client menu dialog
// babel
/* global dom log socketClient menu dialog */

dom.onLoad(function onLoad(){
	menu.init({
		main: ['Add Bookmark'],
		single: ['Edit', 'Delete']
	});

	dialog.init();

	socketClient.init();

	dom.content = dom.content || document.getElementById('content');

	socketClient.on('bookmarks', function(bookmarks){
		dom.empty(dom.content);

		for(var x = 0, arr = Object.keys(bookmarks), count = arr.length; x < count; ++x){
			log(arr[x], bookmarks[arr[x]]);

			dom.createElem('a', { className: 'link', textContent: arr[x], href: bookmarks[arr[x]], appendTo: dom.content });
		}
	});

	var targetedLink;

	dom.interact.on('contextMenu', function(evt){
		log(evt.target);

		if(evt.target.className === 'link'){
			targetedLink = evt.target;

			menu.open('single');
		}

		else menu.open('main');
	});

	menu.on('selection', function(evt){
		if(menu.isOpen === 'main'){
			if(evt.item === 'Add Bookmark'){
				dialog.form('Add Bookmark', { name: '', url: '' }, 'cancel|OK', function(choice, changes){
					if(choice === 'cancel') return;

					socketClient.reply('addBookmark', changes);
				});
			}
		}

		else if(menu.isOpen === 'single'){
			if(evt.item === 'Edit'){
				var old = { name: targetedLink.textContent, url: targetedLink.href };

				dialog.form('Edit Bookmark', old, 'cancel|OK', function(choice, changes){
					if(choice === 'cancel') return;

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