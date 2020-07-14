/**
 * Code below is mainly adopted from https://github.com/opentargets/webapp
 * https://github.com/opentargets/webapp/blob/master/app/plugins/interactions-viewer/interactions-viewer-directive.js
 * https://github.com/opentargets/webapp/blob/master/app/src/components/multiple-targets/interactors-star-plot-directive.js
 *
 * TODO: Clean up :fish:
 */

import interactionsViewer from './interactionViewer'
import * as interactomeConfig from './config'

/**
 * Get map of names
 * @param bestHits
 * @returns {{}}
 */
const getNames = (bestHits) => {
  const mapNames = {}
  if (bestHits) {
    bestHits.forEach(bestHit => {
      // TODO: There are cases where the bestHitSearch doesn't give anything back. For now, we filter them out
      if (bestHit.data) {
        mapNames[bestHit.q] = {
          approved_symbol: bestHit.data.approved_symbol,
          association_counts: bestHit.data.association_counts,
          uniprot_id: bestHit.q,
          ensembl_id: bestHit.data.ensembl_gene_id
        }
      }
    })
  }
  return mapNames
}

/**
 * Compose interactors
 * @param data
 * @returns {{}}
 */
const composeInteractors = (data) => {
  const mapNames = getNames(data.uniprotIds.data)
  const odbData = data.interactions

  const interactors = {}
  const sourceCategories = {}
  const missingSources = {}

  odbData.forEach(function (link) {
    const sourceObj = mapNames[link.source]
    const targetObj = mapNames[link.target]

    let source, target
    if (sourceObj) {
      source = sourceObj.approved_symbol
    }
    if (targetObj) {
      target = targetObj.approved_symbol
    }

    const provenance = link.sources

    if ((source && target) && (source !== target)) {
      if (!interactors[source]) {
        interactors[source] = {
          label: source,
          interactsWith: {}
        }
      }
      if (!interactors[target]) {
        interactors[target] = {
          label: target,
          interactsWith: {}
        }
      }
      if (!interactors[source].interactsWith[target]) {
        interactors[source].interactsWith[target] = {
          label: target,
          provenance: []
        }
      }
      if (!interactors[target].interactsWith[source]) {
        interactors[target].interactsWith[source] = {
          label: source,
          provenance: []
        }
      }
      for (let f = 0; f < provenance.length; f++) {
        const prov = provenance[f]
        const sourceCat = interactomeConfig.otOmnipathdbSources[prov]
        if (!sourceCat) {
          if (!missingSources[prov]) {
            missingSources[prov] = 0
          }
          missingSources[prov]++
          continue
        }

        if (!sourceCategories[sourceCat]) {
          sourceCategories[sourceCat] = 0
        }
        sourceCategories[sourceCat]++
        interactors[source].interactsWith[target].provenance.push({
          id: prov,
          label: prov,
          source: prov,
          category: sourceCat
        })
        interactors[target].interactsWith[source].provenance.push({
          id: prov,
          label: prov,
          source: prov,
          category: sourceCat
        })
      }
      // interactors[source].interactsWith[target].provenance = provenance
    }
  })

  return [interactors, sourceCategories]
}

/**
 * Take the best interactors
 * @param interactors
 * @param n
 * @returns {ShallowWrapper|Array.<T>|string|Blob|ArrayBuffer|SharedArrayBuffer|*}
 */
const takeBestInteractors = (interactors, n) => {
  // We have more than 200 interactors
  // 'best' is based on the number of connected nodes
  // First store the number of interactors to facilitate sorting
  interactors.forEach(function (d) {
    d.nInteractors = Object.keys(d.interactsWith).length
  })

  const interactorsSelected = interactors.sort(function (a, b) {
    return b.nInteractors - a.nInteractors
  }).slice(0, n)

  // We need to eliminate the discarded nodes also from the interaction objects inside the nodes
  // interactors is now sorted, so we just have to take the slice [n,interactors.length]
  const interactorsDiscarded = interactors.slice(n, interactors.length)
  const discardedIndex = {}
  for (let i = 0; i < interactorsDiscarded.length; i++) {
    discardedIndex[interactorsDiscarded[i].label] = true
  }
  for (let j = 0; j < interactorsSelected.length; j++) {
    const interactor = interactorsSelected[j]
    for (const interacted in interactor.interactsWith) {
      if (Object.prototype.hasOwnProperty.call(interactor.interactsWith, interacted)) {
        if (discardedIndex[interacted]) {
          delete interactor.interactsWith[interacted]
        }
      }
    }
  }
  return interactorsSelected
}

/**
 * Compose interactor list
 * @param interactors
 * @returns {Array}
 */
const composeInteractorsList = (interactors) => {
  const { MAX_NODES } = interactomeConfig

  let interactorsArr = []
  const dataRange = [Infinity, 0]

  for (const inter in interactors) {
    if (Object.prototype.hasOwnProperty.call(interactors, inter)) {
      // Leave out nodes without interactions
      if (Object.keys(interactors[inter].interactsWith).length) {
        interactorsArr.push(interactors[inter])
      }
      // Calculate data range
      const il = Object.keys(interactors[inter].interactsWith).length
      dataRange[0] = il < dataRange[0] ? il : dataRange[0]
      dataRange[1] = il > dataRange[1] ? il : dataRange[1]
    }
  }

  if (interactorsArr.length > MAX_NODES) {
    console.log(interactorsArr.length + ' interactors found, limiting to ' + MAX_NODES)
    interactorsArr = takeBestInteractors(interactorsArr, MAX_NODES)
  }

  return {
    interactors: interactorsArr,
    dataRange: dataRange
  }
}

class InteractomePlot {
  static create = (options) => {
    const { data, el, onMouseOver, onMouseLeave, onSelectTarget, onDeselectTarget, onInteraction, colorScale } = options
    const interactors = composeInteractors(data)[0]
    const categories = composeInteractors(data)[1]
    const interactorsList = composeInteractorsList(interactors)

    const iv = interactionsViewer()
      .data(interactorsList.interactors.sort(function (a, b) {
        if (a.label < b.label) {
          return -1
        }
        if (a.label > b.label) {
          return 1
        }
        return 0
      }))
      .selectedNodesColors(interactomeConfig.selectedNodesColors)
      .size(500)
      .colorScale(colorScale)
      .labelSize(90)
      .on('mouseover', (node) => {
        if (onMouseOver) onMouseOver(node)
      })
      .on('mouseout', function (node) {
        if (onMouseLeave) onMouseLeave(node)
      })
      .on('select', function (selectedNode) {
        if (onSelectTarget) onSelectTarget(selectedNode)
      })
      .on('unselect', function (unselectedNode) {
        if (onDeselectTarget) onDeselectTarget(unselectedNode)
      })
      .on('interaction', function (interactors) {
        const obj = {}
        obj.header = interactors.interactor1 + ' - ' + interactors.interactor2 + ' interaction'
        obj.rows = []

        // Differentiate between sources
        const pathways = []
        const ppis = []
        const enzSubs = []

        interactors.provenance.forEach(function (p) {
          if (p.category === 'Pathways') {
            pathways.push(p)
          } else if (p.category === 'PPI') {
            ppis.push(p)
          } else if (p.category === 'Enzyme-substrate') {
            enzSubs.push(p)
          }
        })

        onInteraction && onInteraction({
          header: obj,
          currentInteractors: interactors
        })
      })
      .on('loaded', function () {
        // If the 'selected' attribute is passed, we select the node programmatically...
        // We need to wait until the star has been loaded in the screen
      })
    iv.categories = categories
    iv.dataRange = interactorsList.dataRange
    iv(el)
    return iv
  };

  static filterCategories = (cats, iv) => {
    const filterOut = {}

    /**
     * Function to get the left out current type selection
     * @param currentTypesSelection
     * @param categories
     * @returns {*[]}
     */
    const getLeftOutCategories = (currentTypesSelection, categories) => {
      const allCategories = Object.keys(categories) || []
      return allCategories.filter(cat => !currentTypesSelection.includes(cat))
    }

    // get the left out categories
    cats = cats.length && getLeftOutCategories(cats, iv.categories)

    // The filter can be in a category, so convert to individual sources
    for (let i = 0; i < cats.length; i++) {
      const cat = cats[i]
      const sourcesForCategory = interactomeConfig.otOmnipathdbCategories[cat]
      if (sourcesForCategory) {
        for (const s in sourcesForCategory) {
          if (Object.prototype.hasOwnProperty.call(sourcesForCategory, s)) {
            filterOut[s] = true
          }
        }
      }
    }
    iv.filters(filterOut)
    iv.update()
  }
}

export default InteractomePlot
