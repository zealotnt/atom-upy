'use babel';

import AtomUpyView from './atom-upy-view';
import { CompositeDisposable } from 'atom';
import UpySerial from './upy-serial';
import Promise from 'bluebird';
import fs from 'fs';

export default {

  atomUpyView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.data = null;
    this.upySerial = new UpySerial();
    this.atomUpyView = new AtomUpyView(state.atomUpyViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.atomUpyView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'atom-upy:connect': () => {
        this.connect()
      }
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.atomUpyView.destroy();
  },

  serialize() {
    return {
      atomUpyViewState: this.atomUpyView.serialize()
    };
  },

  connect() {
    var _this = this;

    // this.upySerial.list()
    //   .then((ports) => {
    //     console.log(ports);
    //     return this.upySerial.connect('/dev/ttyUSB0');
    //   })
    //   .then(() => {
    //     console.log('connect successfully');
    //   })

    fs.readFile('../package.json', {encoding: 'utf-8'}, function(err,data){
      _this._data = data;
      if (!err){
        _this.upySerial.connect('/dev/ttyUSB0')
          .then(() => {
            console.log("Connect success");
            return _this.upySerial.upyListFile();
          })
          .then((listFiles) => {
            console.log('ret from upyListFile: ', listFiles)
            return _this.upySerial.upyWriteFile('test.txt', _this._data)
          })
          .then((data) => {
            console.log('ret of UpyWriteFile: ', data);
            return _this.upySerial.upyReadFile('test.txt');
          })
          .then((data) => {
            console.log('Read back: ', data);
            return _this.upySerial.upyRemoveFile('test.txt');
          })
          .then(() => {
            console.log("remove file success");
            return _this.upySerial.upyListFile();
          })
          .then((listFiles) => {
            console.log('ret from upyListFile: ', listFiles);
          })
          .catch((error) => {
            console.log(error);
          })
      } else {
          console.log(err);
      }
    });

  },
};
