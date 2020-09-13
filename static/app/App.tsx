import * as React from 'react'

import { Auth } from './scenes/Auth'
import { Streams } from './scenes/Streams'

export const App: React.FC = () => {
  const [accessToken, setAccessToken] = React.useState<string | null>(null)

  return accessToken === null
    ? <Auth setAccessToken={accessToken => setAccessToken(accessToken)} />
    : <Streams accessToken={accessToken} />
}
