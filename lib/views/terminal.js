'use babel';

import Terminal from 'xterm';

export default class Term {

    constructor(element) {
      this.term_buffer = ""
      this.shellprompt = '>>> ';
      this.element = element
      // this.pyboard = pyboard
      this.element = element
      this.onMessage = function(){}
      this.lastWrite = ""
      var _this = this
      this.xterm = new Terminal({
        cursorBlink: true,
        rows:11,
        cols:120
      });

      this.xterm.on('key',function(key,ev){
        _this.termKeyPress(_this,key,ev)
      })
      this.xterm.open(element);
    }

    setOnMessageListener(cb){
      this.onMessage = cb
    }

    termKeyPress(_this,key,ev){
      var term = this.xterm
      // if (this.pyboard.connected) {
      //   if(ev.keyCode == 67) { // ctrl-c
      //     this.copy()
      //   }else if(ev.keyCode == 86){ //ctrl-v
      //     this.paste(ev)
      //   }
      //   this.userInput(key)
      // }
      this.userInput(key)
    }

    writeln(mssg){
      this.xterm.writeln(mssg)
      this.lastWrite += mssg
      if(this.lastWrite.length > 20){
        this.lastWrite = this.lastWrite.substring(1)
      }
    }

    write(mssg){
      this.xterm.write(mssg)
      this.lastWrite += mssg
      if(this.lastWrite.length > 20){
        this.lastWrite = this.lastWrite.substring(1)
      }
    }

    writeln_and_prompt(mssg){
      this.writeln(mssg+"\r\n")
      this.writePrompt()
    }

    writePrompt(){
      this.write(this.shellprompt)
    }

    enter(){
      this.write('\r\n')
    }

    clear(){
      this.xterm.clear()
      this.lastWrite = ""
    }

    userInput(input){
      this.onMessage(input)
    }

    paste(){
      this.userInput(atom.clipboard.read())
    }

    copy(ev){
      atom.clipboard.write(window.getSelection().toString())
    }

}
