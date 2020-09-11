import * as React from 'react'
import { Spin, Typography, Empty } from 'antd'
const { Text } = Typography
import './NoSelection.css'

export const NoSelection: React.SFC<IProps> = ({ height, loading }) => (
  <div style={{ height }} className='NoSelection-container'>
    {loading ? (
      <Spin size='large' />
    ) : (
      <>
        <Empty description={false} />
        <Text type='secondary'>
          Select a stream from the list on your left to show its details
        </Text>
      </>
    )}
  </div>
)

interface IProps {
  height: number
  loading: boolean
}
