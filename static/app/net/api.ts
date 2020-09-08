export const requestPackets = async (currentTimestamp: number): Promise<ICapturesResponse> => {
  const res = await fetch(`/api/captures?after=${currentTimestamp}`, {
    method: 'GET'
  })

  return res.json()
}

export const requestPacketDetails = async (packetID: number): Promise<IPacketWithPayload> => {
  const res = await fetch(`/api/captures/${packetID}`, {
    method: 'GET'
  })

  return res.json()
}

export const queryPacketsContent = async (query: string): Promise<ICapturesResponse> => {
  const res = await fetch(`/api/captures?contains=${query}`, {
    method: 'GET'
  })

  return res.json()
}

interface ICapturesResponse {
  packets: IPacketNoPayload[]
  unique_protocols: string[]
}

export interface IPacketNoPayload {
  rowid: number
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
