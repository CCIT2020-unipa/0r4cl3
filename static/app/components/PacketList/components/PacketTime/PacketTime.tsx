import * as React from 'react'

import { IPacket } from '../../../../net/api'

export const PacketTime: React.SFC<IProps> = ({ packet }) => {
  const localTime = new Date(packet.start_time)
  const hours = localTime.getHours().toString().padStart(2, '0')
  const minutes = localTime.getMinutes().toString().padStart(2, '0')
  const seconds = localTime.getSeconds().toString().padStart(2, '0')
  const millis = Math.floor(localTime.getTime() % 1000000).toString().padEnd(6, '0')

  return <span>{`${hours}:${minutes}:${seconds}.${millis}`}</span>
}

interface IProps {
  packet: IPacket
}
