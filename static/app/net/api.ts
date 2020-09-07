export const requestPackets = async (currentTimestamp: number): Promise<IPacket[]> => {
  const res = await fetch(`/api/captures?after=${currentTimestamp}`, {
    method: 'GET'
  })

  return res.json()
}

export interface IPacket {
  rowid: number
  start_time: number
  end_time: number
  protocol: string
  src_ip: string
  src_port: number
  dst_ip: string
  dst_port: number
  data_length: number
  data_bytes?: string
  data_hex?: string
}
