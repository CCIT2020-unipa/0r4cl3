import { observable, computed, action } from 'mobx'

import { showError } from '../components/Notification'

import {
  IReconstructedStream,
  IStreamDetailsResponse,
  QueryMode,
  requestStreams,
  requestStreamsByContent,
  requestStreamDetails,
  requestPacketSnifferStatus,
  apiUtils
} from '../net/api'

export class StreamsStore {
  // TODO: restore authentication support
  @observable public accessToken: string = 'epic'

  @observable public areUnfilteredStreamsLoading: boolean = false
  @observable public unfilteredStreams: IReconstructedStream[] = []
  @observable public unfilteredStreamsProtocols: string[] = []

  @observable public areFilteredStreamsLoading: boolean = false
  @observable public filteredStreams: IReconstructedStream[] | null = null
  @observable public filteredStreamsProtocols: string[] | null = null

  @observable public areStreamDetailsLoading: boolean = false
  @observable public streamDetails: IStreamDetailsResponse | null = null

  @observable public packetSnifferOnline: boolean = false

  @computed get lastTimestamp() {
    return this.unfilteredStreams.length > 0
      ? Math.max(...this.unfilteredStreams.map(stream => stream.last_updated))
      : 0
  }

  @action public fetchUnfilteredStreams = async (): Promise<void> => {
    this.areUnfilteredStreamsLoading = true

    try {
      const { streams, protocols } = await requestStreams(this.accessToken, this.lastTimestamp)

      // Merge current and fetched streams and protocols
      this.unfilteredStreams = apiUtils.mergeStreams(this.unfilteredStreams, streams)
      this.unfilteredStreamsProtocols = apiUtils.mergeProtocols(this.unfilteredStreamsProtocols, protocols)
    } catch {
      showError(
        'Cannot connect to 0r4cl3 server',
        'Make sure you are connected to the internet and the server is up and running'
      )
    }

    this.areUnfilteredStreamsLoading = false
  }

  @action public fetchFilteredStreams = async (query: string, queryMode: QueryMode): Promise<void> => {
    // Skip if query is empty
    if (query.length === 0) return

    this.areFilteredStreamsLoading = true

    try {
      const { streams, protocols } = await requestStreamsByContent(this.accessToken, query, queryMode)

      this.filteredStreams = streams
      this.filteredStreamsProtocols = protocols
    } catch {
      showError(
        'Cannot connect to 0r4cl3 server',
        'Make sure you are connected to the internet and the server is up and running'
      )
    }

    this.areFilteredStreamsLoading = false
  }

  @action public resetFilteredStreams = (): void => {
    this.filteredStreams = null
    this.filteredStreamsProtocols = null
  }

  @action public fetchStreamDetails = async (streamNumber: number): Promise<void> => {
    this.areStreamDetailsLoading = true
    this.streamDetails = null

    try {
      this.streamDetails = await requestStreamDetails(this.accessToken, streamNumber)
    } catch {
      showError(
        'Cannot connect to 0r4cl3 server',
        'Make sure you are connected to the internet and the server is up and running'
      )
    }

    this.areStreamDetailsLoading = false
  }

  @action public fetchPacketSnifferStatus = async (): Promise<void> => {
    try {
      this.packetSnifferOnline = (await requestPacketSnifferStatus(this.accessToken)).online
    } catch {
      this.packetSnifferOnline = false
    }
  }
}
