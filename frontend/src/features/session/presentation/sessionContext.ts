import { createActorContext } from '@xstate/react'
import { sessionMachine } from './sessionMachine'

export const SessionActorContext = createActorContext(sessionMachine)
