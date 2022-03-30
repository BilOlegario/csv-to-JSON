const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const header = []
const parsed = []
const tratamentos = {}

function tratamentoGrupo(acc, val) {
    return [
        ...(acc.group || []),
        ...((val || '').match(/\w+ \d/g) || [])
    ]
}

function tratamentoTelefone(acc, val) {
    /(\(?\d{2}\)?\s)?(\d{4,7}(\-)*\d{4})/g
}

fs.createReadStream(path.resolve(__dirname, 'input.csv'))
    .pipe(csv.parse({}))
    .on('error', error => console.error(error))
    .on('data', row => {
        if (!header.length) {
            header.push(...row)
        } else {
            parsed.push(
                row.reduce((acc, val, i) => {
                    if (header[i].split(' ').length > 1) {
                        const [type, ...tags] = header[i].split(" ")
                        acc.addresses = [
                            ...(acc.addresses || []),
                            { type, tags, address: val }
                        ]
                    } else {
                        if (header[i] == 'group') {
                            acc.group = tratamentoGrupo(acc, val)
                        } else {
                            acc[header[i]] = val
                        }
                    }
                    return acc
                }, {})
            )
            console.log(parsed)
        }
    })
    .on('end', rowCount => console.log(`Parsed ${rowCount} rows`, parsed));