import * as React from 'react'
import { Typography } from 'antd'
const { Text } = Typography
import './PacketSnifferStatus.css'

export const PacketSnifferStatus: React.FC<IProps> = ({ online }) => (
  <div className='PacketSnifferStatus-container'>
    <Text type='secondary'>
      Status:
    </Text>

    <div className='PacketSnifferStatus-indicator_container'>
      {online ? (
        <Text type='success'>capturing packets</Text>
      ) : (
        <Text type='danger'>sniffer offline</Text>
      )}
    </div>
  </div>
)

interface IProps {
  online: boolean
}
