$(document).ready(function(){ 
	hljs.initHighlightingOnLoad()
	//Set up the keyboard. settings are optional and will fall back on default values if needed
	let basicKeyborad = new Keyborad()
    
});

function createKeyboard(){
	let customKeyborad = new Keyborad({
    	divID: 'customKeyborad', //the id of the div that will contain the keyboard
    	octaves: 2, //number of octaves
    	width:600, //width of the keyboard. notes' width will depend on both width & octaves
    	height:150,//height of the whit notes
    	firstNote: 'F#2',//starting note
    	showKey:true,//display the keybindings on the notes, if any
    	autoSetUp:false,//if true, will set up an audio context and a simple synth. If not, pressNote and releaseNote functions need to be written
    	selectColor:'#7FDBFF',//color of any pressed note
    	whiteNoteColor: '#F8F8FF',//color of the classically white notes
    	blackNoteColor: '#001f3f',//color of the classically white notes
    	//Borders/Casing of the keyboard
    	borderSize: 20,//size of the left and right borders
    	borderSizeOffset: -5,//Difference between the side borders height and the notes heights
    	borderSizeTop: 100,//size of the top border
    	borderColor: '#579EBF',//color of the borders
    	borderBorderSize: 5,//size of the border's borders
    	borderBorderColor: '#001f3f',//color pf the border's borders and of the border's text, if any
    	borderRadius: 10,//radius of the borders - 0 = square
    	borderText: 'BOOYA!',//Text of the top border
    })

	//  Example of custom set up

	let context, gain, nodes = [];

    context = new AudioContext();
	mixNode = context.createGain();
	mixNode.gain.value = 0.3;
    mixNode.connect(context.destination); 

    //if autoSetUp == true, the pressNote and releaseNote functions will be prefilled
    //if not, they need to be filled with the sound playing logic

    //for each note, the synth will play 2 oscillators at the note frequency
    customKeyborad.pressNote = function(frequency){
    	let oscillators = [];

		let osc = context.createOscillator();
        osc.type = 'square';
        oscillators.push(osc)

        let osc2 = context.createOscillator();
        osc2.type = 'sawtooth';
        osc2.detune.value = 10;
        oscillators.push(osc2)

        oscillators.forEach(o =>{
        	o.frequency.value = frequency ;
	        o.connect(mixNode);
	        o.start(0);
	        nodes.push(o);
        })
	}

	//for each key released, the synth will loop through the oscillators, check the frequency, and stop them if necessary 
	customKeyborad.releaseNote = function(frequency){
	    let newNodes = [];
        for (let i = 0; i < nodes.length; i++) {
            if (Math.round(nodes[i].frequency.value) === Math.round(frequency)) {
                nodes[i].stop(0);
                nodes[i].disconnect();
            } else {
                newNodes.push(nodes[i]);
            }
        }
        nodes = newNodes;
	}

	//example of adding a new key binding
	//by default keys A through L are binded to C3 through C4
	customKeyborad.addKeyBinding('Z','F#2')
	customKeyborad.addKeyBinding('X','F#4')
}









