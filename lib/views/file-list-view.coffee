{$$, SelectListView} = require 'atom-space-pen-views'

module.exports =
class StatusListView extends SelectListView
  initialize: (@data) ->
    super
    @show()
    @setItems @parseData @data
    @focusFilterEditor()

  parseData: (files) ->
    for line in files
      {path: line}

  getFilterKey: -> 'path'

  getEmptyMessage: -> "Nothing to commit, working directory clean."

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

  confirmed: ({type, path}) ->
    @cancel()