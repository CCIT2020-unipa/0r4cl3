import * as React from 'react'
import { Typography, notification } from 'antd'
import { CloseOutlined, DisconnectOutlined } from '@ant-design/icons'
const { Title, Text } = Typography
import './Notification.css'

export const showNotification = (title: string, description?: string): void => {
  notification.open({
    placement: 'bottomRight',
    message: <Title level={5}>{title}</Title>,
    description: description ? <Text>{description}</Text> : undefined
  })
}

export const showError = (title: string, description: string): void => {
  notification.error({
    placement: 'bottomRight',
    className: 'Notification-error_container',
    message: <Title className='Notification-error_message' level={5}>{title}</Title>,
    description: <Text className='Notification-error_description'>{description}</Text>,
    icon: <DisconnectOutlined className='Notification-error_icon' />,
    closeIcon: <CloseOutlined className='Notification-error_icon' />
  })
}
