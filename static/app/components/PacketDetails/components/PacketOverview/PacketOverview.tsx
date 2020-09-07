import * as React from 'react'
import './PacketOverview.css'

import { IPacketWithPayload } from '../../../../net/api'

export const PacketOverview: React.SFC<IProps> = ({ packet }) => (
  <div className='PacketOverview-container'>
    {packet.data_bytes.split('\n').map((row, index) => (
      <span
        key={index}
        className='PacketOverview-row'
      >
        {row}
        <br />
      </span>
    ))}
  </div>
)

interface IProps {
  packet: IPacketWithPayload
}
