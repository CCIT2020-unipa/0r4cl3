import * as React from 'react'
import * as ReactDOM from 'react-dom'
import ReactResizeDetector from 'react-resize-detector'
import { PageHeader, Layout, Form, Input, Switch, Tooltip, Row, Col } from 'antd'
import { CloseCircleTwoTone } from '@ant-design/icons'
const { Content } = Layout
const { Search } = Input
import './Streams.css'

import { PacketSnifferStatus } from './components/PacketSnifferStatus'
import { StreamsList } from '../../components/StreamsList'
import { StreamDetails } from '../../components/StreamDetails'
import { showError } from '../../components/Notification'

import {
  IReconstructedStream,
  IStreamDetailsResponse,
  requestStreams,
  requestStreamsByContent,
  requestStreamDetails,
  apiUtils
} from '../../net/api'

const STREAMS_UPDATE_INTERVAL_MS = 30000
const RESIZE_DETECTOR_REFRESH_RATE_MS = 1250

export class Streams extends React.Component<IProps, IState> {
  private m_ContentRef: React.Component | null = null
  private m_TimeoutID?: NodeJS.Timeout

  state = {
    query: '',
    queryUseRegexp: false,
    tableHeight: 0,
    lastTimestamp: 0,
    streams: [],
    streamsProtocols: [],
    streamsLoading: true,
    filteredStreams: null,
    filteredStreamsProtocols: null,
    focusedStream: null,
    focusedStreamLoading: false,
    focusedStreamDimensions: { height: 0, width: 0 }
  }

  render(): JSX.Element {
    const { accessToken } = this.props
    const {
      query,
      queryUseRegexp,
      tableHeight,
      streams,
      streamsProtocols,
      streamsLoading,
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
              <PacketSnifferStatus key='1' accessToken={accessToken} />
            ]}>
              <Form>
                <Form.Item style={{ marginBottom: 8 }} label='Use RegExp'>
                  <Switch checked={queryUseRegexp} onChange={this.onUseRegExpChange} />
                </Form.Item>
              </Form>

              <Search
                value={query}
                onChange={this.onSearchChange}
                placeholder={`Filter streams by their content (using ${queryUseRegexp ? 'regular expressions' : 'full-text search'})`}
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
                    loading={streamsLoading}
                    onRowPress={this.fetchStreamDetails}
                  />
                </Col>
                <Col span={15} style={{ paddingLeft: 40 }}>
                  <StreamDetails
                    streamDetails={focusedStream}
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
      - 58 // Card header

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
  componentDidMount() {
    this.fetchStreams()
    this.m_TimeoutID = setInterval(() => this.fetchStreams(), STREAMS_UPDATE_INTERVAL_MS) as NodeJS.Timeout
  }

  componentWillUnmount() {
    // Stop fetching streams
    if (this.m_TimeoutID) clearInterval(this.m_TimeoutID)
  }

  private fetchStreams = (): void => {
    const { accessToken } = this.props
    const { lastTimestamp, streams, streamsProtocols } = this.state

    this.setState(() => ({ streamsLoading: true }), async () => {
      try {
        const { streams: fetchedStreams, protocols: fetchedStreamsProtocols } = await requestStreams(accessToken, lastTimestamp)

        // Find the timestamp of the last updated stream
        const newTimestamp = fetchedStreams.length > 0
          ? Math.max(...fetchedStreams.map(stream => stream.last_updated))
          : lastTimestamp

        // Merge current and fetched streams
        const mergedStreams = apiUtils.mergeStreams(streams, fetchedStreams)

        // Extract protocols
        const mergedStreamsProtocols = apiUtils.mergeProtocols(streamsProtocols, fetchedStreamsProtocols)

        this.setState(() => ({
          lastTimestamp: newTimestamp,
          streams: mergedStreams,
          streamsProtocols: mergedStreamsProtocols,
          streamsLoading: false
        }), () => {
          // Update search results
          this.onSearchSubmit()
        })
      } catch {
        showError(
          'Cannot connect to 0r4cl3 server',
          'Make sure you are connected to the internet and the server is up and running'
        )
        this.setState(() => ({ streamsLoading: false }))
      }
    })
  }

  private fetchStreamDetails = (stream: IReconstructedStream): void => {
    const { accessToken } = this.props

    this.setState(() => ({ focusedStreamLoading: true, focusedStream: null }), async () => {
      try {
        const focusedStream = await requestStreamDetails(accessToken, stream.stream_no)
        this.setState(() => ({ focusedStreamLoading: false, focusedStream }))
      } catch {
        showError(
          'Cannot connect to 0r4cl3 server',
          'Make sure you are connected to the internet and the server is up and running'
        )
        this.setState(() => ({ focusedStreamLoading: false }))
      }
    })
  }

  /**
   * Search bar-related methods
   */
  private onUseRegExpChange = (): void => {
    this.setState(prevState => ({ queryUseRegexp: !prevState.queryUseRegexp }))
  }

  private onSearchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const query = event.target.value
    this.setState(() => ({ query }))
  }

  private onSearchSubmit = async (): Promise<void> => {
    const { accessToken } = this.props
    const { query, queryUseRegexp } = this.state

    // Skip if query is empty
    if (query.length === 0) return;

    try {
      const { streams, protocols } = await requestStreamsByContent(accessToken, query, queryUseRegexp ? 'regexp' : 'fulltext')
      this.setState(() => ({ filteredStreams: streams, filteredStreamsProtocols: protocols }))
    } catch {
      showError(
        'Cannot connect to 0r4cl3 server',
        'Make sure you are connected to the internet and the server is up and running'
      )
    }
  }

  private onSearchReset = (): void => {
    this.setState(() => ({
      query: '',
      filteredStreams: null,
      filteredStreamsProtocols: null
    }))
  }
}

interface IProps {
  accessToken: string
}

interface IState {
  query: string
  queryUseRegexp: boolean
  tableHeight: number
  lastTimestamp: number
  streams: IReconstructedStream[]
  streamsProtocols: string[]
  streamsLoading: boolean
  filteredStreams: IReconstructedStream[] | null
  filteredStreamsProtocols: string[] | null
  focusedStream: IStreamDetailsResponse | null
  focusedStreamLoading: boolean
  focusedStreamDimensions: { height: number, width: number }
}
