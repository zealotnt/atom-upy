{Disposable, CompositeDisposable} = require 'atom'

module.exports =
class NewFileView
  createFile: (@title, @content) ->
    @textEditorView = document.createElement('atom-text-editor')
    @textEditorView.getTitle = =>
      @title
    curPane = atom.workspace.getActivePane()
    curPane.addItem(@textEditorView)
    curPane.setActiveItem(@textEditorView)
    textEditorModel = @textEditorView.getModel()
    textEditorModel.setText(@content)
