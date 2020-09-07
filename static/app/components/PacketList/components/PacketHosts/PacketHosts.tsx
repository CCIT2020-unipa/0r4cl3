import * as React from 'react'
import { Row, Col, Tag } from 'antd'

import { IPacketNoPayload } from '../../../../net/api'

export const PacketHosts: React.SFC<IProps> = ({ packet }) => (
  <Row>
    <Col span={11}>
      <Row>
        <Col span={6}>{packet.src_ip}</Col>
        <Col span={18}>
          <Tag color='blue'>{packet.src_port}</Tag>
        </Col>
      </Row>
    </Col>
    <Col span={2}>⭢</Col>
    <Col span={11}>
      <Row>
        <Col span={6}>{packet.dst_ip}</Col>
        <Col span={18}>
          <Tag color='blue'>{packet.dst_port}</Tag>
        </Col>
      </Row>
    </Col>
  </Row>
)

interface IProps {
  packet: IPacketNoPayload
}
