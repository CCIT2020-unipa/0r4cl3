import * as React from 'react'
import { Typography, Tag } from 'antd'
const { Text } = Typography
import './InlineHosts.css'

import { IProps } from '../../Hosts'

export const InlineHosts: React.FC<IProps> = ({ srcIP, srcPort, dstIP, dstPort, direction }) => (
  <div className='InlineHosts-container'>
    <div className='InlineHosts-host_container'>
      <Text className='InlineHosts-host_ip'>{srcIP}</Text>
      <Tag className='InlineHosts-host_port' color='blue'>{srcPort}</Tag>
    </div>

    <div className='InlineHosts-direction_container'>
      <Text>
        {(() => {
          switch (direction) {
            case 'both':
              return '⇋'
            case 'src-to-dst':
              return '⥬'
            case 'dst-to-src':
              return '⥪'
          }
        })()}
      </Text>
    </div>

    <div className='InlineHosts-host_container'>
      <Text className='InlineHosts-host_ip'>{dstIP}</Text>
      <Tag className='InlineHosts-host_port' color='blue'>{dstPort}</Tag>
    </div>
  </div>
)
