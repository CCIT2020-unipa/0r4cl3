import * as React from 'react'
import ReactResizeDetector from 'react-resize-detector'
import { Layout, Row, Col } from 'antd'
const { Header, Content } = Layout
import './Captures.css'

import { PacketList } from '../../components/PacketList'
import { PacketDetails } from '../../components/PacketDetails'
  
import {
  IPacketNoPayload,
  IPacketWithPayload,
  requestPacketDetails
} from '../../net/api'

const RESIZE_DETECTOR_REFRESH_RATE_MS = 1250

export class Captures extends React.Component<{}, IState> {
  state = {
    tableHeight: 0,
    focusedPacketDimensions: {
      height: 0,
      width: 0
    },
    loadingPacket: false,
    focusedPacket: null as IPacketWithPayload | null
  }

  render(): JSX.Element {
    const {
      tableHeight,
      focusedPacketDimensions,
      focusedPacket,
      loadingPacket
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
            <Header>header</Header>

            <Content className='Captures-content' id='Captures-content'>
              <Row>
                <Col span={9}>
                  <PacketList
                    tableHeight={tableHeight}
                    onRowPress={this.fetchPacketDetails}
                  />
                </Col>
                <Col span={15} style={{ paddingLeft: 40 }}>
                  <PacketDetails
                    dimensions={focusedPacketDimensions}
                    loading={loadingPacket}
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

  private updateTableHeight = (): void => {
    // TODO: use react refs
    const content = document.getElementById('Captures-content')

    if (content) {
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
  }

  private fetchPacketDetails = (packet: IPacketNoPayload): void => {
    // Skip if details for the requested packet have already been rendered
    if (this.state.focusedPacket?.rowid === packet.rowid) return

    this.setState((_, __) => ({ loadingPacket: true, focusedPacket: null }), () => {
      requestPacketDetails(packet.rowid)
        .then(packetDetails => {
          this.setState((_, __) => ({
            focusedPacket: packetDetails,
            loadingPacket: false
          }))
        })
    })
  }
}

interface IState {
  tableHeight: number
  focusedPacketDimensions: {
    height: number
    width: number
  }
  loadingPacket: boolean
  focusedPacket: IPacketWithPayload | null
}
