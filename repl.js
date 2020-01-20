const {
    reset,
    constant,
    variable,
    create,
    the,
    setEqual,
    valueOf,
    why,
    whyUltimately,
    what,
    adder,
    multiplier,
    makeTemperatureNetwork
} = require('./dist/main.js')

const adderExample = () => {
    reset()

    let foo = variable('foo')
    let bar = variable('bar')
    let baz = variable('baz')

    let add = create(adder.id)

    setEqual(the(adder.cells.a, add), foo)
    setEqual(the(adder.cells.b, add), bar)
    setEqual(the(adder.cells.c, add), baz)

    valueOf(baz)

    setEqual(foo, constant(1))
    setEqual(bar, constant(2))

    valueOf(baz)

    what(baz, [foo, bar, baz])
}

const reverseAdderExample = () => {
    reset()

    let foo = variable('foo')
    let bar = variable('bar')
    let baz = variable('baz')

    let add = create(adder.id)

    setEqual(the(adder.cells.a, add), foo)
    setEqual(the(adder.cells.b, add), bar)
    setEqual(the(adder.cells.c, add), baz)

    valueOf(bar)

    setEqual(foo, constant(1))
    setEqual(baz, constant(3))

    valueOf(bar)

    what(bar, [foo, bar, baz])
}

const inconsistentAdderExample = () => {
    reset()

    let foo = variable('foo')
    let bar = variable('bar')
    let baz = variable('baz')

    let add = create(adder.id)

    setEqual(the(adder.cells.a, add), foo)
    setEqual(the(adder.cells.b, add), bar)
    setEqual(the(adder.cells.c, add), baz)

    valueOf(baz)

    // Both inconsistent values can coexist in network
    setEqual(foo, constant(1))
    setEqual(foo, constant(2))
    setEqual(bar, constant(2))

    valueOf(baz)

    // TODO need to handle side cases for value conversion
    // what(baz, [foo, bar, baz])
}

const centigradeToFarenheitExample = () => {
    reset()

    let { centigrade, farenheit } = makeTemperatureNetwork()

    setEqual(centigrade, constant(-40))

    valueOf(farenheit)

    what(farenheit, [farenheit, centigrade])
}

const farenheitToCentigradeExample = () => {
    reset()

    let { centigrade, farenheit } = makeTemperatureNetwork()

    setEqual(farenheit, constant(50))

    valueOf(centigrade)

    what(centigrade, [farenheit, centigrade])
}
