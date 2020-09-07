import * as React from 'react'
import ReactResizeDetector from 'react-resize-detector'
import { Layout } from 'antd'
const { Header, Content } = Layout
import './Captures.css'

import { PacketList } from '../../components/PacketList'

const RESIZE_DETECTOR_REFRESH_RATE_MS = 1250

export class Captures extends React.Component<{}, IState> {
  state = {
    tableHeight: 0
  }

  render(): JSX.Element {
    const { tableHeight } = this.state

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
              <PacketList tableHeight={tableHeight} />
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

      this.setState((_, __) => ({ tableHeight: newTableHeight }))
    }
  }
}

interface IState {
  tableHeight: number
}
