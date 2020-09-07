import * as React from 'react'
import {
  BrowserRouter,
  Switch,
  Route
} from 'react-router-dom'

import { Captures } from './scenes/Captures'

export const App: React.SFC = () => (
  <BrowserRouter>
    <Switch>
      <Route path='/captures'>
        <Captures />
      </Route>
      <Route path='/'>
        <h1>I mean, hi</h1>
      </Route>
    </Switch>
  </BrowserRouter>
)
