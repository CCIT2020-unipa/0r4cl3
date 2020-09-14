import * as React from 'react'
import { Tag } from 'antd'
import './InlineHosts.css'

import { IProps } from '../../Hosts'

export const InlineHosts: React.FC<IProps> = ({ srcIP, srcPort, dstIP, dstPort, direction }) => (
  <div className='InlineHosts-container'>
    <div className='InlineHosts-host_container'>
      <span className='InlineHosts-host_ip'>{srcIP}</span>
      <Tag className='InlineHosts-host_port' color='blue'>{srcPort}</Tag>
    </div>

    <div className='InlineHosts-direction_container'>
      <span>
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
      </span>
    </div>

    <div className='InlineHosts-host_container'>
      <span className='InlineHosts-host_ip'>{dstIP}</span>
      <Tag className='InlineHosts-host_port' color='blue'>{dstPort}</Tag>
    </div>
  </div>
)
