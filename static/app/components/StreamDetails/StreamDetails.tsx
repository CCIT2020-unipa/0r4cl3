import * as React from 'react'
import { Card } from 'antd'
import { CardTabListType } from 'antd/lib/card'
import './StreamDetails.css'

import { NoSelection } from './components/NoSelection'
import { StreamPrintable } from './components/StreamPrintable'
import { StreamHexdump } from './components/StreamHexdump'

import { IStreamWithPayload } from '../../net/api'

const TABS_LIST: CardTabListType[] = [
  { key: 'printable', tab: 'Printable data' },
  { key: 'hexdump', tab: 'Hexdump' }
]

const TABS: ITabs = {
  printable: (_: number, stream: IStreamWithPayload) => <StreamPrintable stream={stream} />,
  hexdump: (width: number, stream: IStreamWithPayload) => <StreamHexdump width={width} stream={stream} />
}

export const StreamDetails: React.SFC<IProps> = ({ stream, loading, dimensions }) => {
  const [selectedTab, setSelectedTab] = React.useState('printable')

  if (!stream) {
    return <NoSelection height={dimensions.height} loading={loading} />
  }

  return (
    <Card
      bodyStyle={{
        height: dimensions.height,
        display: 'flex',
        flexDirection: 'column'
      }}
      className='StreamDetails-card'
      title={`Stream #${stream.stream_no} details`}
      tabList={TABS_LIST}
      activeTabKey={selectedTab}
      onTabChange={tab => setSelectedTab(tab)}
    >
      {TABS[selectedTab](dimensions.width, stream)}
    </Card>
  )
}

interface IProps {
  stream: IStreamWithPayload | null
  loading: boolean
  dimensions: {
    height: number
    width: number
  }
}

interface ITabs {
  [tab: string]: (width: number, stream: IStreamWithPayload) => JSX.Element
}
