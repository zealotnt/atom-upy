'use babel';

import { Pane } from 'atom';
// import '../node_modules/xterm/dist/addons/fit/fit.js';
import Term from './views/terminal';
import ElementResize from "element-resize-detector";

export default class AtomUpyView {

  constructor(serializedState) {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('atom-upy');

    var _this = this
    this.visible = true;
    this.running_file = false
    this.synchronizing = false

    // top bar with buttons
    var topbar = document.createElement('div');
    topbar.classList.add('atom-upy-top-bar');
    this.title = topbar.appendChild(document.createElement('div'));
    this.title.classList.add('title');
    this.title.innerHTML = 'Upy Console (not connected)';

    var buttons = topbar.appendChild(document.createElement('div'));
    buttons.classList.add('buttons')
    this.button_close = buttons.appendChild(document.createElement('button'));
    this.button_close.innerHTML = 'Close';
    this.button_settings = buttons.appendChild(document.createElement('button'));
    this.button_settings.innerHTML = 'Settings';
    this.button_connect = buttons.appendChild(document.createElement('button'));
    this.button_connect.innerHTML = 'Connect';

    this.element.appendChild(topbar);

    // All button actions
    this.button_close.onclick = function(){
      _this.toggleVisibility()
    }
    this.button_connect.onclick = function(){
      // _this.connect()
    }

    topbar.onclick = function(){
      if(!_this.visible){
        // TODO: the line doesn't work yet. Clicking 'button_close' also toggles, creating unwanted behaviour
        // _this.toggleVisibility()
      }
    }

    this.button_settings.onclick = function(){
      atom.workspace.open("atom://config/packages/atom-upy")
    }

    // terminal UI elements
    this.terminal_el = document.createElement('div');
    this.terminal_el.id = "terminal"
    this.element.appendChild(this.terminal_el);

    var erd = ElementResize();
    erd.listenTo(this.terminal_el,function(element){
      if(_this.visible){
          _this.setPanelHeight()
      }

    })

    // 'click to connect' feature on complete terminal element
    this.terminal_el.onclick = function(){
      // if(!_this.pyboard.connected && !_this.pyboard.connecting) {
      //   _this.connect()
      //   console.log("User just click on terminal_el")
      // }
    }

    // terminal logic
    term = new Term(this.terminal_el)
    this.terminal = term
    term.setOnMessageListener(function(input){
      _this.userInput(input)
    })


    // Auto-reconnect after change of settings
    var first_trigger = true
    this.observeTimeout = null
    atom.config.observe('atom-upy.host',function(){

      // use timeout to not attempt connecting after each keystroke
      clearTimeout(this.observeTimeout)
      this.observeTimeout = setTimeout(function(){

        // callback triggers when loading, so filder out first trigger
        if(first_trigger){
          first_trigger = false
        }else{
            _this.connect()
        }
      },2000)
    })

    // connect on start
    this.connect()

    // hide panel if it was hidden after last shutdown of atom
    if(serializedState && 'visible' in serializedState) {
      if(!serializedState.visible){
        this.hidePanel()
      }
    }
  }

  // called when user typed a command in the terminal
  userInput(input){
    var _this = this
    this.terminal.write(input)
    // this.pyboard.send_user_input(input,function(err){
    //   if(err && err.message == 'timeout'){
    //     _this.disconnect()
    //   }
    // })
  }

  // refresh button display based on current status
  setButtonState(){
    if (!this.visible) {
      this.button_connect.classList.add('hidden')
      this.button_settings.classList.add('hidden')
      this.setTitle('not connected')
    } else if(0) {
      if (this.running_file){
      } else {
      }
      this.button_connect.innerHTML = 'Reconnect'
      this.button_settings.classList = ['']
      this.setTitle('connected')

    } else {
      this.button_connect.classList = ['']
      this.button_connect.innerHTML = 'Connect'
      this.button_settings.classList = ['']
      this.setTitle('not connected')
    }
  }

  setTitle(status){
    this.title.innerHTML = 'Upy Console ('+status+')'
  }

  connect(){
    var _this = this

    clearTimeout(this.observeTimeout)
  }

  disconnect(){
    this.terminal.writeln("Disconnected.")
    this.term_buffer = ""
    this.setButtonState()
  }

  // UI Stuff
  addPanel(){
    atom.workspace.addBottomPanel(
      {
        item: this.getElement(),
        visible: true,
        priority: 100
      }
    )
  }

  setPanelHeight(height){
    if(!height){
      height = (this.terminal_el.offsetHeight + 25)
    }
    this.element.style.height = height + "px"
  }

  hidePanel(){
    this.setPanelHeight(25) // 25px displays only the top bar
    this.button_close.innerHTML = 'Open'
    this.visible = false
    this.disconnect()
  }

  showPanel(){
    this.terminal.clear()
    this.setPanelHeight() // no param wil make it auto calculate based on xterm height
    this.button_close.innerHTML = 'Close'
    this.visible = true
    this.setButtonState()
    this.connect()
  }

  toggleVisibility(){
    this.visible ? this.hidePanel() : this.showPanel();
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {
    return {visible: this.visible}
  }

  // Tear down any state and detach
  destroy() {
    this.disconnect()
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

}
