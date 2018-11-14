# Native dialog get contents

Get the contents of a file **without a server**. Users can select the file via the native open dialog.


## Features

- Load any file without a server.
- OS handles loading for you.
- Returns promise with the file contents. (Or use a callback if you prefer.)
- Under the hood an \<input\> type "file" element is used. 


## Requirements

- Tested on Edge, IE11, FF latest, Chrome latest on Windows. Firefox 57 on Fedora, Firefox 60 on Debian. Safari 10 on iOS. Android Firefox (v?), Samsung Internet (v?).


## Use

As a standalone plugin it has a default namespace of "nativeDialogGetContents".

### open([<func>callback])

```
nativeDialogGetContents.open()
.then((result)=>{
	result.type; //done
	result.data; //"contents of file"
})
.catch((e)=>{
	e.type;// "cancel" || "error"
})
						
```

### or

```
try { result = await nativeDialogGetContents.open(); }
catch(e) { if(e.type === "error") throw new Error(e); }
```

### or

```
nativeDialogGetContents.open(function(err, res) {
	if(!err) {
		res.type; //done
		res.data; //"contents of file"	
	}
	else {
		throw new Error(err);
	}
});
```


## Known issues

- In Firefox (Windows), if you cancel the open-dialog with ESC without having moved the mouse since your click on the open trigger, the cancel action is only detected when you move the mouse after the open-dialog has closed. In practice this is rarely the case. If it does happen, cancel detection happens right after the first mouse move.

- In some versions of Samsung Internet browsers an extra tap is required after cancelling file selection.

- Testing native dialogs might not be possible. External tools are suggested that emulate key presses on OS level. Current approach: manual testing.


## Versions

### 0.8.0

- Public pre-release.


## License 

MIT