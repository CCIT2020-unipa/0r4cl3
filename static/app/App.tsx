import * as React from 'react'

import { StreamsStore } from './store'

import { Auth } from './scenes/Auth'
import { Streams } from './scenes/Streams'

const streamsStore = new StreamsStore()
export const StreamsStoreContext = React.createContext(streamsStore)

const STREAMS_UPDATE_INTERVAL_MS = 30000
const STATUS_UPDATE_INTERVAL_MS = 10000

export class App extends React.Component {
  private m_FetchStreamsTimeoutID?: number
  private m_FetchStatusTimeoutID?: number

  render() {
    return (
      <StreamsStoreContext.Provider value={streamsStore}>
        {/* TODO: restore authentication support */}
        <Streams />
      </StreamsStoreContext.Provider>
    )
  }

  componentDidMount() {
    streamsStore.fetchUnfilteredStreams()
    streamsStore.fetchPacketSnifferStatus()

    this.m_FetchStreamsTimeoutID = window.setInterval(streamsStore.fetchUnfilteredStreams, STREAMS_UPDATE_INTERVAL_MS)
    this.m_FetchStatusTimeoutID = window.setInterval(streamsStore.fetchPacketSnifferStatus, STATUS_UPDATE_INTERVAL_MS)
  }

  componentWillUnmount() {
    if (this.m_FetchStreamsTimeoutID) window.clearInterval(this.m_FetchStreamsTimeoutID)
    if (this.m_FetchStatusTimeoutID) window.clearInterval(this.m_FetchStatusTimeoutID)
  }
}
