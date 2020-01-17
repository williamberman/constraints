import { List } from 'immutable'

import { Cell } from './cell'
import { Network } from './network/network'
import { ensureGet } from './utils'

export type DataFlow = Readonly<{
    cellId: symbol,
    children: List<any>, // TODO
}>

export const makeDataFlow = (cell: Cell, network: Network) => {
    const repo = ensureGet(network.repositories, cell.repositoryId)
    const children = (() => {
        switch (repo.content.type) {
            case ('empty'): {
                return List()
            }
            case ('constant'): {
                return List()
            }
            case ('calculated'): {
                return List()
            }
        }
    })()

    return {
        cellId: cell.id,
        children,
    }
}
