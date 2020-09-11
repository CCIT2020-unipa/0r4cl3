import * as React from 'react'
import * as ReactDOM from 'react-dom'
import ReactResizeDetector from 'react-resize-detector'
import { PageHeader, Layout, Input, Tooltip, Row, Col } from 'antd'
import { CloseCircleTwoTone } from '@ant-design/icons'
const { Content } = Layout
const { Search } = Input
import './Captures.css'

import { PacketSnifferStatus } from './components/PacketSnifferStatus'
import { PacketList } from '../../components/PacketList'
import { PacketDetails } from '../../components/PacketDetails'

import {
  IPacketNoPayload,
  IPacketWithPayload,
  requestPackets,
  requestPacketsByContent,
  requestPacketDetails
} from '../../net/api'
import { apiUtils } from '../../net/api/index'

const PACKETS_UPDATE_INTERVAL_MS = 30000
const RESIZE_DETECTOR_REFRESH_RATE_MS = 1250

export class Captures extends React.Component<{}, IState> {
  private m_ContentRef: React.Component | null = null
  private m_TimeoutID?: NodeJS.Timeout

  state = {
    query: '',
    tableHeight: 0,
    lastTimestamp: 0,
    packets: [],
    packetsProtocols: [],
    filteredPackets: null,
    filteredPacketsProtocols: null,
    focusedPacketLoading: false,
    focusedPacketDimensions: { height: 0, width: 0 },
    focusedPacket: null as IPacketWithPayload | null
  }

  render(): JSX.Element {
    const {
      query,
      tableHeight,
      packets,
      packetsProtocols,
      filteredPackets,
      filteredPacketsProtocols,
      focusedPacketLoading,
      focusedPacketDimensions,
      focusedPacket
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
          <Layout className='Captures-container'>
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

            <Content
              className='Captures-content'
              ref={ref => { this.m_ContentRef = ref }}
            >
              <Row>
                <Col span={9}>
                  <PacketList
                    height={tableHeight}
                    packets={filteredPackets !== null ? filteredPackets!! : packets}
                    protocols={filteredPacketsProtocols !== null ? filteredPacketsProtocols!! : packetsProtocols}
                    onRowPress={this.fetchPacketDetails}
                  />
                </Col>
                <Col span={15} style={{ paddingLeft: 40 }}>
                  <PacketDetails
                    dimensions={focusedPacketDimensions}
                    loading={focusedPacketLoading}
                    packet={focusedPacket}
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
    const newFocusedPacketHeight = content.clientHeight
      - 98 // Card header

    this.setState((_, __) => ({
      tableHeight: newTableHeight,
      focusedPacketDimensions: {
        height: newFocusedPacketHeight,
        width: content.clientWidth
      }
    }))
  }

  /**
   * Data fetching-related methods
   */
  async componentDidMount() {
    await this.fetchPackets()
    this.m_TimeoutID = setInterval(async () => await this.fetchPackets(), PACKETS_UPDATE_INTERVAL_MS) as NodeJS.Timeout
  }

  componentWillUnmount() {
    // Stop fetching packets
    if (this.m_TimeoutID) clearInterval(this.m_TimeoutID)
  }

  private fetchPackets = async (): Promise<void> => {
    const { lastTimestamp, packets, packetsProtocols } = this.state
    const {
      packets: fetchedPackets,
      unique_protocols: fetchedUniqueProtocols
    } = await requestPackets(lastTimestamp)

    // Find the timestamp of the latest packet
    const newTimestamp = fetchedPackets.length > 0
      ? Math.max(...fetchedPackets.map(packet => packet.start_time))
      : lastTimestamp

    // Merge current and fetched packets
    const updatedPackets = apiUtils.mergeStreams(packets, fetchedPackets)

    // Extract unique protocols
    const updatedPacketsProtocols = apiUtils.mergeProtocols(packetsProtocols, fetchedUniqueProtocols)

    this.setState((_, __) => ({
      lastTimestamp: newTimestamp,
      packets: updatedPackets,
      packetsProtocols: updatedPacketsProtocols
    }))
  }

  private fetchPacketDetails = (packet: IPacketNoPayload): void => {
    // Skip if details for the requested packet have already been rendered
    if (this.state.focusedPacket?.rowid === packet.rowid) return

    this.setState((_, __) => ({ focusedPacketLoading: true, focusedPacket: null }), () => {
      requestPacketDetails(packet.rowid)
        .then(packetDetails => {
          this.setState((_, __) => ({
            focusedPacketLoading: false,
            focusedPacket: packetDetails
          }))
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

    requestPacketsByContent(query)
      .then(({ packets, unique_protocols: uniqueProtocols }) => {
        this.setState((_, __) => ({
          filteredPackets: packets,
          filteredPacketsProtocols: uniqueProtocols
        }))
      })
  }

  private onSearchReset = (): void => {
    this.setState((_, __) => ({
      query: '',
      filteredPackets: null,
      filteredPacketsProtocols: null
    }))
  }
}

interface IState {
  query: string
  tableHeight: number
  lastTimestamp: number
  packets: IPacketNoPayload[]
  packetsProtocols: string[]
  filteredPackets: IPacketNoPayload[] | null
  filteredPacketsProtocols: string[] | null
  focusedPacketLoading: boolean
  focusedPacketDimensions: { height: number, width: number }
  focusedPacket: IPacketWithPayload | null
}
