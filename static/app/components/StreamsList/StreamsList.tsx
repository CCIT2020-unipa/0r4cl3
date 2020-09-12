import * as React from 'react'
import { Table } from 'antd'
import { ColumnsType } from 'antd/lib/table'

import { StreamTime } from './components/StreamTime'
import { StreamHosts } from './components/StreamHosts'

import { IStreamNoPayload } from '../../net/api'

export class StreamsList extends React.PureComponent<IProps> {
  render(): JSX.Element {
    const { height, streams, loading, onRowPress } = this.props

    return (
      <Table
        rowKey={stream => stream.rowid}
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

  private computeColumns = (): ColumnsType<IStreamNoPayload> => {
    const { protocols } = this.props

    return [
      {
        width: '20%',
        title: 'Time',
        render: (_, stream) => <StreamTime stream={stream} />,
        sorter: (streamA, streamB) => streamA.end_time - streamB.end_time
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
        sorter: (streamA, streamB) => streamA.data_length - streamB.data_length
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
  streams: IStreamNoPayload[]
  protocols: string[]
  loading: boolean
  onRowPress: (stream: IStreamNoPayload) => void
}
