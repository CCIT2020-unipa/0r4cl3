import * as React from 'react'
import { Row, Col, Tag } from 'antd'

import { IProps } from '../../Hosts'

export const GridAlignedHosts: React.FC<IProps> = ({ srcIP, srcPort, dstIP, dstPort }) => (
  <Row>
    <Col span={11}>
      <Row>
        <Col span={16}>{srcIP}</Col>
        <Col span={8}>
          <Tag color='blue'>{srcPort}</Tag>
        </Col>
      </Row>
    </Col>
    <Col span={2}>⇋</Col>
    <Col span={11}>
      <Row>
        <Col span={16}>{dstIP}</Col>
        <Col span={8}>
          <Tag color='blue'>{dstPort}</Tag>
        </Col>
      </Row>
    </Col>
  </Row>
)
