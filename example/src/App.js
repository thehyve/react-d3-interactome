import React, {Component} from 'react'
import InteractomePlot from 'react-d3-interactome'
import {__options__} from './mock'

export default class App extends Component {
  componentDidMount() {
    let options = {data: __options__}
    options.el = document.getElementById('interactionsViewerMultipleTargets')
    if (options) {
      InteractomePlot.create(options)
    }
  }

  render() {
    return (
      <div>
        <div id='interactionsViewerMultipleTargets' />
      </div>
    )
  }
}
