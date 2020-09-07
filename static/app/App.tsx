import * as React from 'react'
import ReactResizeDetector from 'react-resize-detector'
import { Layout } from 'antd'
const { Header, Content } = Layout
import './App.css'

import { PacketList } from './components/PacketList'

const RESIZE_DETECTOR_REFRESH_RATE_MS = 2000

export class App extends React.Component<{}, IState> {
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
          <Layout className='App-container'>
            <Header>header</Header>

            <Content className='App-content' id='App-content'>
              <PacketList tableHeight={tableHeight} />
            </Content>
          </Layout>
        )}
      </ReactResizeDetector>
    )
  }

  private updateTableHeight = (): void => {
    // Remove top and bottom margin
    // TODO: use react refs
    const appContentElement = document.getElementById('App-content')

    if (appContentElement) {
      const newTableHeight = appContentElement.clientHeight - 48
      this.setState((_, __) => ({ tableHeight: newTableHeight }))
    }
  }
}

interface IState {
  tableHeight: number
}
