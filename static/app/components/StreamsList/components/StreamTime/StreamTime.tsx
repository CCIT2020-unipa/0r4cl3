import * as React from 'react'
import { Tooltip } from 'antd'

import { IReconstructedStream } from '../../../../net/api'

const getDatetime = (timestamp: number): IDatetime => {
  const datetime = new Date(Math.floor(timestamp / 1000))
  const day = datetime.getDate().toString().padStart(2, '0')
  const month = datetime.getMonth().toString().padStart(2, '0')
  const year = datetime.getFullYear().toString()
  const hours = datetime.getHours().toString().padStart(2, '0')
  const minutes = datetime.getMinutes().toString().padStart(2, '0')
  const seconds = datetime.getSeconds().toString().padStart(2, '0')
  const millis = (timestamp % 1000000).toString().padEnd(6, '0')

  return {
    date: `${day}/${month}/${year}`,
    time: `${hours}:${minutes}:${seconds}.${millis}`
  }
}

export const StreamTime: React.SFC<IProps> = ({ stream }) => {
  const { date, time } = getDatetime(stream.last_updated)
  const tooltip = <span>Date: {date}</span>

  return (
    <Tooltip placement='topLeft' title={tooltip}>
      <span>{time}</span>
    </Tooltip>
  )
}

interface IProps {
  stream: IReconstructedStream
}

interface IDatetime {
  date: string
  time: string
}
