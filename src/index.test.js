import React, { Component } from 'react'
import { rgb, scaleLinear } from 'd3'
import InteractomePlot from './index'
import { mount } from 'enzyme'
import { __options__ } from '../example/src/mock'

SVGElement.prototype.getTotalLength = () => { return 0 } // Workaround for lack of SVG support in JSdom

class ExampleComponent extends Component {
  element; /* HTMLDivElement */
  componentDidMount() {
    const interactomeColorRange = scaleLinear()
      .domain([0, 1])
      .range([rgb('#eed841'), rgb('#551a8b')])

    const newColorScale = scaleLinear()
      .domain([0, 1])
      .range(interactomeColorRange.range())

    const options = {
      data: __options__,
      el: this.element,
      colorScale: newColorScale
    }

    if (options) {
      InteractomePlot.create(options)
    }
  }

  render() {
    return (
      <>
        <div id='containerEl' ref={(e) => { this.element = e }} />
      </>
    )
  }
}

describe('ExampleComponent', () => {
  it('is truthy', () => {
    expect(ExampleComponent).toBeTruthy()
  })

  it('is mounted', () => {
    const component = mount(<ExampleComponent />)
    expect(component).toBeTruthy()
    expect(component.find('div').length).toBe(1)
  })
})
