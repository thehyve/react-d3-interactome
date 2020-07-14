import React, { Component } from 'react'
import InteractomePlot from 'react-d3-interactome'
import { __options__ } from './mock'
import { rgb, scaleLinear } from 'd3'

export default class App extends Component {
  componentDidMount() {
    const interactomeColorRange = scaleLinear()
      .domain([0, 1])
      .range([rgb('#eed841'), rgb('#551a8b')])

    const newColorScale = scaleLinear()
      .domain([0, 1])
      .range(interactomeColorRange.range())

    const options = {
      data: __options__,
      el: document.getElementById('containerEl'),
      colorScale: newColorScale
    }

    if (options) {
      InteractomePlot.create(options)
    }
  }

  render() {
    return (
      <div>
        <div id='containerEl' />
      </div>
    )
  }
}
