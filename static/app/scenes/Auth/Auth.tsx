import * as React from 'react'
import { Row, Col, Form, Input, Button } from 'antd'
import './Auth.css'

import { showNotification, showError } from '../../components/Notification'

import { login } from '../../net/api'

const authenticateUser = async (accessToken: string, setAccessToken: (accessToken: string) => void): Promise<void> => {
  try {
    const authenticated = await login(accessToken)

    if (authenticated) {
      setAccessToken(accessToken)
    } else {
      showNotification('Invalid access token!', 'Make sure you entered the correct one')
    }
  } catch {
    showError(
      'Cannot connect to 0r4cl3 server',
      'Make sure you are connected to the internet and the server is up and running'
    )
  }
}

export const Auth: React.FC<IProps> = ({ setAccessToken }) => (
  <Row className='Auth-container'>
    <Col span={8} />
    <Col className='Auth-content' span={8}>
      <Form
        layout='vertical'
        className='Auth-content_form'
        onFinish={({ accessToken }) => authenticateUser(accessToken, setAccessToken)}
      >
        <Form.Item
          name='accessToken'
          label='Access Token'
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item>
          <Button type='primary' htmlType='submit'>Authenticate</Button>
        </Form.Item>
      </Form>
    </Col>
    <Col span={8} />
  </Row>
)

interface IProps {
  setAccessToken: (accessToken: string) => void
}
