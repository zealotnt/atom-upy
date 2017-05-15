{CompositeDisposable} = require 'atom'
{$, TextEditorView, View} = require 'atom-space-pen-views'

module.exports =
class InputView extends View
  @content: ->
    @div =>
      @subview 'commandEditor', new TextEditorView(mini: true, placeholderText: 'File name to write')

  initialize: (@hint, @content, @upySerial) ->
    @disposables = new CompositeDisposable
    @currentPane = atom.workspace.getActivePane()
    @panel ?= atom.workspace.addModalPanel(item: this)
    @panel.show()
    @commandEditor.setText(@hint)
    @commandEditor.focus()

    @disposables.add atom.commands.add 'atom-text-editor', 'core:cancel': (e) =>
      @panel?.destroy()
      @currentPane.activate()
      @disposables.dispose()

    @disposables.add atom.commands.add 'atom-text-editor', 'core:confirm', (e) =>
      @disposables.dispose()
      @panel?.destroy()
      @currentPane.activate()
      @fileToWrite = @commandEditor.getText()
      @upySerial.upyWriteFile(@fileToWrite, @content)
        .then (data) ->
          filename = data.fileName
          atom.notifications.addSuccess "Write to file \"#{ data.fileName }\" successfully"
