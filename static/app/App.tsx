import * as React from 'react'
import {
  BrowserRouter,
  Switch,
  Route
} from 'react-router-dom'

import { Streams } from './scenes/Streams'

export const App: React.SFC = () => (
  <BrowserRouter>
    <Switch>
      <Route path='/streams'>
        <Streams />
      </Route>
      <Route path='/'>
        <h1>I mean, hi</h1>
      </Route>
    </Switch>
  </BrowserRouter>
)
