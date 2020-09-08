import * as React from 'react'
import { Table } from 'antd'
import { ColumnsType } from 'antd/lib/table'

import { PacketTime } from './components/PacketTime'
import { PacketHosts } from './components/PacketHosts'

import { IPacketNoPayload } from '../../net/api'

const computeColumns = (protocols: string[]): ColumnsType<IPacketNoPayload> => [
  {
    width: '20%',
    title: 'Time',
    render: (_, packet) => <PacketTime packet={packet} />,
    sorter: (packetA, packetB) => packetA.start_time - packetB.start_time
  },
  {
    width: '12%',
    title: 'Protocol',
    dataIndex: 'protocol',
    ellipsis: true,
    filters: protocols.map(protocol => ({ text: protocol, value: protocol })),
    onFilter: (value, record) => record.protocol === value
  },
  {
    width: '10%',
    title: 'Length',
    dataIndex: 'data_length_string',
    ellipsis: true,
    sorter: (packetA, packetB) => packetA.data_length - packetB.data_length
  },
  {
    title: 'Hosts',
    render: (_, packet) => <PacketHosts packet={packet} />
  }
]

export const PacketList: React.SFC<IProps> = ({ height, packets, protocols, onRowPress }) => (
  <Table
    rowKey={packet => packet.rowid}
    dataSource={packets}
    columns={computeColumns(protocols)}
    pagination={{
      defaultPageSize: 128,
      pageSizeOptions: ['16', '32', '64', '128', '256', '512'],
      position: ['bottomLeft'],
      size: 'small'
    }}
    scroll={{ y: height }}
    size='small'
    onRow={(packet, _) => ({ onClick: () => onRowPress(packet) })}
  />
)

interface IProps {
  height: number
  packets: IPacketNoPayload[]
  protocols: string[]
  onRowPress: (packet: IPacketNoPayload) => void
}
