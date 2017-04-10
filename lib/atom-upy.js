'use babel';

import AtomUpyView from './atom-upy-view';
import { CompositeDisposable } from 'atom';

export default {

  atomUpyView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.atomUpyView = new AtomUpyView(state.atomUpyViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.atomUpyView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'atom-upy:toggle': () => this.toggle()
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

  toggle() {
    console.log('AtomUpy was toggled!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  }

};
