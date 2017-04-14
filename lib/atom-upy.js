'use babel';

import AtomUpyView from './atom-upy-view';
import { CompositeDisposable } from 'atom';
import UpySerial from './upy-serial';
import Promise from 'bluebird';

export default {

  atomUpyView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
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
    this.upySerial.list()
      .then((ports) => {
        console.log(ports);
      });
  },

};
