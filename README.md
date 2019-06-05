# react-d3-interactome

> 

[![NPM](https://img.shields.io/npm/v/react-d3-interactome.svg)](https://www.npmjs.com/package/react-d3-interactome) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save react-d3-interactome
```

## Usage

```jsx
import React, { Component } from 'react'

import Interactome from 'react-d3-interactome'

class Example extends Component {
  componentDidMount() {
    const interactomeColorRange = scaleLinear()
    .domain([0, 1])
    .range([rgb('#eed841'), rgb('#551a8b')])
  
    const newColorScale = scaleLinear()
      .domain([0, 1])
      .range(interactomeColorRange.range())
        
    let options = {
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
```

Check the `/example` for more details.

## License

GPL-3.0-or-later © [rnugraha](https://github.com/rnugraha)
