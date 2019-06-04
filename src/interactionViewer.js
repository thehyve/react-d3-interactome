/**
 * ================================================
 * Interactions viewer for the Open Targets project
 * ================================================
 * Source: https://github.com/opentargets/interactionsViewer/blob/master/src/interactionsViewer.js
 * Commit version: 495fbed32087f9800ca5483be01f4c865e1c27a5
 */

import apijs from 'tnt.api'
import * as d3 from 'd3'

export default function () {
  let dispatch = d3.dispatch('click', 'dblclick', 'mouseover', 'mouseout', 'select', 'unselect', 'interaction', 'loaded')

  let config = {
    // filters: {'Reactome': true},
    filters: {},
    data: [],
    selectedNodesColors: ['#ffe6e6', '#e6ecff'],
    // mirrorLinks: true,
    size: 500, // default graph size
    labelSize: 100,
    nodeArc: 12,
    colorScale: d3.scaleLinear()
      .range([d3.rgb('#FFF500'), d3.rgb('#007AFF')]) // The domain is set dynamically
  }

  let fixedNodes = new Map()
  let nodes = new Map() // contains a map of the nodes
  let radius
  let labels
  let graph
  let svg

  let loaded = false

  const render = function (div) {
    if (!div) {
      console.error('No container DOM element provided')
      return
    }

    // Set the domain of the color scale based on the real data length
    const dataDomain = calcInteractionsDomain(config.data)
    config.colorScale.domain(dataDomain)

    // Calculates how much space is needed for the whole visualisation given the number of nodes / labels
    radius = calcRadius(config.data.length, config.nodeArc)
    let diameter = radius * 2

    let size = diameter + (2 * config.labelSize)
    if (size < config.size) {
      size = config.size
      diameter = size - (2 * config.labelSize)
      radius = ~~(diameter / 2)
    } else {
      config.size = size
    }

    // svg
    svg = d3.select(div)
      .append('div')
      .style('position', 'relative')
      .append('svg')
      .attr('width', config.size)
      .attr('height', config.size)

    graph = svg
      .append('g')
      .attr('transform', `translate(${radius + config.labelSize},${radius + config.labelSize})`)

    update()
    // dispatch.loaded()

    render.update = updateLinks

    // // This function ensures that if A links to B, there is also a link from B to A
    // function mirrorLinks() {
    //     let data = config.data
    //     for (let d of data) {
    //         // For every node in the interactions set
    //         let interactors = d.interactsWith
    //         for (let [interName, inter] of interactors) {
    //             let prov = inter.provenance
    //             // Check that the interactor has this provenance as well...
    //         }
    //     }
    // }

    function update() {
      let data = config.data
      let stepRad = 360 / data.length
      let currAngle = -1.6
      let diameter = radius * 2

      // Calculate the angles for each node
      // And store the nodes in a Map
      for (let node of data) {
        node.angle = currAngle
        // angles.set(node.label, node.angle)
        nodes.set(node.label, node)
        currAngle += (stepRad * Math.PI / 180)
      }

      // Labels
      // Central
      // graph.append('g')
      //     .append('circle')
      //     .attr('cx', 0)
      //     .attr('cy', 0)
      //     .attr('r', 5)
      //     .attr('fill', '#005299')

      // All other labels
      labels = graph.selectAll('.openTargets_interactions_label')
        .data(data, d => d.label)
        .enter()
        .append('g')
        .attr('class', 'openTargets_interactions_label')
        .attr('transform', (d) => {
          const x = diameter / 2 * Math.cos(d.angle)
          const y = diameter / 2 * Math.sin(d.angle)
          return (`translate(${x},${y})`)
        })
        .attr('fill', 'grey')
        .on('mouseover', function (d) { // No arrow function here because we need the moused over element as _this_
          dispatch.call('mouseover', this, d)
        })
        .on('mouseout', function (d) { // No arrow function here because we need the moused over element as _this_
          dispatch.call('mouseout', this, d)
        })
        .on('click', function (d) { // No arrow function here because we need the moused over element as _this_
          // dispatch.click.call(this, d)
          fix.call(this, d, true)
        })

      // Labels
      labels
        .insert('text')
        .style('font-size', '12px')
        .style('text-anchor', (d) => {
          let grades = d.angle * 180 / Math.PI
          if (grades % 360 > 90 && grades % 360 < 275) {
            return 'end'
          }
          return 'start'
        })
        .text(d => d.label)
        .attr('alignment-baseline', 'central')
        .attr('transform', (d) => {
          let grades = d.angle * 180 / Math.PI
          if (grades % 360 > 90 && grades % 360 < 275) {
            return `translate(${10 * Math.cos(d.angle)},${10 * Math.sin(d.angle)}) rotate(${grades % 360 + 180})`
          }
          return `translate(${10 * Math.cos(d.angle)},${10 * Math.sin(d.angle)}) rotate(${grades % 360})`
        })

      // Nodes
      labels
        .insert('circle')
        // .attr('fill', '#005299')
        .attr('fill', (data) => {
          return config.colorScale(Object.keys(data.interactsWith).length)
        })
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', 5)

      updateLinks()

      // Simulates a click in a node
      // fireEvent tells the function if the select/unselect action (in the fix function) should fire a 'select'/'unselect' event back
      render.click = function (node, fireEvent) {
        if (fireEvent !== false) {
          fireEvent = true
        }

        // Find the element for the node
        let elem
        d3.selectAll('.openTargets_interactions_label')
          .each(function (d) {
            if (d.label === node.label) {
              elem = this
            }
          })

        if (elem) {
          fix.call(elem, node, fireEvent)
          // config.clickNode = {
          //     element: elem,
          //     node: node
          // }
        } else {
          throw (new Error('Cannott find node'))
        }
      }
    }

    function calcInteractionsDomain(data) {
      let min = Infinity
      let max = 0
      for (let i = 0; i < data.length; i++) {
        let d = data[i]
        let il = Object.keys(d.interactsWith).length
        if (il > max) {
          max = il
        }
        if (il < min) {
          min = il
        }
      }
      return [min, max]
    }
  }

  // render.filter = function (obj) {
  //     // The cbak is run on every link and is expected to return true or false.
  //     console.log(`I have been asked to leave out the following links...`)
  //     console.log(obj)
  //     console.log(`So I am going to inspect the current data to leave them out...`)
  //     console.log(config.data)
  // }

  apijs(render)
    .getset(config)

  // Extra functions
  function fixedNodesHasLinkWith(node) {
    let interacts = false
    fixedNodes.forEach(function (val, key) {
      // for (let [key, inter] of Object.entries(val.interactsWith)) {
      for (let key of Object.keys(val.interactsWith)) {
        let inter = val.interactsWith[key]
        if (inter.label === node.label) {
          interacts = true
          break
        }
      }
    })
    return interacts
  }

  function fix(node, events) { // if events is truth-y, fire events for each select / unselect action
    const clickedNode = this

    // Specs:
    // 1. If there is no other node selected, select this one
    // 2. If there is another node selected and there is a connection between both, show details
    // 3. If there is another node selected and there is no connection between them, this one is the only selected
    // 4. If the selected node is already selected, deselect it
    // 5. If the are already 2 selected nodes and this is not one of them, select only this one.

    // TODO: dispatching select and unselect should be done centrally by combining the operations on the Map with the dispathing
    // Case 1
    if (!fixedNodes.size) {
      fixedNodes.set(node.label, node)
      if (events) {
        select.call(clickedNode, node)
      }
      dispatch.call('select', clickedNode, node)
    } else if (fixedNodes.has(node.label)) {
      fixedNodes.delete(node.label)
      if (events) {
        dispatch.call('unselect', clickedNode, node)
      }
      if (!fixedNodes.size) { // We only had 1 node selected and is now unselected
        // Case 4
        unselect.call(clickedNode, node)
      } else {
        // We have deselected, but there is still one selected. So take the other one and select it
        let otherNode = fixedNodes.keys().next().value
        select.call(clickedNode, fixedNodes.get(otherNode))
        // fixedNodes.set(node.label, node)
      }
    } else { // New node selected...
      // If there are already 2 nodes selected, select only this one
      if (fixedNodes.size === 2) {
        select.call(clickedNode, node)
        fixedNodes.clear()
        fixedNodes.set(node.label, node)
        if (events) {
          dispatch.call('select', clickedNode, node)
        }
      } else { // There is already one node selected. Two cases here: there exists a connection between them or not
        if (fixedNodesHasLinkWith(node)) {
          fixedNodes.set(node.label, node)
          if (events) {
            dispatch.call('select', clickedNode, node)
          }
          select2.call(clickedNode, fixedNodes)
        } else { // No link between both, so just select
          fixedNodes.clear()
          fixedNodes.set(node.label, node)
          if (events) {
            dispatch.call('select', clickedNode, node)
          }
          select.call(clickedNode, node)
        }
      }
    }
  }

  // Compute the links given the data we have, the source/provenance filters that have been applied and the clicked (selected) nodes
  function computeLinks() {
    let data = config.data
    let filters = config.filters

    // A list of links between 2 nodes based on the data points and the filters on the sources
    let links = []

    for (let d of data) {
      // Reset the current sets of interactors
      // It has to be done in advance because we mirror interactors (if A->B, then B->A also in the currentInteractors), but this mirror can be lost when we get to that node (B)
      d.currentInteractors = {}
    }

    for (let d of data) {
      // if (!d.currentInteractors) {
      // Reset the current set of iteractors
      // d.currentInteractors = {}
      // }
      // if there are fixed nodes, check that this is one of them...
      if (fixedNodes.size) {
        if (!fixedNodes.get(d.label)) {
          continue
        }
      }
      for (let interName in d.interactsWith) {
        if (d.interactsWith.hasOwnProperty(interName)) {
          // If two nodes are selected, this has to be there are well
          if (fixedNodes.size === 2) {
            if (!fixedNodes.get(interName)) {
              continue
            }
          }

          let inter = d.interactsWith[interName]

          let possibleInteraction = {
            source: d,
            target: interName,
            provenance: []
          }

          for (let prov of inter.provenance) {
            // If the source has not been filtered out, include it
            if (!filters[prov.source]) {
              possibleInteraction.provenance.push(prov)
            }
          }
          if (possibleInteraction.provenance.length) {
            // We have sources supporting this interaction

            // Only include the possible interaction if there is no fixed node or a fixed node is involved
            d.currentInteractors[interName] = inter
            let linkedNode = nodes.get(interName)
            linkedNode.currentInteractors[d.label] = d
            links.push(possibleInteraction)
          }
        }
      }
    }
    return links
  }

  function updateLinks() {
    let linksData = computeLinks()
    let diameter = radius * 2

    let links = graph.selectAll('.openTargets_interactions_link')
      .data(linksData, (d) => [d.source.label, d.target].join('-'))

    // Fancy transition, inspired from: http://bl.ocks.org/duopixel/4063326
    links.exit()
      .each(function (d) {
        let el = this
        d.totalLength = el.getTotalLength()
      })
      .attr('stroke-dasharray', (d) => d.totalLength + ' ' + d.totalLength)
      .attr('stroke-dashoffset', 0)
      .transition()
      .duration(500)
      // .ease('linear')
      .attr('stroke-dashoffset', (d) => d.totalLength)
      .remove()

    // New links
    links
      .enter()
      .append('path')
      .attr('class', 'openTargets_interactions_link')
      .attr('stroke-dasharray', (d) => d.totalLength + ' ' + d.totalLength)
      .attr('stroke-dashoffset', 0)
      .attr('d', (d) => {
        let fromAngle = d.source.angle + 0.001
        let toAngle = nodes.get(d.target).angle + 0.001
        let fromX = (diameter - 7) / 2 * Math.cos(fromAngle)
        let fromY = (diameter - 7) / 2 * Math.sin(fromAngle)
        let toX = (diameter - 7) / 2 * Math.cos(toAngle)
        let toY = (diameter - 7) / 2 * Math.sin(toAngle)
        return `M${fromX},${fromY} Q0,0 ${toX},${toY}`
      })
      .attr('fill', 'none')
      .attr('stroke', 'grey')
      .attr('stroke-width', 1)
      .each(function (d) {
        let el = this
        d.totalLength = el.getTotalLength()
      })
      .attr('stroke-dasharray', (d) => d.totalLength + ' ' + d.totalLength)
      .attr('stroke-dashoffset', (d) => d.totalLength)
      .transition()
      .duration(500)
      // .ease('linear')
      .attr('stroke-dashoffset', 0)

    // Labels --

    // Remove the background for prev selected labels:
    d3.selectAll('.openTargets_background_removeMe').remove()

    // Remove the `unselect` elements on the labels
    d3.selectAll('.openTargets_unselect_removeMe').remove()

    // The method 'entries' called on an iterable returns a new Iterator object for each element in insertion order
    // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Map
    // Remove all the colours
    for (let node of config.data) {
      delete node.color
    }

    // Set the color of the selected nodes
    let count = 0
    for (let fixedNode of fixedNodes) {
      fixedNode[1].color = config.selectedNodesColors[count++]
    }

    // For nodes, show only those that have links selected.
    let n = 0
    labels
      .style('visibility', 'visible')
      .transition()
      .duration(500)
      .attr('opacity', (data) => {
        if (data.currentInteractors && Object.keys(data.currentInteractors).length) {
          return 1
        }
        return 0
      })
      .each(function () {
        n++
      })
      .each(function () {
        d3.select(this)
          .style('visibility', (data) => {
            if (data.currentInteractors && Object.keys(data.currentInteractors).length) {
              return 'visible'
            }
            return 'hidden'
          })

        // Notify we have now finished rendering
        // Only for the first time
        if (loaded === false && !--n) {
          loaded = true
          dispatch.call('loaded')
        }

        // If there is any node to click, do it now
        // if (config.clickNode && config.clickNode.node.label === d.label) {
        //     console.log('simulating a click in node...')
        //     console.log(config.clickNode)
        //     fix.call(config.clickNode.element, config.clickNode.node, true)
        // }
      })
      .each(function (d) {
        let color = d.color
        if (!color) {
          return
        }

        // d3.select(this)
        //     .select('text')
        //     .each(function (d) {
        //         let text = d3.select(this)
        //         let currText = text.text()
        //         text.text(`${currText}` + '[x]')
        //
        //     })

        // We create a new text element to know its size...
        let textAux = svg.append('text').text(d.label)
        const textBBox = textAux.node().getBBox()
        textAux.remove()

        // If it has color -> it has been selected -> add an `unselect` icon at the end of the label
        let offset = 5
        let closer = d3.select(this)
          .append('g')
          .attr('class', 'openTargets_unselect_removeMe')

        // closer.append('rect')
        //     .attr('x', (6 + textBBox.width))
        //     .attr('y', -~~(textBBox.height / 2))
        //     .attr('width', textBBox.height)
        //     .attr('height', textBBox.height)
        //     .attr('fill', 'cyan')
        //     .attr('transform', (d) => {
        //         let grades = d.angle * 180 / Math.PI
        //         return `rotate(${grades % 360})`
        //     })
        closer.append('line')
          .attr('x1', (6 + textBBox.width) + offset)
          .attr('y1', -~~(textBBox.height / 2) + offset)
          .attr('x2', (6 + textBBox.width + textBBox.height) - offset)
          .attr('y2', -~~(textBBox.height / 2) + textBBox.height - offset)
          .attr('stroke', 'black')
          .attr('stroke-width', 2)
          .attr('transform', (d) => {
            let grades = d.angle * 180 / Math.PI
            return `rotate(${grades % 360})`
          })
        closer.append('line')
          .attr('x1', (6 + textBBox.width) + offset)
          .attr('y1', -~~(textBBox.height / 2) + textBBox.height - offset)
          .attr('x2', (6 + textBBox.width + textBBox.height) - offset)
          .attr('y2', -~~(textBBox.height / 2) + offset)
          .attr('stroke', 'black')
          .attr('stroke-width', 2)
          .attr('transform', (d) => {
            let grades = d.angle * 180 / Math.PI
            return `rotate(${grades % 360})`
          })

        // Then we create the rect with the given dimensions
        let rect = d3.select(this)
          .append('rect')
          .attr('class', 'openTargets_background_removeMe')
          .attr('x', 6)
          .attr('y', -~~(textBBox.height / 2))
          .attr('width', textBBox.width + 2)
          .attr('height', textBBox.height)
          .attr('fill', color)
          .attr('transform', (d) => {
            let grades = d.angle * 180 / Math.PI
            return `rotate(${grades % 360})`
          })
        // Move the element back
        this.insertBefore(rect.node(), this.firstChild)
      })

    // labels
    //     .each(function (source) {
    //         let fromAngle = source.angle
    //         for (let dest of Object.values(source.interactsWith)) {
    //             let toAngle = k.get(dest.label)
    //             let fromX = (diameter - 7) / 2 * Math.cos(fromAngle)
    //             let fromY = (diameter - 7) / 2 * Math.sin(fromAngle)
    //             let toX = (diameter - 7) / 2 * Math.cos(toAngle)
    //             let toY = (diameter - 7) / 2 * Math.sin(toAngle)
    //             graph.append('path')
    //             //.datum(source)
    //                 .datum({
    //                     source: source,
    //                     dest: dest
    //                 })
    //                 .attr('class', 'openTargets_interactions_link')
    //                 // .attr('d', `M${fromX},${fromY} Q0,0 ${toX},${toY}`)
    //                 .attr('d', (d) => {
    //                     console.log(`${d.source.label} -- ${d.target} (${fromAngle}:${toAngle}) => M${fromX},${fromY} Q0,0 ${toX},${toY}`)
    //                     return `M${fromX},${fromY} Q0,0 ${toX},${toY}`
    //                 })
    //                 .attr('fill', 'none')
    //                 .attr('stroke', '#1e5799')
    //                 .attr('stroke-width', 1)
    //         }
    //     })
  }

  function unselect(d) {
    updateLinks()
    // dispatch.unselect.call(this, d)

    // d3.selectAll('.openTargets_interactions_link')
    //     .attr('opacity', 1)
    // d3.selectAll('.openTargets_interactions_label')
    //     .attr('fill', 'grey')
    //     .attr('opacity', 1)
    // d3.select(this).attr('fill', 'grey')
  }

  function select(d) {
    // dispatch.select.call(this, d)
    // fade out other links

    updateLinks()
    // d3.selectAll('.openTargets_interactions_link')
    //     .attr('opacity', (data) => {
    //         if (d.label === data.source.label) {
    //             return 1
    //         }
    //         return 0
    //     })
    //
    // // fade out the labels / nodes
    // d3.selectAll('.openTargets_interactions_label')
    //     .attr('fill', (data) => {
    //         if (d.label === data.label) {
    //             return 'red'
    //         }
    //         return 'grey'
    //     })
    //     .attr('opacity', (data) => {
    //         if (d.label === data.label) {
    //             return 1
    //         }
    //         for (let inter of Object.values(data.interactsWith)) {
    //             if (inter.label === d.label) {
    //                 return 1
    //             }
    //         }
    //         return 0
    //     })
  }

  function select2(fixedNodes) {
    // dispatch.select.call(this, d3.select(this).datum())
    const clickedNode = this
    // d3.select(this).attr('fill', 'red')

    // dispatch.select2.call(this, d)
    // fade out other links
    // d3.selectAll('.openTargets_interactions_link')
    //     .attr('opacity', (data) => {
    //         if (fixedNodes.has(data.source.label) && fixedNodes.has(data.target)) {
    //             return 1
    //         }
    //         return 0
    //     })
    //
    // // fade out other labels
    // d3.selectAll('.openTargets_interactions_label')
    //     .attr('opacity', (data) => {
    //         if (fixedNodes.has(data.label)) {
    //             return 1
    //         }
    //         return 0
    //     })

    updateLinks()

    let iNames = []
    for (const iName of fixedNodes.keys()) {
      iNames.push(iName)
    }

    let provenance = new Map()
    addProvenance(fixedNodes.get(iNames[0]).interactsWith, fixedNodes.get(iNames[1]).label, provenance)
    addProvenance(fixedNodes.get(iNames[1]).interactsWith, fixedNodes.get(iNames[0]).label, provenance)
    let interObj = {
      interactor1: iNames[0],
      interactor2: iNames[1],
      provenance: Array.from(provenance.values())
    }

    // Fire the interaction event
    dispatch.call('interaction', clickedNode, interObj)
  }

  function addProvenance(iw, i2, provenance) {
    Object.keys(iw).forEach(function (i) {
      if (iw[i].label === i2) {
        // interactions = iw[i].provenance
        for (let p of iw[i].provenance) {
          provenance.set(p.id, p)
        }
      }
    })
  }

  function calcRadius(n, nodeArc = config.nodeArc) {
    // Given the number of nodes to allocate in the circumference and the arc that each node needs, calculate the minimum radius of the plot
    // 2 * PI * r = totalArc = nodeArc * n
    return ~~(nodeArc * n / (2 * Math.PI))
  }

  // Copies a variable number of methods from source to target.
  function rebind(target, source) {
    var i = 1
    var n = arguments.length
    var method
    while (++i < n) target[method = arguments[i]] = d3Rebind(target, source, source[method])
    return target
  }

  /**
   * Method is assumed to be a standard D3 getter-setter:
   * If passed with no arguments, gets the value.
   * If passed with arguments, sets the value and returns the target.
   * @param target
   * @param source
   * @param method
   * @returns {function(): *}
   */
  function d3Rebind(target, source, method) {
    return function () {
      var value = method.apply(source, arguments)
      return value === source ? target : value
    }
  }

  return rebind(render, dispatch, 'on')
}
