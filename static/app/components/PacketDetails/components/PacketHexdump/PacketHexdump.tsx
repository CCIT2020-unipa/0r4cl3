import * as React from 'react'
import { hexy } from 'hexy'
import './PacketHexdump.css'

import { IPacketWithPayload } from '../../../../net/api'

const computeHexdumpWidth = (screenWidth: number): number => {
  if (screenWidth < 1200) {
    return 10
  } else if (screenWidth < 1550) {
    return 16
  } else if (screenWidth < 2000) {
    return 24
  } else {
    return 32
  }
}

export const PacketHexdump: React.SFC<IProps> = ({ width, packet }) => (
  <pre className='PacketOverview-content'>
    {hexy(packet.data_bytes, { width: computeHexdumpWidth(width) })}
  </pre>
)

interface IProps {
  width: number
  packet: IPacketWithPayload
}
