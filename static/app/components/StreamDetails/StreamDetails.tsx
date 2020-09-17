import * as React from 'react'
import { Card, Form, Switch, Timeline } from 'antd'
import './StreamDetails.css'

import { NoSelection } from './components/NoSelection'
import { StreamFragment } from './components/StreamFragment'

import { IStreamDetailsResponse } from '../../net/api'

const MIN_SCREEN_WIDTH = 590
const MIN_COLUMNS = 2
const COLUMN_INCREASE_AFTER_PX = 80

const computeHexdumpColumns = (screenWidth: number): number => {
  // Clamp the value in range [MIN_SCREEN_WIDTH, +Infinity)
  screenWidth = screenWidth < MIN_SCREEN_WIDTH ? MIN_SCREEN_WIDTH : screenWidth

  // Compute the number of columns based on the current screen width
  const columns = Math.floor((screenWidth - MIN_SCREEN_WIDTH) / COLUMN_INCREASE_AFTER_PX)
  return MIN_COLUMNS * 2 + columns * 2
}

export const StreamDetails: React.FC<IProps> = ({ loading, streamDetails, dimensions }) => {
  if (!streamDetails) {
    return <NoSelection loading={loading} height={dimensions.height} />
  }

  const [showHexdump, setShowHexdump] = React.useState<boolean>(false) 
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
      extra={
        <Form size='small'>
          <Form.Item className='StreamDetails-card_switch' label='Hexdump'>
            <Switch checked={showHexdump} onChange={() => setShowHexdump(!showHexdump)} />
          </Form.Item>
        </Form>
      }
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
              hexdump={showHexdump}
              hexdumpColumns={computeHexdumpColumns(dimensions.width)}
              key={index}
            />
          ))}
        </Timeline>
      </div>
    </Card>
  )
}

interface IProps {
  loading: boolean
  streamDetails: IStreamDetailsResponse | null
  dimensions: { height: number, width: number }
}
