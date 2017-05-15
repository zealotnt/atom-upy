{$$, SelectListView} = require 'atom-space-pen-views'

module.exports =
class StatusListView extends SelectListView
  initialize: (@data, @upySerial) ->
    super
    @show()
    @setItems @parseData @data
    @focusFilterEditor()

  parseData: (files) ->
    for line in files
      {path: line}

  getFilterKey: -> 'path'

  getEmptyMessage: -> 'No file to show.'

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
    @upySerial.connect(path)
      .then () ->
        atom.notifications.addSuccess "Connect #{ path } successfully"
