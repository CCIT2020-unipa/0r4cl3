export const requestPackets = async (currentTimestamp: number): Promise<ICapturesResponse> =>
  (await fetch(`/api/captures?after=${currentTimestamp}`)).json()

export const requestPacketsByContent = async (query: string): Promise<ICapturesResponse> =>
  (await fetch(`/api/captures?contains=${query}`)).json()

export const requestPacketDetails = async (packetID: number): Promise<IPacketWithPayload> =>
  (await fetch(`/api/captures/${packetID}`)).json()

export const requestPacketSnifferStatus = async (): Promise<IPacketSnifferStatusResponse> =>
  (await fetch('/api/captures/status')).json()

interface ICapturesResponse {
  packets: IPacketNoPayload[]
  unique_protocols: string[]
}

interface IPacketSnifferStatusResponse {
  online: boolean
}

export interface IPacketNoPayload {
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

export interface IPacketWithPayload extends IPacketNoPayload {
  data_printable: string
}
