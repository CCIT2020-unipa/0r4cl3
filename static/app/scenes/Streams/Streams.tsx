import * as React from 'react'
import * as ReactDOM from 'react-dom'
import ReactResizeDetector from 'react-resize-detector'
import { PageHeader, Layout, Input, Tooltip, Row, Col } from 'antd'
import { CloseCircleTwoTone } from '@ant-design/icons'
const { Content } = Layout
const { Search } = Input
import './Streams.css'

import { PacketSnifferStatus } from './components/PacketSnifferStatus'
import { StreamsList } from '../../components/StreamsList'
import { StreamDetails } from '../../components/StreamDetails'

import {
  IStreamNoPayload,
  IStreamWithPayload,
  requestStreams,
  requestStreamsByContent,
  requestStreamDetails,
  apiUtils
} from '../../net/api'

const STREAMS_UPDATE_INTERVAL_MS = 30000
const RESIZE_DETECTOR_REFRESH_RATE_MS = 1250

export class Streams extends React.Component<{}, IState> {
  private m_ContentRef: React.Component | null = null
  private m_TimeoutID?: NodeJS.Timeout

  state = {
    query: '',
    tableHeight: 0,
    lastTimestamp: 0,
    streams: [],
    streamsProtocols: [],
    filteredStreams: null,
    filteredStreamsProtocols: null,
    focusedStream: null as IStreamWithPayload | null,
    focusedStreamLoading: false,
    focusedStreamDimensions: { height: 0, width: 0 }
  }

  render(): JSX.Element {
    const {
      query,
      tableHeight,
      streams,
      streamsProtocols,
      filteredStreams,
      filteredStreamsProtocols,
      focusedStream,
      focusedStreamLoading,
      focusedStreamDimensions
    } = this.state

    return (
      <ReactResizeDetector
        handleHeight
        handleWidth
        refreshRate={RESIZE_DETECTOR_REFRESH_RATE_MS}
        refreshMode='throttle'
        onResize={this.updateTableHeight}
      >
        {() => (
          <Layout className='Streams-container'>
            <PageHeader title='0r4cl3' extra={[
              <PacketSnifferStatus key='1' />
            ]}>
              <Search
                value={query}
                onChange={this.onSearchChange}
                placeholder="Filter by payload's content"
                onSearch={this.onSearchSubmit}
                enterButton
                suffix={
                  <Tooltip placement='bottom' title='Reset filter'>
                    <CloseCircleTwoTone onClick={this.onSearchReset} />
                  </Tooltip>
                }
              />
            </PageHeader>

            <Content ref={ref => { this.m_ContentRef = ref }} className='Streams-content'>
              <Row>
                <Col span={9}>
                  <StreamsList
                    height={tableHeight}
                    streams={filteredStreams !== null ? filteredStreams!! : streams}
                    protocols={filteredStreamsProtocols !== null ? filteredStreamsProtocols!! : streamsProtocols}
                    onRowPress={this.fetchStreamDetails}
                  />
                </Col>
                <Col span={15} style={{ paddingLeft: 40 }}>
                  <StreamDetails
                    stream={focusedStream}
                    dimensions={focusedStreamDimensions}
                    loading={focusedStreamLoading}
                  />
                </Col>
              </Row>
            </Content>
          </Layout>
        )}
      </ReactResizeDetector>
    )
  }

  /**
   * Window resize-related methods
   */
  private updateTableHeight = (): void => {
    if (this.m_ContentRef === null) return

    const content = ReactDOM.findDOMNode(this.m_ContentRef) as HTMLElement
    const newTableHeight = content.clientHeight
      - 48 // Top and bottom 'Captures-content' margins
      - 24 // Pagination height
      - 32 // Top and bottom pagination margins
    const newFocusedStreamHeight = content.clientHeight
      - 98 // Card header

    this.setState(() => ({
      tableHeight: newTableHeight,
      focusedStreamDimensions: {
        height: newFocusedStreamHeight,
        width: content.clientWidth
      }
    }))
  }

  /**
   * Data fetching-related methods
   */
  async componentDidMount() {
    await this.fetchStreams()
    this.m_TimeoutID = setInterval(async () => await this.fetchStreams(), STREAMS_UPDATE_INTERVAL_MS) as NodeJS.Timeout
  }

  componentWillUnmount() {
    // Stop fetching streams
    if (this.m_TimeoutID) clearInterval(this.m_TimeoutID)
  }

  private fetchStreams = async (): Promise<void> => {
    const { lastTimestamp, streams, streamsProtocols } = this.state
    const { streams: fetchedStreams, unique_protocols: fetchedStreamsProtocols } = await requestStreams(lastTimestamp)

    // Find the timestamp of the last updated stream
    const newTimestamp = fetchedStreams.length > 0
      ? Math.max(...fetchedStreams.map(stream => stream.end_time))
      : lastTimestamp

    // Merge current and fetched streams
    const mergedStreams = apiUtils.mergeStreams(streams, fetchedStreams)

    // Extract protocols
    const mergedStreamsProtocols = apiUtils.mergeProtocols(streamsProtocols, fetchedStreamsProtocols)

    this.setState(() => ({
      lastTimestamp: newTimestamp,
      streams: mergedStreams,
      streamsProtocols: mergedStreamsProtocols
    }))
  }

  private fetchStreamDetails = (stream: IStreamNoPayload): void => {
    // Skip if details for the requested stream have already been rendered
    if (this.state.focusedStream?.rowid === stream.rowid) return

    this.setState(() => ({ focusedStreamLoading: true, focusedStream: null }), () => {
      requestStreamDetails(stream.rowid)
        .then(streamDetails => {
          this.setState(() => ({ focusedStreamLoading: false, focusedStream: streamDetails }))
        })
    })
  }

  /**
   * Search bar-related methods
   */
  private onSearchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const query = event.target.value
    this.setState(() => ({ query }))
  }

  private onSearchSubmit = (): void => {
    const { query } = this.state

    // Skip if query is empty
    if (query.length === 0) return;

    requestStreamsByContent(query)
      .then(({ streams, unique_protocols: uniqueProtocols }) => {
        this.setState(() => ({
          filteredStreams: streams,
          filteredStreamsProtocols: uniqueProtocols
        }))
      })
  }

  private onSearchReset = (): void => {
    this.setState(() => ({
      query: '',
      filteredStreams: null,
      filteredStreamsProtocols: null
    }))
  }
}

interface IState {
  query: string
  tableHeight: number
  lastTimestamp: number
  streams: IStreamNoPayload[]
  streamsProtocols: string[]
  filteredStreams: IStreamNoPayload[] | null
  filteredStreamsProtocols: string[] | null
  focusedStream: IStreamWithPayload | null
  focusedStreamLoading: boolean
  focusedStreamDimensions: { height: number, width: number }
}
