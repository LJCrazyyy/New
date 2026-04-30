const fs = require('fs')
const body = fs.readFileSync('temp_user.json', 'utf8')

fetch('http://localhost:3000/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body,
})
  .then(async (res) => {
    const text = await res.text()
    console.log(text)
    process.exit(res.ok ? 0 : 1)
  })
  .catch((err) => {
    console.error('ERROR', err)
    process.exit(1)
  })
