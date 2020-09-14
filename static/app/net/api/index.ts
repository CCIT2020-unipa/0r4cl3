import { mergeStreams, mergeProtocols } from './utils'
export const apiUtils = { mergeStreams, mergeProtocols }

export const requestStreams = async (accessToken: string, timestamp: number): Promise<IStreamsResponse> =>
  (await fetch(`/api/streams?access_token=${accessToken}&after=${timestamp}`)).json()

export const requestStreamsByContent = async (accessToken: string, query: string, queryMode: QueryMode): Promise<IStreamsResponse> =>
  (await fetch(`/api/streams?access_token=${accessToken}&query=${query}&mode=${queryMode}`)).json()

export const requestStreamDetails = async (accessToken: string, streamNumber: number): Promise<IStreamDetailsResponse> =>
  (await fetch(`/api/streams/${streamNumber}?access_token=${accessToken}`)).json()

export const requestPacketSnifferStatus = async (accessToken: string): Promise<IPacketSnifferStatusResponse> =>
  (await fetch(`/api/sniffer/status?access_token=${accessToken}`)).json()

export const login = async (accessToken: string): Promise<boolean> => {
  const res = await fetch(`/api/auth/status?access_token=${accessToken}`)
  return res.status !== 401
}

type QueryMode =
  | 'fulltext'
  | 'regexp'

export interface IReconstructedStream {
  stream_no: number
  last_updated: number
  protocol: string
  src_ip: string
  src_port: string
  dst_ip: string
  dst_port: string
  size: number
  size_str: string
}

export interface IStreamFragment {
  timestamp: number
  src_ip: string
  src_port: string
  dst_ip: string
  dst_port: string
  data: string
}

interface IStreamsResponse {
  streams: IReconstructedStream[]
  protocols: string[]
}

export interface IStreamDetailsResponse {
  stream: IReconstructedStream
  fragments: IStreamFragment[]
}

interface IPacketSnifferStatusResponse {
  online: boolean
}
