import * as React from 'react'

import { GridAlignedHosts } from './components/GridAlignedHosts'
import { InlineHosts } from './components/InlineHosts'

export const Hosts: React.FC<IProps> = ({ alignToGrid, ...props }) => {
  return alignToGrid
    ? <GridAlignedHosts {...props} />
    : <InlineHosts {...props} />
}

export interface IProps {
  srcIP: string
  srcPort: string
  dstIP: string
  dstPort: string
  direction: 'src-to-dst' | 'dst-to-src' | 'both'
  alignToGrid?: boolean
}
