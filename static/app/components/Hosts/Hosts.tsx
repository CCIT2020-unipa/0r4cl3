import * as React from 'react'
import { Tag } from 'antd'
import './Hosts.css'

export const Hosts: React.FC<IProps> = ({ srcIP, srcPort, dstIP, dstPort, direction }) => (
  <div className='Hosts-container'>
    <div className='Hosts-host_container'>
      <span className='Hosts-host_ip'>{srcIP}</span>
      <Tag className='Hosts-host_port' color='blue'>{srcPort}</Tag>
    </div>

    <div className='Hosts-direction_container'>
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

    <div className='Hosts-host_container'>
      <span className='Hosts-host_ip'>{dstIP}</span>
      <Tag className='Hosts-host_port' color='blue'>{dstPort}</Tag>
    </div>
  </div>
)

interface IProps {
  srcIP: string
  srcPort: string
  dstIP: string
  dstPort: string
  direction: 'src-to-dst' | 'dst-to-src' | 'both'
}
