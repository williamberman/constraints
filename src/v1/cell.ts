import * as assert from 'assert'

export type Repository = Readonly<{
    id: symbol
    content: Content,
}>

type Content = Readonly<{
    bound: true,
    data: number,
} | {
    bound: false,
}>

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
                bound: false,
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
                bound: true,
                data: n,
            },
        },
    ]
}

export const variable = (): [Cell, Repository] => {
    return makeCell()
}

export const merge = (aRepo: Repository, bRepo: Repository): Repository => {
    const content: Content = (() => {
        if (aRepo.content.bound && bRepo.content.bound) {
            assert(aRepo.content.data === bRepo.content.data)

            // Could return either
            return aRepo.content
        } else if (aRepo.content.bound) {
            return aRepo.content
        } else if (bRepo.content.bound) {
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
