// Some history
// 2024-06-06 Go to JSZ4 planning to have links to files
// as well as 
// 2022-09-15 add a setlocalstorage to end of showObj() 
// so I don't always forget to save where I'm at!

const ZettelkastenApp = {};
ZettelkastenApp.data = {
    zettel: {}, // Will be populated from zstring or loaded data
    currentKey: "top",
    stash: {},
    rawFileInput: ""
};

// *******************************************************************
// Initializationg.Globals
// current is a global (BAD!) that is the key of the current displayed zettel

// var current = "top"; // Replaced by ZettelkastenApp.data.currentKey


// stash contains a stashed copy of the current zettel before editing
// it's stored just after the thing is brought in

// var stash = {}; // Replaced by ZettelkastenApp.data.stash

// var input = ""; // Replaced by ZettelkastenApp.data.rawFileInput


// See if we can grab a storage manager
// this is just creating a localstorage 
localStorage.setItem('mydog', 'jay');

// zettel is the other global that holds the current informatiom
// *******************************************************************
// zstring is an initial set of zettels for testing.  
var zstring = 
    `{  "top" : {
            "name" : "top",
            "content": "The very top of the Zettelkasten",
            "links" : [ "a" ],
            "backlinks" : []
        },
        
        "a" : {
            "name" : "Test1",
            "content": "This is a some content [[a]] newly refined",
            "links" : ["a","b"],
            "backlinks" : []
        },   
        "b" : {
            "name" : "Test2",
            "content" : "Abercrombie and Fitch",
            "links" : ["a","b"],
            "backlinks" : []
         },
        "c" : {
            "name" : "Test3",
            "content" : "Abercrombie and Fitch",
            "links" : ["a","b","asdf"],
            "backlinks" : []
         }
    }` ;

// Populate the namespaced zettel data store
ZettelkastenApp.data.zettel = JSON.parse(zstring);
// The old global 'var zettel' is now fully removed.

// *********************************************************************
// Input Handling
// *********************************************************************

document.onkeyup = function(e) {
    if(e.ctrlKey && e.keyCode == 80) {
      // ctrl+p pressed
      readObj();
//      alert("parsing");
    };
    if(e.ctrlKey && e.keyCode == 83) {
        // ctrl+s pressed
        download(JSON.stringify(ZettelkastenApp.data.zettel)); // Filename argument removed
        alert("saving"); // This alert might now be slightly premature if the user cancels the prompt
    };
    if(e.ctrlKey && e.keyCode == 84) {
        // ctrl+t pressed
        jumpTop();
    };

  }

// *******************************************************************
// General HTML tools
// *********************************************************************
// cr just writes a <br>

var cr = function() {document.writeln(' <br>')};

//makeJumpButton creates a button that will jump to an 
// existing zettel or create one if it doesn't exist
// the button contains a tooltip with the contents of the zettel
// the button is created in the part of the document identified 
// by tofield, which is so far 
// forwardbuttons, reversebuttons, searchresults
function makeJumpButton(str,tofield){
    if (zettelExistQ(str) != true) makeEmpty(str);
    let btn = document.createElement("BUTTON");
    btn.innerHTML = str;
    btn.title = ZettelkastenApp.data.zettel[str]['content'];
    btn.onclick = function() {showObj(str)};
    // Removed: btn.style.fontSize = currentFontSize + 'em';  // Font size should be inherited via CSS
    let element = document.getElementById(tofield);
                //either forwardbuttons or reversebuttons
    element.appendChild(btn);        
    let brief = ZettelkastenApp.data.zettel[str]["name"];
    let t = document.createTextNode(brief);     // Create a text node
    let span = document.createElement("SPAN");   // Create span to control text size
    // Removed: span.style.fontSize = currentFontSize + 'em';  // Font size should be inherited via CSS
    span.appendChild(t);
    element.appendChild(span);                     // Append the text
    let newElem = document.createElement("BR");
    element.appendChild(newElem);
}

// *******************************************************************
// General javascript tools

// Function to sort and return unique values from an array
function sortuniq(a) {
    return a.sort().filter(function(item, pos, ary) {
        return !pos || item != ary[pos - 1];
    })
};

function sortObj(obj) {
    return Object.keys(obj).sort().reduce(function (result, key) {
      result[key] = obj[key];
      return result;
    }, {});
}

// Creates a "deepcopy" of an object by stringify and destringifying it.
// this is not optimal

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}


// copy all the things in obj to the zettel designated by key

function shallowcopytozettel(obj, key) { // key is unused, assumes currentKey
    let keylist = Object.keys(obj);
    for (const k of keylist) {
	ZettelkastenApp.data.zettel[ZettelkastenApp.data.currentKey][k] = obj[k];
    }    
}
    
// put things back from stash into the current object.  
// I don't think this is currently used

function rollback() {
    shallowcopytozettel(ZettelkastenApp.data.stash); // Pass the stash object
    showObj(ZettelkastenApp.data.currentKey); // Pass the current key
}

// clear the local storage and place a string of zettel in "snapshot"
function setlocalstorage() {
    localStorage.clear();
    localStorage.setItem('snapshot', JSON.stringify(ZettelkastenApp.data.zettel));
}

// load "snapshot" from local storage and overwrite zettel with it
function loadlocalstorage() {
    ZettelkastenApp.data.zettel = JSON.parse(localStorage.getItem('snapshot'))
}

// Create a UUID type 4, not currently used!
function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

  

// *******************************************************************
// Pure Zettel/HTML Display  Tools


// *******************************************************************
// Pure Zettel Tools
// *********************************************************************

// showObj(key) sets current to key and displays the elements 
// in the appropriate fields on the screen

// Creates an empty zettel with key "key" with a pointer to the
// current date


function makeEmpty(key) {
    let dateString = new Date().toISOString().substring(0, 10);
    ZettelkastenApp.data.zettel[key] = {
        "name" : key, 
        "content": '\n \n [[' + dateString + ']]', 
        "links": [new Date().toISOString().substring(0, 10)], 
        "backlinks": [ZettelkastenApp.data.currentKey],
        "creation" : dateString};
    
}

// cleanlist iterates over all the zettels
//  empties out the backlinks for each 
// iterates over the zettels again, and for each link it finds
// stuffs that link into the backlinks of the zettel pointed to.

function cleanBackList() {
    let keylist = Object.keys(ZettelkastenApp.data.zettel);
    for (const k of keylist) {
//        console.log( ZettelkastenApp.data.zettel[k].backlinks + " " + k)
        ZettelkastenApp.data.zettel[k].backlinks = [];
//        console.log( ZettelkastenApp.data.zettel[k].backlinks + " " + k)
    };
    for (const k of keylist) {
//        console.log("working on " + k);
//        console.log("links are ", ZettelkastenApp.data.zettel[k].links);
        if ( ZettelkastenApp.data.zettel[k].links.length > 0 ) {
            for (const d of ZettelkastenApp.data.zettel[k].links) {
 //               console.log("pushing back link " + d);
                if (ZettelkastenApp.data.zettel[d] != undefined) ZettelkastenApp.data.zettel[d].backlinks.push(k);
            };
        };
    };
};


// showObj(key)
// first parses what's onthe screen so the contents aren't lost
// then displays the contents of the zettel in the appropriate
// fields on the screnn.
// Also show the forward and reverse links after clearning out
// the link buttons that are there.

var showObj = function(key) {
    // first parse the current edited thing so it's not lost
    readObjNoShow(); // This function uses ZettelkastenApp.data.currentKey internally for saving the "previous" zettel.
    //    ZettelkastenApp.data.zettel[key].links = sortuniq(ZettelkastenApp.data.zettel[key].links);
    ZettelkastenApp.data.zettel[key].backlinks = sortuniq(ZettelkastenApp.data.zettel[key].backlinks);
    document.getElementById("zkey").value = key;
    document.getElementById("zname").value = ZettelkastenApp.data.zettel[key].name;
    document.getElementById("zcontent").value = ZettelkastenApp.data.zettel[key].content;
    document.getElementById("nextz").value = ZettelkastenApp.data.currentKey; // Display the key of the zettel *before* this new one
    document.getElementById("zdate").value = ZettelkastenApp.data.zettel[key].creation;
    document.getElementById("zcount").value = Object.keys(ZettelkastenApp.data.zettel).length;
 //   document.getElementById("render").value = ZettelkastenApp.data.zettel[key].content;
 //   MathJax.typeset();
    ZettelkastenApp.data.currentKey = key; // Update currentKey to the new zettel being shown

// Show the forward buttons
    var buttons = document.getElementById("forwardbuttons");
    while(buttons.firstChild){
        buttons.removeChild(buttons.firstChild);
    } 
    if ( (ZettelkastenApp.data.zettel[key].links).length > 0 ) {
        for (x of ZettelkastenApp.data.zettel[key].links)
            {  makeJumpButton(x, "forwardbuttons") };
    };
// Show the reverse buttons
    var buttons = document.getElementById("reversebuttons");
    while(buttons.firstChild){
        buttons.removeChild(buttons.firstChild);
    } 
    if ( (ZettelkastenApp.data.zettel[key].backlinks).length > 0 ) {
    for (x of ZettelkastenApp.data.zettel[key].backlinks)  {  makeJumpButton(x, "reversebuttons") };
    };
    
    setlocalstorage();
 
};

// Does the zettel exist?
function zettelExistQ(key) {
    return ZettelkastenApp.data.zettel[key] != undefined
};

// This reads the field nextz to navigate to the next object.
// Not Currently used?
var showNextObj = function() {
//    console.log('entering showNextObj');
    var next = document.getElementById("nextz").value;
    ZettelkastenApp.data.currentKey = next; // This should be the new key to navigate to
    showObj(next);
};

// jumpTop just displays the top zettel.  is this used?
// well, kinda, the keybinding seems broken.

function jumpTop()  {
    // ZettelkastenApp.data.currentKey = "top"; // showObj will set this
    showObj("top");
}

// readObj reads what's in the fields and writes it back to the 
// element named in the zkey field

var readObj = function() {
//    console.log('entering readobj');
    var zoro = document.getElementById("zkey").value; // This is the key of the zettel to be saved/updated
//    console.log("field being poked is " + zoro);
    readObjNoShow(); // Saves the content to zettel[zoro] (or currentKey if zoro is not currentKey)
    showObj(zoro); // Then displays zettel[zoro]
};

// readObjNoShow parses what's on the screen and 
// pokes the results into the zettel that should be 
// displayed- or more accurately to the zettel whose
// key is displayed in the key field.
// Hence a cheap clone could be done by just changing 
// the field name to what you want cloned.

var readObjNoShow = function() {
//    console.log('entering readobj');
    var zoro = document.getElementById("zkey").value; // Key of the zettel currently in the editor fields
//    console.log("field being poked is " + zoro);
    var zname = document.getElementById("zname").value;
    var zcontent = document.getElementById("zcontent").value;
    // var current = zoro; // Local variable 'current', distinct from global 'current' or 'ZettelkastenApp.data.currentKey'
                         // This local 'current' is actually the key of the zettel being saved.
    var revlinks = [];
    var creation = document.getElementById("zdate").value;
//    console.log("poking object " + zoro);
    if (ZettelkastenApp.data.zettel[zoro] != undefined)
        { revlinks = ZettelkastenApp.data.zettel[zoro].backlinks }; // Preserve existing backlinks if any
    var links = findLinks(zcontent);
    var filelinks =  findFileLinks(zcontent); // Not currently used but parsed
 //   var zlinks = document.getElementById("zlinks").value; 
 //   console.log(zlinks + " are the links");
 //   console.log(typeof(zlinks + " is the type")); 
    var nz = {"name" : zname, // In HTML, zname is tags, zkey is the name/key. This seems to map zname (tags) to the zettel's 'name' property
             "content": zcontent, 
             "links": links, 
             "backlinks" : revlinks,
            "creation" : creation };
 
//    console.log('parsing');
    ZettelkastenApp.data.zettel[zoro] = nz; // Save the new/updated zettel data under its key 'zoro'
    pokeReverseLinks(); // This function relies on ZettelkastenApp.data.currentKey, which might not be 'zoro'
                        // pokeReverseLinks should ideally use 'zoro' as the source key.
};

function deleteCurrentZettel() {
    let keyToDelete = document.getElementById("zkey").value; // Key of the zettel currently in fields

    if (keyToDelete === "top") {
        alert("The 'top' Zettel cannot be deleted.");
        return;
    }

    if (!ZettelkastenApp.data.zettel[keyToDelete]) {
        alert("No Zettel selected or Zettel does not exist.");
        return;
    }

    // Confirmation dialog
    if (confirm("Are you sure you want to delete the Zettel '" + ZettelkastenApp.data.zettel[keyToDelete].name + "' (Key: " + keyToDelete + ")?\nThis action cannot be undone.")) {
        // Delete the Zettel
        delete ZettelkastenApp.data.zettel[keyToDelete];

        // Update links and backlinks: Iterate through all zettels
        let allKeys = Object.keys(ZettelkastenApp.data.zettel);
        for (const key of allKeys) {
            if (ZettelkastenApp.data.zettel[key] && ZettelkastenApp.data.zettel[key].links) {
                ZettelkastenApp.data.zettel[key].links = ZettelkastenApp.data.zettel[key].links.filter(link => link !== keyToDelete);
            }
            // Backlinks will be rebuilt by cleanBackList
        }

        cleanBackList(); // Rebuild all backlinks

        setlocalstorage(); // Update local storage

        // Update Zettel count display
        document.getElementById("zcount").value = Object.keys(ZettelkastenApp.data.zettel).length;

        alert("Zettel '" + keyToDelete + "' deleted.");

        // Load the 'top' Zettel
        showObj("top");
    }
}

// showstring is currently unused
var showstring = function() {
    document.getElementById("zettelstring").innerHTML = zstring; // zstring is still a global for initial data
};

// shownewstring is currently unused
var shownewstring = function() {
    //document.getElementById("newzettelstring").innerHTML = JSON.stringify(ZettelkastenApp.data.zettel);
    document.getElementById("newzettelstring").innerHTML = ZettelkastenApp.data.zettel; // This will show [object Object]
};

// *******************************************************************
// Search Tools
// *********************************************************************

// searchZettelForRegex takes the regex in the Search field
// Clears out all the current buttons
// searches the Name field using the regex
// note the name field is NOT the key field, alhtough the key is 
// mostly in the name field by constructin
// and creates a button for all the keys that match

function searchZettelForRegex() {
    let regValue = document.getElementById("searchRegEx").value;
    var resultsDiv = document.getElementById("searchresults");
    resultsDiv.innerHTML = ''; // Clear previous results

    if (!regValue.trim()) {
        resultsDiv.innerHTML = 'Search Results'; // Reset to default if search term is empty
        return;
    }

    let re = new RegExp(regValue,'i');
    let keylist = Object.keys(ZettelkastenApp.data.zettel);
    let foundCount = 0;
    for (const k of keylist) {
//        console.log(k);
//        console.log(ZettelkastenApp.data.zettel[k].name);
//        console.log(re.exec(ZettelkastenApp.data.zettel[k].name));
        if (ZettelkastenApp.data.zettel[k].name && re.exec(ZettelkastenApp.data.zettel[k].name) != null) {
            makeJumpButton(k,"searchresults");
            foundCount++;
        }
    };
    if (foundCount === 0) {
        resultsDiv.innerHTML = 'No name matches found.';
    }
}

function searchZettelContent() {
    let searchTerm = document.getElementById("searchFullText").value;
    var resultsDiv = document.getElementById("searchresults");
    resultsDiv.innerHTML = ''; // Clear previous results

    if (!searchTerm.trim()) {
        // Clear results if search term is empty or whitespace
        resultsDiv.innerHTML = 'Search Results'; // Reset to default
        return;
    }
    // Escape special regex characters for a literal search, case-insensitive
    let re = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    let keylist = Object.keys(ZettelkastenApp.data.zettel);

    let foundCount = 0;
    for (const k of keylist) {
        if (ZettelkastenApp.data.zettel[k].content && re.test(ZettelkastenApp.data.zettel[k].content)) {
            makeJumpButton(k, "searchresults");
            foundCount++;
        }
    }
    if (foundCount === 0) {
        resultsDiv.innerHTML = 'No content matches found.';
    }
}

// *******************************************************************
//
// finds the links i.e. [[asdf]] => asdf in string aText or ["top"]
// return these in a list
// 
function findLinks(aText) {
    var links = aText.match(/\[\[.*?\]\]/g);
    if (links == null) {return ["nolinksout"];};
    var clean = function(str) { return str.substring(2,str.length - 2)};
    var links = links.map(clean);
    return links;
}

// Return all the file links in a list <<asdf>> => asdf
// Not currently used!

function findFileLinks(aText) {
    console.log("scanning for text links");
    var links = aText.match(/\<\<.*?\>\>/g);
    if (links == null) {return ["nolinksout"];};
    var clean = function(str) { return str.substring(2,str.length - 2)};
    var links = links.map(clean);
    return links;
}


// makes sure the links are sorted and unique

// Takes the links in the current cursor and pokes them
// to the reverselink value of the destination
// this is used when you are parsing a zettel

function pokeReverseLinks() { // This function should ideally take the sourceKey as an argument
//    console.log('enter reverse poke');
    // Assumes the links for ZettelkastenApp.data.currentKey (the one *just saved* by readObjNoShow)
    // need to be processed to update backlinks of the target zettels.
    // However, readObjNoShow saves to zettel[zoro], where zoro is from zkey field.
    // If zoro IS ZettelkastenApp.data.currentKey, this is fine.
    // If not (e.g. user changed zkey field and hit parse), this might be using the wrong source.
    // For now, assume currentKey is the one whose links we process.
    let currentZettelWhoseLinksToProcess = ZettelkastenApp.data.zettel[ZettelkastenApp.data.currentKey];
    if (!currentZettelWhoseLinksToProcess || !currentZettelWhoseLinksToProcess.links) return;

    let lks = currentZettelWhoseLinksToProcess.links;
//    console.log(' links pushed are ' + toString(lks));
    for (const element of lks) {
        if (zettelExistQ(element) != true) {makeEmpty(element)}; // makeEmpty uses currentKey for backlink, this is fine.
//        console.log('pushing backlink to ' + element);
        if(ZettelkastenApp.data.zettel[element] && ZettelkastenApp.data.zettel[element].backlinks) {
             if (!ZettelkastenApp.data.zettel[element].backlinks.includes(ZettelkastenApp.data.currentKey)) {
                ZettelkastenApp.data.zettel[element].backlinks.push(ZettelkastenApp.data.currentKey);
             }
        }
    }
};

// parseCurrentZettel just finds all the links in the content 
//function parseCurrentZettel() {
//    let zkey = document.getElementById("zkey").value;
//    let cursor = zettel[zkey];
//    console.log('test in parseCurrentZettel' );
//    console.log(cursor.content);
//    console.log(findLinks(cursor.content));
//    cursor.links = findLinks(cursor.content);
//    findFileLinks(cursor.content);
//    let element = document.getElementById("render");
//    let t = document.createTextNode(cursor.content);
//    element.appendChild(t);
//    MathJax.typeset();
//    console.log('Those should be the links');
//}


// parseAllZettels parses all the zettels and loads up links
// use this to clean things up 

function parseAllZettels(){
    let keylist = Object.keys(ZettelkastenApp.data.zettel);
    for (const k of keylist) {
	let here = ZettelkastenApp.data.zettel[k];
//	console.log(here);
	here.links = findLinks(here.content);
    };
}

// *******************************************************************
// JSON handling// *********************************************************************
// *********************************************************************
//download(text) prompts for filename and downloads the string in text
function download(text){ // Signature changed
    const date = new Date();
    // Format: YYYY-MM-DD
    const defaultFilename = date.getFullYear() + '-' +
                            String(date.getMonth() + 1).padStart(2, '0') + '-' +
                            String(date.getDate()).padStart(2, '0') + '.json';

    let userFilename = prompt("Enter filename for download:", defaultFilename);

    if (!userFilename) { // User cancelled or entered empty string
        alert("Download cancelled.");
        return; // Abort download
    }

    var blob = new Blob([text], {type: "text/plain"});
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = userFilename; // Use the filename from prompt
    a.click();
    // Optional: revoke the object URL after some time
    // setTimeout(() => window.URL.revokeObjectURL(url), 100);
  }

//writejson writes the current json to a text element called json
// not currently used
var writejson = function() {
    var j = JSON.stringify(ZettelkastenApp.data.zettel);
    document.getElementById("json").value =j;
};

//exportjson creates a json string of the current zettel
//not currently used
var exportjson = function() {
    window.open("data:text/json;charset=utf-8," + escape(JSON.stringify(ZettelkastenApp.data.zettel)));
};

// Read in a JSON file


var pullfiles=function() { 
    // Variables
    var fileInput = document.querySelector("#inputJSON");
    var files = fileInput.files;
    // cache files.length 
    var fl = files.length;
    var i = 0;
    var junk;


// This function will get called when reader is called and the text load is finished...
// See below.  In this case it takes the result and loads up the global variable Zettel.
// At some point we might load using yaml.js.
    var reader = new FileReader(); // a filereader is necessary to read stuff in 


    reader.onload = function(e) {
        ZettelkastenApp.data.rawFileInput = e.target.result;
//	    console.log(ZettelkastenApp.data.rawFileInput);
//        ZettelkastenApp.data.zettel = JSON.parse(ZettelkastenApp.data.rawFileInput);
	//    };
//	console.log(ZettelkastenApp.data.rawFileInput);
	var newentries = JSON.parse(ZettelkastenApp.data.rawFileInput);
//	console.log(newentries);
	let keylist =  Object.keys(newentries);
	for (const k of keylist) {
	    ZettelkastenApp.data.zettel[k] = {}; // Initialize if it's a new key
	    let subkeys = Object.keys(newentries[k]);
	    for (const  j of subkeys) {
		ZettelkastenApp.data.zettel[k][j]= newentries[k][j];
	    };
	};
    }

// iterate over files and readAsText

    while ( i < fl) {
        // localize file var in the loop
        var file = files[i];
        alert(file.name);
        i++;
        var text = reader.readAsText(file); // NECESSARY
    }    
}

// Font size control functions
let currentBaseFontSizePt = 12; // Starting base size in points

// This function now only needs to update the body's font size.
// Other elements should inherit their font size via CSS (e.g., using '1em' or 'inherit').
function updatePageFontSize(sizeInPt) {
    document.body.style.fontSize = sizeInPt + 'pt';
}

function increaseFontSize() {
    currentBaseFontSizePt += 1;  // Increment by 1pt
    updatePageFontSize(currentBaseFontSizePt);
}

function decreaseFontSize() {
    if (currentBaseFontSizePt > 6) {  // Prevent text from becoming too small (e.g., min 7pt)
        currentBaseFontSizePt -= 1;  // Decrement by 1pt
        updatePageFontSize(currentBaseFontSizePt);
    }
}

// Initial call to set font size when script loads, though CSS should handle initial state.
// updatePageFontSize(currentBaseFontSizePt); // This might be redundant if CSS body { font-size: 12pt; } is set.

// The MutationObserver for new textareas is likely no longer needed if they correctly inherit font size.
// If specific elements added dynamically still need explicit font sizing, that would be a separate consideration.
// For now, assuming CSS inheritance works for dynamically added elements within styled containers.
/*
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
            if (node.nodeName === 'TEXTAREA') {
                // If textareas are correctly styled with font-size: inherit or 1em in CSS, this is not needed.
                // node.style.fontSize = '1em'; // Or 'inherit'
            }
        });
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
*/
