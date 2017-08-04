//Creates a small keyboard, with styling, mouse and key bindings, that can be plugged in easily to the web audio API
(function(){

	let mouseIsDown = false;
	let keysDown = {};
	let keyPressed;

	//Defines frequencies of the main notes
	const rootNotes = {
	  'C': 261.626,
	  'C#':277.183,
	  'D':293.665,
	  'D#':311.127,
	  'E':329.628,
	  'F':349.228,
	  'F#':369.994,
	  'G':391.995,
	  'G#':415.305,
	  'A':440,
	  'A#':466.164,
	  'B':493.883
	}
	//Used to find the index of notes when building the physical synth
	const orderNotes={
		0:0,
		1:0,
		2:1,
		3:1,
		4:2,
		5:3,
		6:3,
		7:4,
		8:4,
		9:5,
		10:5,
		11:6,
	}

	//Helper method to build the full keyboardMap
	function getNextNote(note){
	  	let oct = note.slice(-1);
	    let rootNote = note.slice(0, -1);

	    let octResult = (rootNote == 'B')? parseInt(oct) + 1 : oct

	  
	    let notes = Object.keys(rootNotes)
	    let n = notes.indexOf(rootNote) + 1
	    let rootNoteResult = (rootNote == 'B')? 'C': notes[n]

	    return rootNoteResult + octResult
	}
	//Helper method to find frequency from a note name ('A4' --> 440)
	function getFrequency(note){
	  let oct = note.slice(-1);
	  let rootNote = note.slice(0, -1);

	    return rootNotes[rootNote]*Math.pow(2,(oct-3));
	}
	//Helper method that return an object key from the required value
	function getKeyByValue(object, value) {

	  return Object.keys(object).find(key => object[key] === value);
	}


	//Constructor. Gets user params and creates the keyboard
	//All settings are optional and will fall back on default values
	Keyborad = function(settings){
		if(settings == undefined)settings = {}

		//Maps the notes id's to the notes names
		//Will be filled in according to the user desired starting note
		this.keyboardMap= {}
		//Maps all the keyboard key bindings to the corresponding note name
		this.keysMap = {
		  'A': "C3",
		  'S': "D3",
		  'D': "E3",
		  'F': "F3",
		  'G': "G3",
		  'H': "A3",
		  'J': "B3",
		  'K': "C4",
		  'W': "C#3",
		  'E': "D#3",
		  'T': "F#3",
		  'Y': "G#3",
		  'U': "A#3",
		}

		this.divID = settings.divID || 'keyborad';
		this.octaves = settings.octaves || 3;
		this.width = settings.width || 800;

		this.borderSize = settings.borderSize || 0;
		this.borderSizeTop = settings.borderSizeTop || 0;
		this.borderSizeOffset = settings.borderSizeOffset || 0;
		this.borderColor = settings.borderColor || 'black';
		this.borderBorderSize = settings.borderBorderSize || 0;
		this.borderBorderColor = settings.borderBorderColor || 'black';
		this.borderRadius = settings.borderRadius || 20;
		this.borderText = settings.borderText || '';

		this.noteWidth = (this.width-2*this.borderSize)/(this.octaves*7+1);
		this.noteHeight = settings.height || 200;

		this.firstNote = settings.firstNote || 'C2';
		this.showKey = settings.showKey || false;
		if(settings.autoSetUp == undefined)
		this.autoSetUp =  true;
			else
		this.autoSetUp =  settings.autoSetUp;

		this.selectColor = settings.selectColor || '#7FDBFF';
		this.whiteNoteColor = settings.whiteNoteColor || 'white';
		this.blackNoteColor = settings.blackNoteColor || 'black';
		
		
		// Auto set up will set up a simple synth -> gain -->context.destination
		if(this.autoSetUp){
			this.context = new AudioContext();
			this.mixNode = this.context.createGain();
			this.mixNode.gain.value = 0.3;
	    	this.mixNode.connect(this.context.destination);
	    	this.nodes = [];
		}

		this.init();
	}
	//Creates the keyboard div, fills the keyboardMap and adds mouse/keyboard listeners
	Keyborad.prototype.init = function(){
		//Find the div that will contain the keyboard. If there is not, it will be created
		//If we cant find the div, create one an append it directly to the body
		let div = document.getElementById(this.id)
		if (div == null){
			let d = document.createElement("div")
			d.id = this.divID
			document.body.appendChild(d)
		}
		//Empty it (needs to be rebuilt after changing key bindings)
		let keyborad = document.getElementById(this.divID)

		keyborad.innerHTML = ""
		keyborad.style.height = this.noteHeight+this.borderSizeTop + 'px'
		keyborad.style.width = this.width + 'px'

		//Find the order of the first note relative to a C (C->0, C#->1 ...)
		//Find the Note name of the user desired first note
	    let rootNote = this.firstNote.slice(0, -1);
	    // If its a sharp note, record it for later
	    let alteration = rootNote.slice(-1);

	    let orderOfFirstNote;
		let startNote = this.firstNote
		//Loop through all notes until we find the user note, and save the index
		for(let i = 0;i<12;i++){
			if(Object.keys(rootNotes)[i] == rootNote)
				orderOfFirstNote = i
		}

		//The keyboardMap will give an id to each note.
		//The C of the lowest octave chosen has 0 even if it is not displayed (ex, if we start from a A)
		//So everything needs to be offset by orderOfFirstNote
		this.keyboardMap = {}
		this.keyboardMap[orderOfFirstNote] = startNote
		for(let i = orderOfFirstNote + 1;i<this.octaves*13 + orderOfFirstNote;i++){
			this.keyboardMap[i] = getNextNote(startNote)
			startNote = this.keyboardMap[i]
		}
		
		//Append the list that will contain all of the notes, along with basic styling
		let ul = document.createElement("ul")
		ul.style.margin = "0px"
		ul.style.listStyle = "none"
		ul.style.position = "relative"
		ul.ondragstart = function(){return false;}
		ul.ondrop = function(){return false;}
		keyborad.appendChild(ul)
		
		//notes positions in the div are based on ID, if we skip ids (we dont start on a C), we need to offset the notes position.
		//If we start on a sharp note, the offset is slightly different
		let offset = alteration =="#"?-this.noteWidth/2:0

		//add all the notes, from the first one to first one + X octaves
		let id = 0;
		//Super messy ...
		for(let i = 0;i<this.octaves*7 +orderNotes[orderOfFirstNote] + 1 ;i++){
			//for each i, add one white note, starting after we reach the user requested first note
			//Only add a note if the id has reached the user start note
			if(id>=orderOfFirstNote && ( i < this.octaves*7 +orderNotes[orderOfFirstNote] + 1 || alteration =='#')){
				let li= document.createElement("li")
				li.appendChild(this.createNote('white',this.noteWidth*i-offset + this.borderSize + this.borderBorderSize ,id))
				ul.appendChild(li)

			}
			//if we dont add a note, offset the notes position
			else
				offset+=this.noteWidth

			id++;

			//and add one black note, except for E and B (no #)
			if(i%7 != 2 && i%7 != 6){
				if(id>=orderOfFirstNote && ( i < this.octaves*7 +orderNotes[orderOfFirstNote] + (alteration == '#'?1:0))){
					let li= document.createElement("li")
					li.appendChild(this.createNote('black',this.noteWidth*i+this.noteWidth/3*2-offset+ this.borderSize +  this.borderBorderSize,id))
					ul.appendChild(li)
				}
				id++;
			}
		}

		//Add borders div to the keyboard if necessary
		if(this.borderSize>0 || this.borderSizeTop>0){
			let top = document.createElement("div")

			top.classList.add("keyboradTop")
			top.innerHTML = this.borderText
			top.style.zIndex = -100;
			top.style.textAlign = 'center';
			top.style.fontWeight = 'bold';
			top.style.fontSize = this.borderSizeTop*5/6+ 'px';
			top.style.userSelect = 'none'
			top.style.webkitUserSelect = 'none'
			top.style.MozUserSelect = 'none'
			top.style.color = this.borderBorderColor
			top.style.width = (this.width + this.borderBorderSize-3) + 'px'
			top.style.height = (this.noteHeight + this.borderSizeTop -1*this.borderBorderSize + this.borderSizeOffset)+'px'
			top.style.backgroundColor = this.borderColor
			top.style.borderTop = this.borderBorderSize +'px solid ' + this.borderBorderColor
			top.style.borderRight = this.borderBorderSize +'px solid ' + this.borderBorderColor
			top.style.borderLeft = this.borderBorderSize +'px solid ' + this.borderBorderColor
			top.style.borderBottom = this.borderBorderSize +'px solid ' + this.borderBorderColor
			top.style.borderTopLeftRadius = this.borderRadius+'px'
			top.style.borderTopRightRadius = this.borderRadius+'px'
			top.style.borderBottomLeftRadius = this.borderRadius+'px'
			top.style.borderBottomRightRadius = this.borderRadius+'px'

			keyborad.appendChild(top)
		}

		//For each note div created, add mouse listeners
		let self = this;
		
		let nDiv = document.getElementById(this.divID).getElementsByClassName('note')

		

		for(let i = 0;i<nDiv.length;i++){
			nDiv[i].onmousedown = function(){
				mouseIsDown = true;
				self.onPressNoteID(this.id)
			}
			nDiv[i].onmouseup = function(){
				self.onReleaseNoteID(this.id)
			}
			nDiv[i].onmouseover = function(){
				if(!mouseIsDown)
					return
				self.onPressNoteID(this.id)
			}
			nDiv[i].onmouseout = function(){
				if(!mouseIsDown)
					return
				if(this.classList.contains('played')){
					self.onReleaseNoteID(this.id)
				}
			}
		}

		document.onmouseup = function(){
			mouseIsDown = false;
		}
		//And keyboard listeners associated
		document.onkeydown = function(evt) {
		    keyPressed = evt.keyCode || window.event;
		    if(keyPressed in keysDown)
		    	return;
		    keysDown[keyPressed] = true

		    let pressed = String.fromCharCode(keyPressed)
		    self.onPressNoteID(getKeyByValue(self.keyboardMap,self.keysMap[pressed]))
		};
		document.onkeyup = function(evt) {
			keyPressed = evt.keyCode || window.event;

		    delete keysDown[keyPressed];

		    let pressed = String.fromCharCode(keyPressed)
		    if (!(pressed in self.keysMap))
		    	return;
		    self.onReleaseNoteID(getKeyByValue(self.keyboardMap,self.keysMap[pressed]))
		};
	}

	//Create one div note with styling
	// Depending on the color, the styling, position and dimensions will be different
	Keyborad.prototype.createNote = function(color, position, id){
		let note = document.createElement("div")

		note.id = id
		note.classList.add('note') 
		note.classList.add(color) 
		note.style.position = 'absolute' 
		note.style.left = position + 'px' 
		note.style.top = (this.borderSizeTop + this.borderBorderSize) + 'px' 
		note.style.width = (color == 'white'? this.noteWidth : this.noteWidth*2/3) + 'px'
		note.style.height = (color =='white'? this.noteHeight : this.noteHeight*5.5/9) + 'px'
		note.style.backgroundColor = (color == 'white'? this.whiteNoteColor:this.blackNoteColor)
		note.style.zIndex = color == 'black' ? 10 : 0 //black notes on top
		note.style.border = '1px solid black'
		note.style.borderBottomLeftRadius = '5px'
		note.style.borderBottomRightRadius = '5px'

		
		//If we want to display key bindings on keyboard
		if(this.showKey){
			//Find the key char associated to the note, if it exists
			let key = getKeyByValue(this.keysMap,this.keyboardMap[id]);
			if( key == undefined ) key = ''

			let keyBindingDiv = document.createElement("div")

			keyBindingDiv.innerHTML = key
			keyBindingDiv.style.userSelect = 'none'
			keyBindingDi.style.webkitUserSelect = 'none'
			keyBindingDi.style.MozUserSelect = 'none'
			keyBindingDiv.style.color = color == 'white' ? this.blackNoteColor : this.whiteNoteColor;
			keyBindingDiv.style.position = 'absolute'
			keyBindingDiv.style.bottom = 0
			keyBindingDiv.style.padding = (color== 'white' ? this.noteWidth/3 : this.noteWidth/6) + 'px'
			note.appendChild(keyBindingDiv)
		}

		return note
	}
	//Takes care of styling the keyboard and finding the frequency. What happens when the note is pressed is defined in pressNote()
	Keyborad.prototype.onPressNoteID = function(id){
		if("undefined" === typeof this.keyboardMap[id])
			return

		let note =  idWithinId(this.divID,id)

		note.style.backgroundColor = this.selectColor
		note.classList.add('played')

		let frequency = getFrequency(this.keyboardMap[id])
		this.pressNote(frequency)
	}
	Keyborad.prototype.pressNote = function(frequency){
		//Will be overwritten by user for custom set up

		//autosetup
		if(this.autoSetUp){
			let oscillator = this.context.createOscillator();
	        oscillator.type = 'square';
	        oscillator.frequency.value = frequency ;
	        oscillator.connect(this.mixNode);
	        oscillator.start(0);
	        this.nodes.push(oscillator);
		}
	}
	//Takes care of styling the keyboard and finding the frequency. What happens when the note is released is defined in releaseNote()
	Keyborad.prototype.onReleaseNoteID = function(id){
		if("undefined" === typeof this.keyboardMap[id])
			return

		let note =  idWithinId(this.divID,id)

		let c = note.classList.contains('white')? 'white': 'black'
		note.style.backgroundColor = c=='white'? this.whiteNoteColor: this.blackNoteColor
		note.classList.remove('played')

		let frequency = getFrequency(this.keyboardMap[id])
	    this.releaseNote(frequency)
	}
	Keyborad.prototype.releaseNote = function(frequency){
		//Will be overwritten by user for custom set up

		//autosetup
		if(this.autoSetUp){
			let new_nodes = [];
        	for (let i = 0; i < this.nodes.length; i++) {
            	if (Math.round(this.nodes[i].frequency.value) === Math.round(frequency)) {
            	    this.nodes[i].stop(0);
            	    this.nodes[i].disconnect();
            	} else {
                	new_nodes.push(this.nodes[i]);
            	}
        	}
        	this.nodes = new_nodes;
		}
	}
	Keyborad.prototype.addKeyBinding = function(key,note){
		this.keysMap[key] = note;
		this.init()
	}

	//helper for finding an elemnt by ID within a specific ID
	//bad practice, but the notes id can be duplicate if multiple keyboards
	//because it serves as noth id and index
	function idWithinId(parentID,childID){
		let parent = document.getElementById(parentID)
		let children = parent.getElementsByTagName( 'div' )
		for(let i = 0;i<children.length;i++){
			if(children[i].id == childID)
				return children[i]
		}
	}
})();