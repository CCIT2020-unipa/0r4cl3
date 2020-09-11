import * as React from 'react'
import { Row, Col, Tag } from 'antd'

import { IStreamNoPayload } from '../../../../net/api'

export const StreamHosts: React.SFC<IProps> = ({ stream }) => (
  <Row>
    <Col span={11}>
      <Row>
        <Col span={16}>{stream.host_a_ip}</Col>
        <Col span={8}>
          <Tag color='blue'>{stream.host_a_port}</Tag>
        </Col>
      </Row>
    </Col>
    <Col span={2}>⇋</Col>
    <Col span={11}>
      <Row>
        <Col span={16}>{stream.host_b_ip}</Col>
        <Col span={8}>
          <Tag color='blue'>{stream.host_b_port}</Tag>
        </Col>
      </Row>
    </Col>
  </Row>
)

interface IProps {
  stream: IStreamNoPayload
}
