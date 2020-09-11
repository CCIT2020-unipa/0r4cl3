import * as React from 'react'
import './StreamPrintable.css'

import { IStreamWithPayload } from '../../../../net/api'

export const StreamPrintable: React.SFC<IProps> = ({ stream }) => (
  <pre className='StreamPrintable-content'>
    {stream.data_printable}
  </pre>
)

interface IProps {
  stream: IStreamWithPayload
}
