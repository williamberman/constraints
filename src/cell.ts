import { List } from 'immutable'

export type Repository = Readonly<{
    id: symbol,
    content: Content,
}>

export type Content = Readonly<{
    type: 'empty',
} | {
    type: 'constant',
    data: number,
    supplier: {
        cellId: symbol,
    },
} | {
    type: 'inconsistency',
    suppliers: List<{
        data: number,
        supplier: {
            cellId: symbol,
        },
    }>,
}>

export type Cell = Readonly<{
    id: symbol,
    repositoryId: symbol,
    external: boolean,
}>

const makeCell = (name?: string): [Cell, Repository] => {
    const repositoryId = Symbol()

    return [
        {
            id: Symbol(name),
            repositoryId,
            external: false,
        }, {
            id: repositoryId,
            content: {
                type: 'empty',
            },
        },
    ]
}

export const constant = (n: number, name?: string): [Cell, Repository] => {
    const [cell, repo] = makeCell(name)

    return [
        cell,
        {
            ...repo,
            content: {
                type: 'constant',
                data: n,
                supplier: {
                    cellId: cell.id,
                },
            },
        },
    ]
}

export const variable = (name?: string): [Cell, Repository] => {
    return makeCell(name)
}

export const mergeRepositories = (aRepo: Repository, bRepo: Repository, ancestorRepo?: Repository): Repository => {
    const content: Content = (() => {
        if (aRepo.content.type === 'constant' && bRepo.content.type === 'constant') {
            if (aRepo.content.data === bRepo.content.data) {
                return ancestorRepo?.content || aRepo.content
            } else {
                return {
                    type: 'inconsistency' as 'inconsistency',
                    suppliers: List([
                        {
                            data: aRepo.content.data,
                            supplier: aRepo.content.supplier,
                        },
                        {
                            data: bRepo.content.data,
                            supplier: bRepo.content.supplier,
                        },
                    ]),
                }
            }
        } else if (aRepo.content.type === 'constant') {
            return aRepo.content
        } else if (bRepo.content.type === 'constant') {
            return bRepo.content
        } else {
            // Could return either
            return aRepo.content
        }
    })()

    return {
        id: Symbol(),
        content,
    }
}
