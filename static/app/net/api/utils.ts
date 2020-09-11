import { IPacketNoPayload } from '../api'

export const mergeStreams = (currentStreams: IPacketNoPayload[], newStreams: IPacketNoPayload[]): IPacketNoPayload[] => {
  const streams = [...currentStreams, ...newStreams]
  const result = new Map()

  streams.forEach(stream => {
    const { stream_no: streamNumber } = stream

    if (result.has(streamNumber)) {
      // Merge the two streams with the most recent data available from the API
      result.set(streamNumber, { ...result.get(streamNumber), ...stream })
    } else {
      // Register a new stream
      result.set(streamNumber, stream)
    }
  })

  return Array.from(result.values())
}

export const mergeProtocols = (currentProtocols: string[], newProtocols: string[]): string[] => {
  return Array.from(new Set([...currentProtocols, ...newProtocols]))
}
