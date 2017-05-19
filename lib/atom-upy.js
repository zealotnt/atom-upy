'use babel';

import AtomUpyView from './atom-upy-view';
import { CompositeDisposable } from 'atom';
import UpySerial from './upy-serial';
import Promise from 'bluebird';
import fs from 'fs';

import FileListView from './views/file-list-view';
import PortListView from './views/port-list-view';
import NewFileView from './views/new-file-view';
import WriteFile from './views/write-file-view';

export default {

  atomUpyView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.data = null;
    this.upySerial = new UpySerial();
    this.atomUpyView = new AtomUpyView(state.atomUpyViewState);
    this.atomUpyView.addPanel()

    // this.modalPanel = atom.workspace.addModalPanel({
    //   item: this.atomUpyView.getElement(),
    //   visible: false
    // });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'atom-upy:connect': () => {
        this.connect()
      },
      'atom-upy:list-files': () => {
        this.listFiles()
      },
      'atom-upy:write-file': () => {
        this.writeFile()
      },
      'atom-upy:remove-file': () => {
        this.removeFile()
      },
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
    this.upySerial.list()
      .then((ports) => {
        portListView = new PortListView(ports, this.upySerial)
      })
  },

  listFiles() {
    this.upySerial.upyListFile()
      .then((listFiles) => {
        fileListView = new FileListView(listFiles, "open", this.upySerial)
      })
  },

  writeFile() {
    writeFile = new WriteFile(
      atom.workspace.getActivePane().getActiveItem().getTitle(),
      atom.workspace.getActivePane().getActiveItem().getText(),
      this.upySerial
    )
  },

  removeFile() {
    this.upySerial.upyListFile()
      .then((listFiles) => {
        fileListView = new FileListView(listFiles, "remove", this.upySerial)
      })
  }

};
