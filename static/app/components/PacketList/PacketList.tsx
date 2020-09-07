import * as React from 'react'
import { Table } from 'antd'
import { ColumnsType } from 'antd/lib/table'

import { PacketTime } from './components/PacketTime'
import { PacketHosts } from './components/PacketHosts'

import { IPacketNoPayload, requestPackets } from '../../net/api'

// const PACKETS_UPDATE_INTERVAL_MS = 30000

export class PacketList extends React.Component<IProps, IState> {
  private m_TimeoutID?: NodeJS.Timeout

  state = {
    currentTimestamp: 0,
    packets: [],
    uniqueProtocols: []
  }

  render(): JSX.Element {
    const { tableHeight } = this.props
    const { packets, uniqueProtocols } = this.state

    return (
      <Table
        rowKey={packet => packet.rowid}
        dataSource={packets}
        columns={this.computeColumns(uniqueProtocols)}
        pagination={{
          defaultPageSize: 128,
          pageSizeOptions: ['16', '32', '64', '128', '256', '512'],
          position: ['topRight'],
          size: 'small'
        }}
        scroll={{ y: tableHeight }}
        size='small'
      />
    )
  }

  async componentDidMount() {
    await this.fetchPackets()
    // this.m_TimeoutID = setInterval(async () => await this.fetchPackets(), PACKETS_UPDATE_INTERVAL_MS)
  }

  componentWillUnmount() {
    // Stop fetching packets
    if (this.m_TimeoutID) clearInterval(this.m_TimeoutID)
  }

  private async fetchPackets(): Promise<void> {
    const {
      packets,
      unique_protocols: uniqueProtocols
    } = await requestPackets(this.state.currentTimestamp)

    // Find the timestamp of the latest packet
    const newTimestamp = packets.length > 0
      ? Math.max(...packets.map(packet => packet.start_time))
      : this.state.currentTimestamp

    this.setState((prevState, _) => ({
      currentTimestamp: newTimestamp,
      packets: [...prevState.packets, ...packets],
      uniqueProtocols
    }))
  }

  private computeColumns = (uniqueProtocols: string[]): ColumnsType<IPacketNoPayload> => [
    {
      width: '8%',
      title: 'Time',
      render: (_, packet) => <PacketTime packet={packet} />,
      sorter: (packetA, packetB) => packetA.start_time - packetB.start_time
    },
    {
      width: '5%',
      title: 'Protocol',
      dataIndex: 'protocol',
      ellipsis: true,
      filters: uniqueProtocols.map(protocol => ({ text: protocol, value: protocol })),
      onFilter: (value, record) => record.protocol === value
    },
    {
      width: '5%',
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
}

interface IProps {
  tableHeight: number
}

interface IState {
  currentTimestamp: number
  packets: IPacketNoPayload[]
  uniqueProtocols: string[]
}
