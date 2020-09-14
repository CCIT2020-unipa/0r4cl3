import * as React from 'react'
import { Table } from 'antd'
import { ColumnsType } from 'antd/lib/table'

import { Datetime } from '../../components/Datetime'
import { Hosts } from '../../components/Hosts'

import { IReconstructedStream } from '../../net/api'

export class StreamsList extends React.PureComponent<IProps> {
  render(): JSX.Element {
    const { height, streams, loading, onRowPress } = this.props

    return (
      <Table
        rowKey={stream => stream.stream_no}
        dataSource={streams}
        columns={this.computeColumns()}
        pagination={{
          defaultPageSize: 128,
          pageSizeOptions: ['16', '32', '64', '128', '256', '512'],
          position: ['bottomLeft'],
          size: 'small'
        }}
        scroll={{ y: height }}
        size='small'
        loading={loading}
        onRow={stream => ({ onClick: () => onRowPress(stream) })}
      />
    )
  }

  private computeColumns = (): ColumnsType<IReconstructedStream> => {
    const { protocols } = this.props

    return [
      {
        width: '20%',
        title: 'Time',
        render: (_, { last_updated }) => <Datetime timestamp={last_updated} />,
        sorter: (streamA, streamB) => streamA.last_updated - streamB.last_updated
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
        dataIndex: 'size_str',
        ellipsis: true,
        sorter: (streamA, streamB) => streamA.size - streamB.size
      },
      {
        title: 'Hosts',
        render: (_, { src_ip, src_port, dst_ip, dst_port }) => <Hosts
          srcIP={src_ip}
          srcPort={src_port}
          dstIP={dst_ip}
          dstPort={dst_port}
          direction='both'
          alignToGrid
        />
      }
    ]
  }
}

interface IProps {
  height: number
  streams: IReconstructedStream[]
  protocols: string[]
  loading: boolean
  onRowPress: (stream: IReconstructedStream) => void
}
