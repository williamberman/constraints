import { Cell } from '../cell'
import { ensureGet } from '../utils'
import { Network } from './network'

export const isAncestorOf = ({
    isAncestor,
    of,
    network,
}: {
    isAncestor: Cell,
    of: Cell,
    network: Network,
}): boolean => {
    if (isAncestor.id === of.id) {
        return true
    }

    const repo = ensureGet(network.repositories, (of.repositoryId))

    if (repo.content.type === 'empty' || repo.content.type === 'constant') {
        return false
    } else {
        const constraint = ensureGet(network.constraints, repo.content.supplier.constraintId)
        const constraintType = ensureGet(network.constraintTypes, constraint.constraintTypeId)
        const rule = ensureGet(constraintType.rules, repo.content.supplier.ruleId)

        return rule.input
            .map((idInConstraint) => ensureGet(constraint.cellMapping, idInConstraint))
            .map((cellId) => ensureGet(network.cells, cellId))
            .map((cell) => isAncestorOf({ isAncestor, of: cell, network }))
            .reduce((acc: boolean, cur) => acc || cur, false)
    }
}
