/* global Reqx, Log, Dom, Interact, Menu, Prompt */

var Loaded = false;

function Load(){
	if(Loaded) return;
	Loaded = true;

	var reqx = new Reqx();

	Dom.Content = document.getElementById('Content');

	var targetedLink;

	Interact.onContextMenu.push(function(evt){
		Log()(evt.target);

		if(evt.target.className === 'link'){
			targetedLink = evt.target;

			Menu.draw('single');
		}

		else Menu.draw('main');
	});

	Menu.handleSelection = function(menuClass, selectedItem){
		if(menuClass === 'main'){
			if(selectedItem === 'Add Bookmark'){
				Prompt.form('Add Bookmark', { name: '', url: '' }, 'cancel|OK', function(choice, changes){
					if(choice === 'cancel') return;

					reqx.post('/bookmarks/add', changes, function(err, res){
						if(err) return Log.error()(err);

						window.location.reload();
					});
				});
			}
		}

		else if(menuClass === 'single'){
			if(selectedItem === 'Edit'){
				var old = { name: targetedLink.textContent, url: targetedLink.href };

				Prompt.form('Edit Bookmark', old, 'cancel|OK', function(choice, changes){
					if(choice === 'cancel') return;

					reqx.post('/bookmarks/edit/'+ targetedLink.textContent, { name: changes.name || old.name, url: changes.url || old.url }, function(err, res){
						if(err) return Log.error()(err);

						window.location.reload();
					});
				});
			}

			else if(selectedItem === 'Delete'){
				Prompt('warning deleteBookmark', 'Warning', 'You are about to delete this bookmark, do you wish to continue?', 'no|yes');

				Prompt.resolve.deleteBookmark = function(choice){
					if(choice === 'no') return;

					reqx.delete('/bookmarks/'+ targetedLink.textContent, function(err, res){
						if(err) return Log.error()(err);

						window.location.reload();
					});
				};
			}
		}

		Menu.close();
	};

	Menu.list.main = ['Add Bookmark'];
	Menu.list.single = ['Edit', 'Delete'];

	reqx.get('/bookmarks', function(err, res){
		if(err) return Log.error()(err);

		for(var x = 0, arr = Object.keys(res), count = arr.length; x < count; ++x){
			Log()(arr[x], res[arr[x]]);

			Dom.Content.appendChild(Dom.createElem('a', { className: 'link', textContent: arr[x], href: res[arr[x]] }));
		}
	});
}

document.addEventListener('DOMContentLoaded', Load);