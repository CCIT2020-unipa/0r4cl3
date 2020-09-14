import * as React from 'react'
import { hexy } from 'hexy'
import './StreamHexdump.css'

import { IStreamFragment } from '../../../../net/api'

const computeWidth = (screenWidth: number): number => {
  if (screenWidth < 1200) {
    return 10
  } else if (screenWidth < 1550) {
    return 16
  } else if (screenWidth < 2000) {
    return 24
  } else {
    return 32
  }
}

export const StreamHexdump: React.SFC<IProps> = ({ width, streamFragments }) => (
  <pre className='StreamHexdump-content'>
    {/* TODO: restore hexdump */}
    {/* {hexy(stream.data_printable, { width: computeWidth(width) })} */}
  </pre>
)

interface IProps {
  width: number
  streamFragments: IStreamFragment[]
}
