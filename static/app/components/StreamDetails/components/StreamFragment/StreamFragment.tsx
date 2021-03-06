import * as React from 'react'
import { Timeline } from 'antd'
import { hexy } from 'hexy'
import './StreamFragment.css'

import { Hosts } from '../../../../components/Hosts'

import { IStreamFragment } from '../../../../net/api'

export const StreamFragment: React.FC<IProps> = ({ streamFragment, srcIP, srcPort, dstIP, dstPort, hexdump, hexdumpColumns }) => {
  const isFromSrcToDst = streamFragment.src_ip === srcIP
  const { data } = streamFragment

  return (
    <Timeline.Item>
      <div className='StreamFragment-content'>
        <Hosts
          srcIP={srcIP}
          srcPort={srcPort}
          dstIP={dstIP}
          dstPort={dstPort}
          direction={isFromSrcToDst ? 'src-to-dst' : 'dst-to-src'}
        />

        <pre className='StreamFragment-data'>
          {hexdump ? hexy(data, { width: hexdumpColumns }) : data}
        </pre>
      </div>
    </Timeline.Item>
  )
}

interface IProps {
  streamFragment: IStreamFragment
  srcIP: string
  srcPort: string
  dstIP: string
  dstPort: string
  hexdump: boolean
  hexdumpColumns: number
}
