import * as React from 'react'
import { Tooltip } from 'antd'

import { IPacketNoPayload } from '../../../../net/api'

export const PacketTime: React.SFC<IProps> = ({ packet }) => {
  const localTime = new Date(packet.start_time)
  const day = localTime.getDate().toString().padStart(2, '0')
  const month = localTime.getMonth().toString().padStart(2, '0')
  const year = new Date(Math.floor(packet.start_time / 1000)).getFullYear().toString()
  const hours = localTime.getHours().toString().padStart(2, '0')
  const minutes = localTime.getMinutes().toString().padStart(2, '0')
  const seconds = localTime.getSeconds().toString().padStart(2, '0')
  const millis = Math.floor(localTime.getTime() % 1000000).toString().padEnd(6, '0')
  const sessionDuration = Math.floor((packet.end_time - packet.start_time) / 1000)

  const tooltip = (
    <>
      <span>Date: {`${day}/${month}/${year}`}</span>
      <br />
      <span>Duration: {`${sessionDuration}`}ms</span>
    </>
  )
  const time = `${hours}:${minutes}:${seconds}.${millis}`

  return (
    <Tooltip placement='topLeft' title={tooltip}>
      <span>{time}</span>
    </Tooltip>
  )
}

interface IProps {
  packet: IPacketNoPayload
}
