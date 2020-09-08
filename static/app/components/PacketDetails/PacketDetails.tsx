import * as React from 'react'
import { Card } from 'antd'
import { CardTabListType } from 'antd/lib/card'
import './PacketDetails.css'

import { NoSelection } from './components/NoSelection'
import { PacketOverview } from './components/PacketOverview'
import { PacketHexdump } from './components/PacketHexdump'

import { IPacketWithPayload } from '../../net/api'

const TABS_LIST: CardTabListType[] = [
  { key: 'overview', tab: 'Overview' },
  { key: 'hexdump', tab: 'Hexdump' }
]

const TABS: ITabs = {
  overview: (_: number, packet: IPacketWithPayload) => <PacketOverview packet={packet} />,
  hexdump: (width: number, packet: IPacketWithPayload) => <PacketHexdump width={width} packet={packet} />
}

export const PacketDetails: React.SFC<IProps> = ({ dimensions, loading, packet }) => {
  const [selectedTab, setSelectedTab] = React.useState('overview')

  if (!packet) {
    return <NoSelection height={dimensions.height} loading={loading} />
  }

  return (
    <Card
      bodyStyle={{
        height: dimensions.height,
        display: 'flex',
        flexDirection: 'column'
      }}
      className='PacketDetails-card'
      title={`Packet #${packet.rowid} details`}
      tabList={TABS_LIST}
      activeTabKey={selectedTab}
      onTabChange={tab => setSelectedTab(tab)}
    >
      {TABS[selectedTab](dimensions.width, packet)}
    </Card>
  )
}

interface IProps {
  dimensions: {
    height: number
    width: number
  }
  loading: boolean
  packet: IPacketWithPayload | null
}

interface ITabs {
  [tab: string]: (width: number, packet: IPacketWithPayload) => JSX.Element
}
