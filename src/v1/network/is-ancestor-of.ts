import { Cell } from '../cell'
import { Network } from './network'

export const isAncestorOf = ({
}: {
    isAncestor: Cell,
    of: Cell,
    network: Network,
}): boolean => {
    return false
}
