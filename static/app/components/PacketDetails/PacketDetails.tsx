import * as React from 'react'
import { Card } from 'antd'
import { CardTabListType } from 'antd/lib/card'
import './PacketDetails.css'

import { PacketOverview } from './components/PacketOverview'
import { PacketHexdump } from './components/PacketHexdump'

import { IPacketWithPayload } from '../../net/api'

const TABS_LIST: CardTabListType[] = [
  { key: 'overview', tab: 'Overview' },
  { key: 'hexdump', tab: 'Hexdump' }
]

const TABS: ITabs = {
  overview: (packet: IPacketWithPayload) => <PacketOverview packet={packet} />,
  hexdump: (packet: IPacketWithPayload) => <PacketHexdump packet={packet} />
}

export const PacketDetails: React.SFC<IProps> = ({ height, packet }) => {
  const [selectedTab, setSelectedTab] = React.useState('overview')

  return (
    <Card
      bodyStyle={{
        height,
        display: 'flex',
        flexDirection: 'column'
      }}
      className='PacketDetails-card'
      title={`Packet #${packet.rowid} details`}
      tabList={TABS_LIST}
      activeTabKey={selectedTab}
      onTabChange={tab => setSelectedTab(tab)}
    >
      {TABS[selectedTab](packet)}
    </Card>
  )
}

interface IProps {
  height: number
  packet: IPacketWithPayload
}

interface ITabs {
  [tab: string]: (packet: IPacketWithPayload) => JSX.Element
}
