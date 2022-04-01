const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
let header = []
let parsed = []
const tratamentos = {}

function tratamentoGrupo(acc, val) {
    return [
        ...(acc.group || []),
        ...((val || '').match(/\w+ \d/g) || [])
    ]
}

function tratamentoTelefone(val) {
    return [...(val || '').match(/(\(?\d{2}\)?\s)?(\d{4,7}(\-)*\d{4})/g) || []]
}

function tratamentoEmail(val) {
    let emailArr = []
    let emailTratado = val.trim().replace('/', ' ').split(' ')
    for (let i = 0; i < emailTratado.length; i++) {
        const emailMatch = (emailTratado[i] || '').match(/^[\w-.]+@([\w-]+.)+[\w-]{2,4}$/g)
        const emailValido = emailMatch == null ? emailMatch : emailMatch[0]
        emailArr.push(emailValido)
    }
    return emailArr.filter(x => x != null)
}

function usarData(arr) {     
    const data = JSON.stringify(arr)
    fs.writeFileSync('output.json', data);
}

const data_ = (fn) => {
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
                        if (type == 'phone') {
                            val = tratamentoTelefone(val)
                        }
                        else if (type == 'email') {
                            val = tratamentoEmail(val)
                        }
                        if (val.length > 0) {
                            for (const input of val) {
                                acc.addresses = [
                                    ...(acc.addresses || []),
                                    { type, tags, address: input }
                                ]
                            }
                        }
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
        }
    })
    .on('end', () => {
        fn(parsed)
      })
}
data_(usarData);