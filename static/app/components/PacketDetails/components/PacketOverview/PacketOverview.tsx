import * as React from 'react'
import './PacketOverview.css'

import { IPacketWithPayload } from '../../../../net/api'

export const PacketOverview: React.SFC<IProps> = ({ packet }) => (
  <pre className='PacketOverview-content'>
    {packet.data_bytes}
  </pre>
)

interface IProps {
  packet: IPacketWithPayload
}
