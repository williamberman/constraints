import * as assert from 'assert'
import { Collection } from 'immutable'

export const ensureGet = <K, V>(col: Collection<K, V>, key: K): V => {
    assert(col.has(key))
    return col.get(key)!
}
