import * as React from 'react'
import { Row, Col, Tag } from 'antd'

import { IPacketNoPayload } from '../../../../net/api'

export const PacketHosts: React.SFC<IProps> = ({ packet }) => (
  <Row>
    <Col span={11}>
      <Row>
        <Col span={16}>{packet.host_a_ip}</Col>
        <Col span={8}>
          <Tag color='blue'>{packet.host_a_port}</Tag>
        </Col>
      </Row>
    </Col>
    <Col span={2}>⇋</Col>
    <Col span={11}>
      <Row>
        <Col span={16}>{packet.host_b_ip}</Col>
        <Col span={8}>
          <Tag color='blue'>{packet.host_b_port}</Tag>
        </Col>
      </Row>
    </Col>
  </Row>
)

interface IProps {
  packet: IPacketNoPayload
}
