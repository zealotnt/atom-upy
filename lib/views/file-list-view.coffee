{$$, SelectListView} = require 'atom-space-pen-views'
NewFileView = require './new-file-view'

module.exports =
class StatusListView extends SelectListView
  initialize: (@data, @action, @upySerial) ->
    super
    @show()
    @setItems @parseData @data
    @focusFilterEditor()

  parseData: (files) ->
    for line in files
      {path: line}

  getFilterKey: -> 'path'

  getEmptyMessage: -> "No file to show."

  show: ->
    @panel ?= atom.workspace.addModalPanel(item: this)
    @panel.show()
    @storeFocusedElement()

  cancelled: -> @hide()

  hide: -> @panel?.destroy()

  viewForItem: ({path}) ->
    $$ ->
      @li =>
        @span path

  confirmed: ({path}) ->
    @cancel()
    # This is a work around agains list file and remove file
    if @action == "open"
      @upySerial.upyReadFile(path)
        .then (data) ->
          newFileView = new NewFileView().createFile(path, data)
    else if @action == "remove"
      @upySerial.upyRemoveFile(path)
        .then (fileName) ->
          atom.notifications.addSuccess "Remove file \"#{ fileName }\" successfully"
