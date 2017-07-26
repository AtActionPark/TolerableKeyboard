//Creates a small keyboard, with styling, mouse and key bindings, that can be plugged in easily to the web audio API
(function(){
	let self = this;
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
		this.autoSetUp = settings.autoSetUp || true;

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
		let div = '#' + this.divID
		//If we cant find the div, create one an append it directly to the body
		if (!$(div).length)
			$('body').append('<div id="' + this.divID + '"</div>')
		//Empty it (needs to be rebuilt after changing key bindings)
		$(div).empty()
		$(div).css("height", this.noteHeight+this.borderSizeTop);
		$(div).css("width", this.width);

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
		$(div).append('<ul style=" margin:0px;list-style-type: none;position: relative;" ondragstart="return false;" ondrop="return false;"></ul>')
		
		//notes positions in the div are based on ID, if we skip ids (we dont start on a C), we need to offset the notes position.
		//If we start on a sharp note, the offset is slightly different
		let offset = alteration =="#"?-this.noteWidth/2:0

		//add all the notes, from the first one to first one + X octaves
		let id = 0;
		//Super messy ...
		for(let i = 0;i<this.octaves*7 +orderNotes[orderOfFirstNote] + 1 ;i++){
			//for each i, add one white note, starting after we reach the user requested first note
			//Only add a note if the id has reached the user start note
			if(id>=orderOfFirstNote && ( i < this.octaves*7 +orderNotes[orderOfFirstNote] + 1 || alteration =='#'))
				$(div + " ul").append('<li>' + this.createNote('white',this.noteWidth*i-offset + this.borderSize + this.borderBorderSize ,id)+ '</li>')
			//if we dont add a note, offset the notes position
			else
				offset+=this.noteWidth

			id++;

			//and add one black note, except for E and B (no #)
			if(i%7 != 2 && i%7 != 6){
				if(id>=orderOfFirstNote && ( i < this.octaves*7 +orderNotes[orderOfFirstNote] + (alteration == '#'?1:0)))
					$(div + " ul").append('<li>' + this.createNote('black',this.noteWidth*i+this.noteWidth/3*2-offset+ this.borderSize +  this.borderBorderSize,id)+ '</li>')
				id++;
			}
		}

		//Add borders div to the keyboard if necessary
		if(this.borderSize>0 || this.borderSizeTop>0){
			
			let borderTop = 'border-top: '+ this.borderBorderSize +'px solid ' + this.borderBorderColor+ ';'
			let borderLeft = 'border-left: '+ this.borderBorderSize +'px solid ' + this.borderBorderColor+ ';'
			let borderRight = 'border-right: '+ this.borderBorderSize +'px solid ' + this.borderBorderColor+ ';'
			let borderBottom = 'border-bottom: '+ this.borderBorderSize +'px solid ' + this.borderBorderColor+ ';'

			let borderTopLeftRadius = 'border-top-left-radius: '+this.borderRadius+'px;'
			let borderTopRightRadius = 'border-top-right-radius: '+this.borderRadius+'px;'
			let borderBottomLeftRadius = 'border-bottom-left-radius: '+this.borderRadius+'px;'
			let borderBottomRightRadius = 'border-bottom-right-radius: '+this.borderRadius+'px;'

			let backgroundColor = 'background-color:'+ this.borderColor+';'

			let width= 'width:' + (this.borderSize + this.width/2) + 'px;'
			let height= 'height:'+(this.noteHeight + this.borderSizeTop -1*this.borderBorderSize + this.borderSizeOffset)+'px;'

			let textStyle = 'text-align:center;font-weight:bold;font-size:' + this.borderSizeTop*5/6+ 'px; color:' + this.borderBorderColor+ ';'
			let noSelect = '-webkit-touch-callout: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;'
			let zIndex = "z-index : -100;"


			$(div).append('<div class="keyboradTop" style="' + zIndex+textStyle + noSelect+ borderTop +  borderLeft + borderRight + borderTopLeftRadius +borderTopRightRadius + 'top:0px;width:'+(this.width + this.borderBorderSize-3)+'px;height:'+this.borderSizeTop+'px; px;'+ backgroundColor +'">' + this.borderText + '</div>')
			$(div).append('<div class="keyboradLeft" style="' + zIndex + borderTop +borderBottom+ borderLeft + borderBottomLeftRadius + borderTopLeftRadius + ' position: relative;top:-' + (this.borderSizeTop + this.borderBorderSize) + 'px;left:0px; '+ width + height+ backgroundColor +'"></div>')
			$(div).append('<div class="keyboradRight" style="' + zIndex+ borderTop +borderBottom+ borderRight + borderBottomRightRadius + borderTopRightRadius + 'position:relative;top:-' + (2*this.borderSizeTop+this.noteHeight + 2*this.borderBorderSize+this.borderSizeOffset)+ 'px;left:'+ (this.width - this.borderSize -this.width/2+ this.borderBorderSize+2) +'px;'+ width + height+backgroundColor +'"></div>')
		}

		//For each note div created, add mouse listeners
		let self = this;
		let nDiv = '#' + this.divID + ' .note'
		$(nDiv).mousedown(function(){
			let id = $(this).attr('id')
			mouseIsDown = true;
			self.onPressNoteID(id)
		});
		$(nDiv).mouseup(function(){
			let id = $(this).attr('id')
			self.onReleaseNoteID(id)
		});
		$(nDiv).mouseenter(function(){
			if(!mouseIsDown)
				return
			let id = $(this).attr('id')
			self.onPressNoteID(id)
		});
		$(nDiv).mouseleave(function(){
			if(!mouseIsDown)
				return
			if($(this).hasClass('played')){
				let id = $(this).attr('id')
				self.onReleaseNoteID(id)
			}
		});
		$(document).mouseup(function(){
			mouseIsDown = false;
		});
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
		let colorClass = '"class="note ' + color + '"'

		let pos = 'position:absolute; left:' + position + 'px;top:' +(this.borderSizeTop + this.borderBorderSize) + 'px;'

		let w = color == 'white'? this.noteWidth : this.noteWidth*2/3;
		let h = color == 'white'? this.noteHeight : this.noteHeight*5.5/9;
		let width  = 'width:'+ w+'px;'
		let height  = 'height:'+ h+'px;'

		let colorBackground = 'background-color: ' + (color == 'white'? this.whiteNoteColor:this.blackNoteColor) + ';'
		let border = 'border: 1px solid black; border-bottom-left-radius: 5px;border-bottom-right-radius: 5px;'
		
		//black keys show on top
		let zIndex = color == 'black' ? 'z-index: 10;' : ''


		//If we want to display key bindings on keyboard
		let keyBindingKey = '';
		
		if(this.showKey){
			//Find the key char associated to the note, if it exists
			let key = getKeyByValue(this.keysMap,this.keyboardMap[id]);
			if( key == undefined ) key = ''
			let noSelect = '-webkit-touch-callout: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;'
			let markingColor = color == 'white'? 'color: ' + this.blackNoteColor + ';': 'color:' + this.whiteNoteColor + ';' 
			let offset = color=='white'? this.noteWidth/3 : this.noteWidth/6
			let markingPosition = 'position:absolute;bottom:0px;padding:' + offset + 'px;'

			keyBindingKey = '<div style="' +  noSelect + markingColor + markingPosition + '">' + key + '</div'
		}
		
		//Full div/css for a single note
		return  '<div  id="' + id + colorClass + '" style = "font-weight:bold;'+  pos + width +  height +  colorBackground + border + zIndex +'">'+keyBindingKey +'</div>'
	}
	//Takes care of styling the keyboard and finding the frequency. What happens when the note is pressed is defined in pressNote()
	Keyborad.prototype.onPressNoteID = function(id){
		if("undefined" === typeof this.keyboardMap[id])
			return
		let nDiv = '#' + this.divID + ' #' + id
		$(nDiv).css('background-color', this.selectColor)
		$(nDiv).addClass('played')

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
		let nDiv = '#' + this.divID + ' #' + id
		let c = $(nDiv).hasClass('white')? 'white': 'black'
		$(nDiv).css('background-color', (c=='white'? this.whiteNoteColor: this.blackNoteColor))
		$(nDiv).removeClass('played')

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
})();