(function() {
	var target = null, offsetX, offsetY, dragTimeout;

	var mousemove = function(event) {
		var wnd = target;
		if (wnd != null) {
			if (dragTimeout) {
				clearTimeout(dragTimeout);
			} 
			dragTimeout = setTimeout(function() {
				wnd.style.left = event.clientX - offsetX;
				wnd.style.top = event.clientY - offsetY;
			}, 8);
		}
	};

	var framesVisibility = function(visibility) {
		var iframes = document.getElementsByTagName('iframe');
		for (var i = 0; i < iframes.length; i++) {
			if (iframes[i].style) {
				iframes[i].style.visibility = visibility;
			}
		}
	}

	var showIframes = function() {
		framesVisibility('inherit');
	}

	var hideIframes = function() {
		framesVisibility('hidden');
	}

	var mouseup = function(event) {
		if (target != null) {
			showIframes();
			target.style.cursor = 'default';
			target = null;
			document.removeEventListener('mousemove', mousemove);
			document.removeEventListener('mouseup', mouseup);
		}
	};

	var activateTaskById = function(id) {
		var tasks = document.getElementsByClassName('task');

		for(var i = 0; i < tasks.length; i++) {
			if (tasks[i].className) {
				tasks[i].className = tasks[i].className.replace(' active', '');
				if (tasks[i].dataset.windowId == id) {
					tasks[i].className += ' active';
				}
			}
		}
	}

	var activateWindowById = function(id) {
		var target = document.getElementById(id);

		activateWindow(target);

		return target;
	};

	var activateWindow = function(wnd) {
		var windows = document.getElementsByClassName('window');

		for(var i = 0; i < windows.length; i++) {
			if (windows[i].className) {
				windows[i].className = windows[i].className.replace(' active', '');
			}
		}

		wnd.className += ' active';

		activateTaskById(wnd.id);
	};

	var trackUpTo = function(targetAttribute, element) {
		var element = element.parentElement;

		while (element) {
			if (element.dataset.hasOwnProperty(targetAttribute)) {
				return element;
			} else {
				element = element.parentElement;
			}
		}

		return null;
	};

	var getWindow = function(element) {
		return trackUpTo('dragTarget', element);
	};

	var getWindowHeader = function(element) {
		return trackUpTo('draggable', element);
	};

	document.addEventListener('mousedown', function(event) {
		target = getWindowHeader(event.target);
		if (target) {
			target = getWindow(target);
			if (target) {
				hideIframes();
				activateWindow(target);
				offsetX = event.clientX - target.offsetLeft;
				offsetY = event.clientY - target.offsetTop;
				target.style.position = 'absolute';
				target.style.cursor = 'move';
				document.addEventListener('mousemove', mousemove, false);
				document.addEventListener('mouseup', mouseup, false);
			}
		}
	}, false);

	var restore = function(event) {
		var id = event.target.dataset.windowId;
		var wnd = activateWindowById(id);

		wnd.style.visibility = 'inherit';
	};

	var createNewTask = function(name, id) {
		var task = document.createElement('DIV');

		task.className = 'task button active';
		task.dataset.windowId = id;
		task.innerText = task.textContent = name;
		task.onclick = restore;

		document.getElementsByClassName('task-bar')[0].appendChild(task);
	};

	var minimizeWindow = function(event) {
		var wnd = getWindow(event.target.parentElement);
		if (wnd) {
			wnd.style.visibility = 'hidden';
			activateTaskById(null);
		}
	};

	var maximizeWindow = function(event) {
		var wnd = getWindow(event.target.parentElement);
		if (wnd) {
			if (wnd.dataset.maximized != 1) {
				wnd.dataset.left = wnd.style.left;
				wnd.dataset.top = wnd.style.top;
				wnd.dataset.width = wnd.style.width;
				wnd.dataset.heigth = wnd.style.height;
				wnd.dataset.maximized = 1;

				wnd.style.left = 0;
				wnd.style.top = 0;
				wnd.style.width = window.innerWidth;
				wnd.style.height = window.innerHeight - 55;
			} else {
				wnd.dataset.maximized = 0;

				wnd.style.left = wnd.dataset.left;
				wnd.style.top = wnd.dataset.top;
				wnd.style.width = wnd.dataset.width;
				wnd.style.height = wnd.dataset.heigth;
			}
		}
	};

	var removeTask = function(id) {
		var tasks = document.getElementsByClassName('task');

		for(var i = 0; i < tasks.length; i++) {
			var task = tasks[i];

			if (task.dataset.windowId == id) {
				task.parentElement.removeChild(task);
				return;
			}
		}
	}

	var closeWindow = function(event) {
		var wnd = getWindow(event.target.parentElement);
		if (wnd) {
			removeTask(wnd.id);
			wnd.parentElement.removeChild(wnd);
		}
	};

	var withTask = function(id, func) {
		var tasks = document.getElementsByClassName('task');
		for(var i = 0; i < tasks.length; i++) {
			if (tasks[i].className) {
				if (tasks[i].dataset.windowId == id) {
					func(tasks[i]);
					return;
				}
			}
		}
	};

	var browserGo = function(event) {
		var wnd = getWindow(event.target.parentElement);
		var addressInput = wnd.getElementsByTagName('input')[0];
		var url = addressInput.value;
		var iframe = wnd.getElementsByTagName('iframe')[0];
		if (iframe) {
			if (url.indexOf('http') != 0) {
				url = 'http://' + url;
			}
			iframe.src = url;
			withTask(wnd.id, function(task) {
				task.innerText = task.textContent = url.replace(/^https?:\/\/(www\.)?/, '') + ' - Browser';
			});
		}
	};

	var createNewWindow = function(templateId) {
		var newWindow = document.getElementById(templateId).cloneNode(true);

		newWindow.id = Math.random() * 0xFFFFFFFFFFFFFF;
		newWindow.classList.remove('template');

		newWindow.getElementsByClassName('minimize button')[0].addEventListener('click', minimizeWindow);
		newWindow.getElementsByClassName('maximize button')[0].addEventListener('click', maximizeWindow);
		newWindow.getElementsByClassName('close button')[0].addEventListener('click', closeWindow);

		document.getElementsByClassName('desktop')[0].appendChild(newWindow);

		return newWindow;
	};

	var createNewBrowserWindow = function() {
		var newWindow = createNewWindow('browser-template');

		newWindow.getElementsByClassName('browser-go button')[0].addEventListener('click', browserGo);

		createNewTask('Browser', newWindow.id);
		activateWindow(newWindow);

		return newWindow;
	};

	var createNewNotepadWindow = function() {
		var newWindow = createNewWindow('notepad-template');

		createNewTask('Notepad', newWindow.id);
		activateWindow(newWindow);

		return newWindow;
	};

	var browserClick = function(event) {
		createNewBrowserWindow();
	};

	var notepadClick = function(event) {
		createNewNotepadWindow();
	};

	setInterval(function() {
		var m = new Date();
		var date =
			("0" + m.getHours()).slice(-2) + ":" +
			("0" + m.getMinutes()).slice(-2) + ":" +
			("0" + m.getSeconds()).slice(-2) + "<br>" + 
			("0" + (m.getMonth()+1)).slice(-2) + "/" +
			("0" + m.getDate()).slice(-2) + "/" +
			m.getFullYear();
			document.getElementById('clock').innerHTML = date;
	}, 1000);

	var startMenuClick = function(event) {
		var menu = document.getElementsByClassName('start-menu')[0];
		if (!menu.style.visibility || menu.style.visibility == 'hidden') {
			menu.style.visibility = 'visible';
		} else {
			menu.style.visibility = 'hidden';
		}
	};

	document.getElementsByClassName('start button')[0].addEventListener('click', startMenuClick, false);

	var initLaunchButtons = function(appName, launcherFunc) {
		var buttons = document.getElementsByClassName(appName + ' button');
		for(var i = 0; i < buttons.length; i++) {
			buttons[i].addEventListener('click', launcherFunc, false);
		}
	};

	initLaunchButtons('browser', browserClick);
	initLaunchButtons('notepad', notepadClick);
})();
