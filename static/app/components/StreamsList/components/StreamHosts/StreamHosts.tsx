import * as React from 'react'
import { Row, Col, Tag } from 'antd'

import { IReconstructedStream } from '../../../../net/api'

// TODO: join Hosts and StreamHosts components
export const StreamHosts: React.SFC<IProps> = ({ stream }) => (
  <Row>
    <Col span={11}>
      <Row>
        <Col span={16}>{stream.src_ip}</Col>
        <Col span={8}>
          <Tag color='blue'>{stream.src_port}</Tag>
        </Col>
      </Row>
    </Col>
    <Col span={2}>⇋</Col>
    <Col span={11}>
      <Row>
        <Col span={16}>{stream.dst_ip}</Col>
        <Col span={8}>
          <Tag color='blue'>{stream.dst_port}</Tag>
        </Col>
      </Row>
    </Col>
  </Row>
)

interface IProps {
  stream: IReconstructedStream
}
