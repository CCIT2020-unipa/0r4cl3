import { mergeStreams, mergeProtocols } from './utils'
export const apiUtils = { mergeStreams, mergeProtocols }

export const requestStreams = async (timestamp: number): Promise<IStreamsResponse> =>
  (await fetch(`/api/streams?after=${timestamp}`)).json()

export const requestStreamsByContent = async (query: string): Promise<IStreamsResponse> =>
  (await fetch(`/api/streams?contains=${query}`)).json()

export const requestStreamDetails = async (streamID: number): Promise<IStreamWithPayload> =>
  (await fetch(`/api/streams/${streamID}`)).json()

export const requestPacketSnifferStatus = async (): Promise<IPacketSnifferStatusResponse> =>
  (await fetch('/api/sniffer/status')).json()

interface IStreamsResponse {
  streams: IStreamNoPayload[]
  unique_protocols: string[]
}

interface IPacketSnifferStatusResponse {
  online: boolean
}

export interface IStreamNoPayload {
  rowid: number
  stream_no: number
  start_time: number
  end_time: number
  protocol: string
  host_a_ip: string
  host_a_port: number
  host_b_ip: string
  host_b_port: number
  data_length: number
  data_length_string: string
}

export interface IStreamWithPayload extends IStreamNoPayload {
  data_printable: string
}
