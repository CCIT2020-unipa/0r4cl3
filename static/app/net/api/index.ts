import { mergeStreams, mergeProtocols } from './utils'
export const apiUtils = { mergeStreams, mergeProtocols }

export const requestStreams = async (accessToken: string, timestamp: number): Promise<IStreamsResponse> =>
  (await fetch(`/api/streams?access_token=${accessToken}&after=${timestamp}`)).json()

export const requestStreamsByContent = async (accessToken: string, query: string, queryMode: QueryMode): Promise<IStreamsResponse> =>
  (await fetch(`/api/streams?access_token=${accessToken}&query=${query}&mode=${queryMode}`)).json()

export const requestStreamDetails = async (accessToken: string, streamID: number): Promise<IStreamWithPayload> =>
  (await fetch(`/api/streams/${streamID}?access_token=${accessToken}`)).json()

export const requestPacketSnifferStatus = async (accessToken: string): Promise<IPacketSnifferStatusResponse> =>
  (await fetch(`/api/sniffer/status?access_token=${accessToken}`)).json()

export const login = async (accessToken: string): Promise<boolean> => {
  const res = await fetch(`/api/auth/status?access_token=${accessToken}`)
  return res.status !== 401
}

type QueryMode =
  | 'fulltext'
  | 'regexp'

interface IStreamsResponse {
  streams: IStreamNoPayload[]
  protocols: string[]
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
