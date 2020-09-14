import * as React from 'react'
import { Card, Timeline } from 'antd'
import './StreamDetails.css'

import { NoSelection } from './components/NoSelection'
import { StreamFragment } from './components/StreamFragment'

import { IStreamDetailsResponse } from '../../net/api'

export const StreamDetails: React.FC<IProps> = ({ streamDetails, loading, dimensions }) => {
  if (!streamDetails) {
    return <NoSelection height={dimensions.height} loading={loading} />
  }

  const {
    src_ip: srcIP,
    src_port: srcPort,
    dst_ip: dstIP,
    dst_port: dstPort
  } = streamDetails.stream

  return (
    <Card
      bodyStyle={{
        height: dimensions.height,
        display: 'flex',
        flexDirection: 'column'
      }}
      className='StreamDetails-card'
      title={`Stream #${streamDetails.stream.stream_no} details`}
    >
      <div className='StreamDetails-fragments_container'>
        <Timeline>
          {streamDetails.fragments.map((streamFragment, index) => (
            <StreamFragment
              streamFragment={streamFragment}
              srcIP={srcIP}
              srcPort={srcPort}
              dstIP={dstIP}
              dstPort={dstPort}
              key={index}
            />
          ))}
        </Timeline>
      </div>
    </Card>
  )
}

interface IProps {
  streamDetails: IStreamDetailsResponse | null
  loading: boolean
  dimensions: { height: number, width: number }
}
