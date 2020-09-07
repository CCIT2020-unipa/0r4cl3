export const requestPackets = async (currentTimestamp: number): Promise<ICapturesResponse> => {
  const res = await fetch(`/api/captures?after=${currentTimestamp}`, {
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
  src_ip: string
  src_port: number
  dst_ip: string
  dst_port: number
  data_length: number
  data_length_string: string
}

export interface IPacketWithPayload extends IPacketNoPayload {
  data_bytes: string
  data_hex: string
}
