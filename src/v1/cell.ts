import * as assert from 'assert'

export type Repository = Readonly<{
    id: symbol
    content: Content,
}>

export type Content = Readonly<{
    type: 'empty',
} | {
    type: 'constant',
    data: number,
} | {
    type: 'calculated',
    data: number,
    supplier: {
        cellId: symbol,
        constraintId: symbol,
        ruleId: symbol,
    },
}>

export const hasValue = ({ type }: Content): boolean => {
    return type === 'constant' || type === 'calculated'
}

export type Cell = Readonly<{
    id: symbol,
    repositoryId: symbol,
}>

const makeCell = (): [Cell, Repository] => {
    const repositoryId = Symbol()

    return [
        {
            id: Symbol(),
            repositoryId,
        }, {
            id: repositoryId,
            content: {
                type: 'empty',
            },
        },
    ]
}

export const constant = (n: number): [Cell, Repository] => {
    const [cell, repo] = makeCell()

    return [
        cell,
        {
            ...repo,
            content: {
                type: 'constant',
                data: n,
            },
        },
    ]
}

export const variable = (): [Cell, Repository] => {
    return makeCell()
}

export const mergeRepositories = (aRepo: Repository, bRepo: Repository, ancestorRepo?: Repository): Repository => {
    const content: Content = (() => {
        if (hasValue(aRepo.content) && hasValue(bRepo.content)) {
            assert((aRepo.content as any).data === (bRepo.content as any).data)

            return ancestorRepo?.content || aRepo.content
        } else if (hasValue(aRepo.content)) {
            return aRepo.content
        } else if (hasValue(bRepo.content)) {
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
