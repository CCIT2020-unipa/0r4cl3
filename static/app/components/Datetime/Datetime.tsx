import * as React from 'react'
import { Typography, Tooltip } from 'antd'
const { Text } = Typography

const timestampToDatetime = (timestamp: number): { date: string, time: string } => {
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

export const Datetime: React.FC<IProps> = ({ timestamp }) => {
  const { date, time } = timestampToDatetime(timestamp)
  const tooltip = <span>Date: {date}</span>

  return (
    <Tooltip placement='topLeft' title={tooltip}>
      <Text>{time}</Text>
    </Tooltip>
  )
}

interface IProps {
  timestamp: number
}
