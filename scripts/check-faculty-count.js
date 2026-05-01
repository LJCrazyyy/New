const { connectToDatabase } = require('../lib/database')
const { User, FacultyProfile } = require('../lib/system-models')

async function main() {
  await connectToDatabase()
  const users = await User.countDocuments({ role: 'faculty' })
  const profiles = await FacultyProfile.countDocuments()
  const profiled = await FacultyProfile.find().limit(20).populate('user').lean()
  console.log('faculty users', users)
  console.log('faculty profiles', profiles)
  console.log('sample profiles', profiled.map(p => ({ id: p._id.toString(), user: p.user?.name, employeeNumber: p.employeeNumber })))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
