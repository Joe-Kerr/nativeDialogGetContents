;var nativeDialogGetContents = (function(){
	var resolveLoading, rejectLoading;
	var fileSelected = false;
	
	//
	// Close detection
	//
	
	//Anything with mouseover fails in Safari because mouseover fires when mouse enters dialog, i.e. always false positive cancel. 
	
	var strategies = {
		
		//Fails in Firefox (Windows but not Linux) but otherwise preferable strat.
		dialogCloseFocusesWindow: {
			start: function() { window.addEventListener("focus", handleDialogClose, false);	},			
			stop: function() { window.removeEventListener("focus", handleDialogClose, false); }			
		},			
		
		//In general, this is the fallback strategy as it should work cross-browser. 
		//In Firefox, mouse move detected after dialog close. Hence only if the mouse does not move between triggering the dialog 
		//  and canceling it (ESC), the cancel will not be detected. 
		//In Chrome, IE any mouse move before dialog close not detected. Requires mouse to move after close. 
		//  Hence user notices that his move ends the loading process (assuming you have visual cues such as a loading indicator).
		//In Safari 10, mousemove triggers even if mouse not moved.		
		
		dialogCloseMouseMoveDocument: {
			timeout: -1,
			start: function() {
				//W/o timeout can fire before dialog open.
				this.timeout = setTimeout(function() {			
					document.addEventListener("mousemove", handleDialogClose);
				},100);					
			},			
			stop: function() { clearTimeout(this.timeout); document.removeEventListener("mousemove", handleDialogClose); }
		}
	};

	function detectDialogClose() {			
		for(var p in strategies) strategies[p].start();
	}

	function handleDialogClose(event) {	
		browserCloserCleanup();
	
		//Dialog canceled; if not in long-enough(!) timeout, can fire before input-change event.
		setTimeout(function() {
			if(!fileSelected) {
				rejectLoading(resProtocol("cancel", null));
				browserDialogCleanup();	
			}
		}, 100)
	}

	//
	// Event handlers
	//

	function browserDialogFileConfirm(event) {	
		var reader = new FileReader();
		var contents = validateFileContents(event);
		
		fileSelected = true;
		
		reader.readAsText(event.target.files[0], "UTF-8");
		reader.onload = browserDialogDoneLoading;
		reader.onerror = function() {browserDialogFailLoading(reader.error)};		
	}

	function browserDialogDoneLoading(event) {
		resolveLoading(resProtocol("done", event.target.result));
		cleanupAll();
	}	

	function browserDialogFailLoading(error) {
		rejectLoading(resProtocol("error", error));	
		cleanupAll();
	}

	//
	// Cleanup
	//

	function browserCloserCleanup() {
		for(var p in strategies) strategies[p].stop();	
	}

	function browserDialogCleanup() {
		resolveLoading = null;
		rejectLoading = null;
		var input = queryInputField();
		if(input === null) return;
		
		input.removeEventListener('change', browserDialogFileConfirm);
		document.body.removeChild(input);
		return;
	}

	function cleanupAll() {
		browserCloserCleanup();
		browserDialogCleanup();
	}

	//
	// Temp DOM
	//

	function createInputField() {
		var input = document.createElement("input");
		input.id = "nativeFileLoader";
		input.type = "file";
		input.name = "files[]";

		input.style.border = "0px #ffffff";
		input.style.color = "#ffffff";
		input.style.backgroundColor = "#ffffff";
		
		//If "none" at least Samsung Internet refuses to open dialog.
		//If not "none" and moving input out of viewport (negative left), makes screen jump in Safari.
		//input.style.display = "none";
		input.style.visibility = "hidden";
		
		document.body.appendChild(input);	
		return input;
	}

	function queryInputField() {
		return document.getElementById("nativeFileLoader");
	}

	//
	// Helper
	//

	function resProtocol(type, _data) {
		if(typeof type !== "string" || type !== "done" && type !== "cancel" && type !== "error") {
			throw new Error("Invalid type in response protocol.");
		}
		var data = (type !== "error") ? _data : new Error(_data);
		
		return {type: type, data: data};
	}

	function validateFileContents(event) {
		return (typeof event.target !== "undefined" 
				&& typeof event.target.files !== "undefined" 
				&& typeof event.target.files[0] !== "undefined") ? event.target.files[0] : null;
	}
	
	function promiseToCallback(callback) {
		return function(result) {
			return (result.type === "done") ? callback(null, result) : callback(result, null);
		}
	}
	
	//
	// Exports
	//

	//Notice: callstack differs between at least IE11 and FF/Chrome.
	function open(callback) {
		var callbackMode = (typeof callback !== "function") ? false : true;
		
		if(queryInputField() !== null) {
			var err = resProtocol("error", "Another dialog is still opened.");
			return (callbackMode === false) ? Promise.reject(err) : callback(err, null);
		}
		
		var input = createInputField();

		fileSelected = false;
		
		input.addEventListener("change", browserDialogFileConfirm);				
		input.focus();
		input.click();	
		
		detectDialogClose();		

		if(callbackMode) {
			resolveLoading = promiseToCallback(callback);
			rejectLoading = promiseToCallback(callback);			
			return null;
		}
		
		return new Promise(function(resolve, reject) {
			resolveLoading = resolve;
			rejectLoading = reject;
		});
	}
	
	return {
		open: open,
		
		__browserDialogFileConfirm: browserDialogFileConfirm,
		__browserDialogDoneLoading: browserDialogDoneLoading,		
		__browserDialogFailLoading: browserDialogFailLoading,
		__handleDialogClose: handleDialogClose		
	};
})();

if(typeof module !== "undefined") module.exports.default = nativeDialogGetContents;