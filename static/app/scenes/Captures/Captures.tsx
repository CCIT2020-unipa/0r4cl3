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
    focusedPacketHeight: 0,
    focusedPacket: null as IPacketWithPayload | null
  }

  render(): JSX.Element {
    const { tableHeight, focusedPacketHeight, focusedPacket } = this.state

    return (
      <ReactResizeDetector
        handleHeight
        refreshRate={RESIZE_DETECTOR_REFRESH_RATE_MS}
        refreshMode='throttle'
        onResize={this.updateTableHeight}
      >
        {() => (
          <Layout className='Captures-container'>
            <Header>header</Header>

            <Content className='Captures-content' id='Captures-content'>
              <Row>
                <Col span={10}>
                  <PacketList
                    tableHeight={tableHeight}
                    onRowPress={this.fetchPacketDetails}
                  />
                </Col>
                <Col span={1} />
                <Col span={13}>
                  {
                    focusedPacket ? (
                      <PacketDetails
                        height={focusedPacketHeight}
                        packet={focusedPacket}
                      />
                    ) : (
                      null
                    )
                  }
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
        focusedPacketHeight: newFocusedPacketHeight
      }))
    }
  }

  private fetchPacketDetails = (packet: IPacketNoPayload): void => {
    // Skip if details for the requested packet have already been rendered
    if (this.state.focusedPacket?.rowid === packet.rowid) return

    requestPacketDetails(packet.rowid)
      .then(packetDetails => {
        this.setState((_, __) => ({ focusedPacket: packetDetails }))
      })
  }
}

interface IState {
  tableHeight: number
  focusedPacketHeight: number
  focusedPacket: IPacketWithPayload | null
}
