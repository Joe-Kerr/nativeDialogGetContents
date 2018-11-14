const assert = require("assert");
const sinon = require("sinon");
const {JSDOM} = require("jsdom"); //Might be overkill - but I alawys wanted to try this out.

const dom = new JSDOM("<!DOCTYPE html><html><head></head><body><p>Hello world!</p></body></html>");
const fileLoaderId = "nativeFileLoader";

global.window = dom.window;
global.document = dom.window.document;
global.FileReader = dom.window.FileReader;	

const sample = require("../src/nativeDialogGetContents.js").default;

suite("nativeDialogGetContents.js");

function cleanupTest(resolve) {
	setTimeout(()=>{		
		assert.equal(document.addEventListener.callCount, 1);
		assert.equal(window.addEventListener.callCount, 1);	
		assert.equal(document.removeEventListener.callCount, 1);
		assert.equal(window.removeEventListener.callCount, 1);	
		
		assert.equal(document.getElementById(fileLoaderId), null);
		
		resolve("yay");	
	},200);		
}

before(()=>{
	sinon.spy(document, "addEventListener");
	sinon.spy(window, "addEventListener");	
	sinon.spy(document, "removeEventListener");
	sinon.spy(window, "removeEventListener");
});

after(()=>{
	delete global.window;	
	delete global.document;	
});

beforeEach(()=>{
	document.addEventListener.resetHistory();
	window.addEventListener.resetHistory();		
	document.removeEventListener.resetHistory();
	window.removeEventListener.resetHistory();
});

test("Propper init", ()=>{
	assert.equal(document.addEventListener.callCount, 0);
	assert.equal(window.addEventListener.callCount, 0);
	assert.equal(document.removeEventListener.callCount, 0);
	assert.equal(window.removeEventListener.callCount, 0);	
});

test("<input> element created", ()=>{
	return new Promise((resolve)=>{		
		sample.open().then((res)=>{
			setTimeout(resolve, 200); //<-- !!! otherwise no proper cleanup 
		});
		
		assert.notEqual(document.getElementById(fileLoaderId), null);		
		sample.__browserDialogDoneLoading({target: {result: "check"}});
	});	
});

test("<input> change event calls FileReader", ()=>{
	const backup = global.FileReader;
	const FileReaderFake = {readAsText: new sinon.fake()};
	
	global.FileReader = function() {return FileReaderFake;}
	
	return new Promise((resolve)=>{		
		sample.open().then((res)=>{
			setTimeout(()=>{
				assert.equal(FileReaderFake.readAsText.callCount, 1);
				global.FileReader = backup;
				resolve("yay");
			}, 200); 
		});
		
		document.getElementById(fileLoaderId).dispatchEvent(new window.Event("change"));
		sample.__browserDialogDoneLoading({target: {result: "check"}});
	});		
});

test("Successful loading resolves promise", ()=>{
	return new Promise((resolve)=>{		
		sample.open().then((res)=>{
			assert.equal(res.type, "done");
			assert.equal(res.data, "check");
				
			setTimeout(resolve,200);
		});
		sample.__browserDialogDoneLoading({target: {result: "check"}});
	});
});

test("Successful loading cleans up", ()=>{	
	return new Promise((resolve)=>{		
		sample.open().then((res)=>{	
			cleanupTest(resolve);
		});
		
		setTimeout(()=>{
			sample.__browserDialogDoneLoading({target: {result: "check"}});
		},110);
	});
});


test("Cancel loading rejects promise", ()=>{
	return new Promise((resolve)=>{		
		sample.open().catch((res)=>{
			setTimeout(()=>{				
				assert.equal(res.type, "cancel");
				assert.equal(res.data, null);
				resolve("yay");	
			},200);					
		});
		sample.__handleDialogClose({type: "unitTest"});
	});
});

test("Cancel loading cleans up", ()=>{	
	return new Promise((resolve)=>{		
		sample.open().catch((res)=>{	
			cleanupTest(resolve);		
		});
		
		setTimeout(()=>{
			sample.__handleDialogClose({target: {result: "check"}});
		},110);
	});
});

test("Fail loading rejects promise", ()=>{
	return new Promise((resolve)=>{		
		sample.open().catch((res)=>{
			setTimeout(()=>{				
				assert.equal(res.type, "error");		
				assert.equal(res.data, "Error: reason");				
				resolve("yay");	
			},200);					
		});
		sample.__browserDialogFailLoading("reason");
	});
});

test("Fail loading cleans up", ()=>{	
	return new Promise((resolve)=>{		
		sample.open().catch((res)=>{	
			cleanupTest(resolve);		
		});
		
		setTimeout(()=>{
			sample.__browserDialogFailLoading({type: "error", data: "reason"});
		},110);
	});
});

test("Successful loading calls callback", ()=>{
	return new Promise((resolve)=>{		
		sample.open((err,res)=>{
			assert.equal(err, null);
			assert.equal(res.type, "done");
			assert.equal(res.data, "check");
			setTimeout(resolve, 200);			
		});
		
		sample.__browserDialogDoneLoading({target: {result: "check"}});
	});
});


test("Cancel loading calls callback", ()=>{
	return new Promise((resolve)=>{		
		sample.open((err,res)=>{
			assert.equal(res, null);
			assert.equal(err.type, "cancel");
			assert.equal(err.data, null);
			setTimeout(resolve, 200);			
		});
		
		sample.__handleDialogClose({type: "unitTest"});
	});
});


test("Fail loading calls callback", ()=>{
	return new Promise((resolve)=>{		
		sample.open((err,res)=>{
			assert.equal(res, null);
			assert.equal(err.type, "error");		
			assert.equal(err.data, "Error: reason");	
			setTimeout(resolve, 200);			
		});
		
		sample.__browserDialogFailLoading("reason");
	});
});

test("Loading is modal (promise)", ()=>{
	return new Promise((resolve)=>{		
		sample.open().then((res)=>{
			setTimeout(resolve, 200);
		});	
		sample.open().catch((res)=>{	
			assert.equal(res.type, "error");	
		});		
		assert.notEqual(document.getElementById(fileLoaderId), null);		
		sample.__browserDialogDoneLoading({target: {result: "check"}});
	});		
});

test("Loading is modal (callback)", ()=>{
	return new Promise((resolve)=>{		
		
		sample.open(()=>{});
		
		sample.open((err,res)=>{
			assert.equal(res, null);
			assert.equal(err.type, "error");
			setTimeout(resolve, 200);			
		});
		assert.notEqual(document.getElementById(fileLoaderId), null);
		sample.__browserDialogDoneLoading({target: {result: "check"}});
	});	
});

test("Dialog cancel not possible after file selected", ()=>{
	let dialogWas;
	return new Promise((resolve)=>{		
		sample.open()
		.then((res)=>{				
			dialogWas = "closedBySelect";
		})
		.catch((e)=>{
			dialogWas = "canceled";
		});
		
		setTimeout(()=>{
			assert.equal(dialogWas, "closedBySelect");
			resolve();
		}, 500);
		
		sample.__browserDialogFileConfirm({target: {files: [new global.window.Blob(["check"])]}})
		sample.__handleDialogClose({type: "unitTest"});		
	});
	
});