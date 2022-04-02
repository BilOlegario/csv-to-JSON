const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
let header = []
let parsed = []
const treatments = {}

function groupTreatment(acc, val) {
    return [
        ...(acc.group || []),
        ...((val || '').match(/\w+ \d/g) || [])
    ]
}

function phoneTreatment(val) {
    return [...(val || '').match(/(\(?\d{2}\)?\s)?(\d{4,7}(\-)*\d{4})/g) || []]
}

function emailTreatment(val) {
    let emailArr = []
    let treatedEmail = val.trim().replace('/', ' ').split(' ')
    for (const email of treatedEmail) {
        const emailMatch = (email || '').match(/^[\w-.]+@([\w-]+.)+[\w-]{2,4}$/g)
        const validEmail = emailMatch == null ? emailMatch : emailMatch[0]
        emailArr.push(validEmail)
    }
    return emailArr.filter(x => x != null)
}

function concatElements(list) {
    const output = {}
    for (const element of list) {
        if (Object.values(output).length == 0) {
            output[element.eid] = {
                ...element,
            };
            continue
        }
        if (output[element.eid]) {
            output[element.eid].group = [...new Set(output[element.eid].group.concat(element.group))]
            output[element.eid].addresses = [...new Set(output[element.eid].addresses.concat(element.addresses))]
        } else {
            output[element.eid] = {
                ...element,
            };
        }
    }
    return Object.values(output);
}

function useData(arr) {
    const outputJSON = concatElements(arr)
    const data = JSON.stringify(outputJSON)
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
                                val = phoneTreatment(val)
                            }
                            else if (type == 'email') {
                                val = emailTreatment(val)
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
                                acc.group = groupTreatment(acc, val)
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
data_(useData);