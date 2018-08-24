/* global Reqx, Log, Dom, Interact */

var reqx = new Reqx();
var Loaded = false;

function Load(){
	if(Loaded) return;
	Loaded = true;

	Log()('testing js');

	var content = document.getElementById('Content');

	var input = Dom.createElem('input', { type: 'text' });
	var button = Dom.createElem('button', { textContent: 'get' });
	var button2 = Dom.createElem('button', { textContent: 'post' });
	var output = Dom.createElem('div');

	Dom.appendChildren(content, input, button, button2, output);

	Interact.onPointerUp.push(function(evt){
		if(evt.target === button || evt.target === button2){
			evt.preventDefault();

		reqx[evt.target.textContent](input.value, function(err, res){
			output.textContent = JSON.stringify(arguments);
		});
		}
	});
}

document.addEventListener('DOMContentLoaded', Load);