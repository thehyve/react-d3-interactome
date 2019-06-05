import {rgb, scaleLinear} from 'd3'

export const MAX_NODES = 180
export const selectedNodesColors = ['#ffe6e6', '#e6ecff']

export const colorScales = {
  PURPLE_0_1: scaleLinear()
    .domain([0, 1])
    .range([rgb('#eed841'), rgb('#551a8b')]),
  BLUE_0_1: scaleLinear()
    .domain([0, 1])
    .range([rgb('#CBDCEA'), rgb('#005299')]),
  BLUE_1_10: scaleLinear()
    .domain([1, 10])
    .range(['#CBDCEA', '#005299']),
  BLUE_1_3: scaleLinear()
    .domain([1, 3])
    .range(['#B6DDFC', '#0052A3']),
  BLUE_RED: scaleLinear()
    .domain([-1, 1])
    .range(['#582A72', '#AAAA39'])
}

// Color scale for the nodes (using the BLUE_0_1 range)
const range = colorScales.PURPLE_0_1.range() // blue orig
export const newColorScale = scaleLinear()
  .domain([0, 1])
  .range(range)

export const otOmnipathdbSources = {
  // Pathways
  'SignaLink3': 'Pathways',
  'Signor': 'Pathways',
  // 'Reactome': 'Pathways', // This data is coming from Reactome directly, so removed from here
  'SPIKE': 'Pathways',

  // Enzyme-substrate
  'PhosphoPoint': 'Enzyme-substrate',
  'HPRD': 'Enzyme-substrate',
  'HPRD-phos': 'Enzyme-substrate',
  'MIMP': 'Enzyme-substrate',
  'HuPho': 'Enzyme-substrate',

  // PPI
  'BioGRID': 'PPI',
  'InnateDB': 'PPI',
  'IntAct': 'PPI',
  'DIP': 'PPI',
  'STRING': 'PPI'
}

export const otOmnipathdbCategories = {
  'Pathways': {
    'SignaLink3': true,
    'Signor': true,
    'Reactome': true,
    'SPIKE': true
  },
  'Enzyme-substrate': {
    'PhosphoPoint': true,
    'HPRD': true,
    'HPRD-phos': true,
    'MIMP': true,
    'HuPho': true
  },
  'PPI': {
    'BioGRID': true,
    'InnateDB': true,
    'IntAct': true,
    'DIP': true,
    'STRING': true
  }
}
