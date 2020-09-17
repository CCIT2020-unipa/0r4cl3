import * as React from 'react'
import { observer } from 'mobx-react'
import { PageHeader, Layout, Form, Input, Switch, Tooltip, Row, Col } from 'antd'
import { CloseCircleTwoTone } from '@ant-design/icons'
const { Content } = Layout
const { Search } = Input
import './Streams.css'

import { StreamsStore } from '../../store'
import { StreamsStoreContext } from '../../App'

import { PacketSnifferStatus } from './components/PacketSnifferStatus'
import { StreamsList } from '../../components/StreamsList'
import { StreamDetails } from '../../components/StreamDetails'

const _Streams: React.FC<IProps> = observer(({ streamsStore }) => {
  const [query, setQuery] = React.useState<string>('')
  const [queryUseRegExp, setQueryUseRegExp] = React.useState<boolean>(false)
  const {
    areUnfilteredStreamsLoading,
    unfilteredStreams,
    unfilteredStreamsProtocols,
    areFilteredStreamsLoading,
    filteredStreams,
    filteredStreamsProtocols,
    areStreamDetailsLoading,
    streamDetails,
    packetSnifferOnline
  } = streamsStore

  return (
    // TODO: restore resize detector
    <Layout className='Streams-container'>
      <PageHeader title='0r4cl3' extra={<PacketSnifferStatus online={packetSnifferOnline} />}>
        <Form className='Streams-search_options__container' layout='inline' size='small'>
          <Form.Item className='Streams-search_options__use_regexp' label='Use RegExp'>
            <Switch checked={queryUseRegExp} onChange={() => setQueryUseRegExp(!queryUseRegExp)} />
          </Form.Item>
        </Form>

        <Search
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={`Filter streams by their content (using ${queryUseRegExp ? 'regular expressions' : 'full-text search'})`}
          onSearch={() => streamsStore.fetchFilteredStreams(query, queryUseRegExp ? 'regexp' : 'fulltext')}
          enterButton
          suffix={
            <Tooltip placement='bottom' title='Reset filter'>
              <CloseCircleTwoTone onClick={() => {
                streamsStore.resetFilteredStreams()
                setQuery('')
              }} />
            </Tooltip>
          }
        />
      </PageHeader>

      <Content className='Streams-content'>
        <Row>
          <Col span={9}>
            <StreamsList
              // TODO: restore dynamic dimensions
              height={400}
              loading={filteredStreams !== null ? areFilteredStreamsLoading : areUnfilteredStreamsLoading}
              streams={filteredStreams !== null ? filteredStreams!! : unfilteredStreams}
              protocols={filteredStreamsProtocols !== null ? filteredStreamsProtocols!! : unfilteredStreamsProtocols}
              onRowPress={stream => streamsStore.fetchStreamDetails(stream.stream_no)}
            />
          </Col>
          <Col span={15} style={{ paddingLeft: 40 }}>
            <StreamDetails
              loading={areStreamDetailsLoading}
              streamDetails={streamDetails}
              // TODO: restore dynamic dimensions
              dimensions={{ height: 400, width: 1200 }}
            />
          </Col>
        </Row>
      </Content>
    </Layout>
  )
})

interface IProps {
  streamsStore: StreamsStore
}

export const Streams = (props: any) => (
  <StreamsStoreContext.Consumer>
    {streamsStore => <_Streams streamsStore={streamsStore} {...props} />}
  </StreamsStoreContext.Consumer>
)

// private updateTableHeight = (): void => {
//   if (this.m_ContentRef === null) return

//   const content = ReactDOM.findDOMNode(this.m_ContentRef) as HTMLElement
//   const newTableHeight = content.clientHeight
//     - 48 // Top and bottom 'Captures-content' margins
//     - 24 // Pagination height
//     - 32 // Top and bottom pagination margins
//   const newFocusedStreamHeight = content.clientHeight
//     - 58 // Card header

//   this.setState(() => ({
//     tableHeight: newTableHeight,
//     focusedStreamDimensions: {
//       height: newFocusedStreamHeight,
//       width: content.clientWidth
//     }
//   }))
// }
