import * as React from 'react'
import { Table } from 'antd'
import { ColumnsType } from 'antd/lib/table'

import { StreamTime } from './components/StreamTime'
import { StreamHosts } from './components/StreamHosts'

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
        render: (_, stream) => <StreamTime stream={stream} />,
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
        render: (_, stream) => <StreamHosts stream={stream} />
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
