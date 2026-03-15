import webpush from 'web-push'

const publicKey  = process.env.VAPID_PUBLIC_KEY
const privateKey = process.env.VAPID_PRIVATE_KEY
const email      = process.env.VAPID_EMAIL

if (!publicKey)  throw new Error('Missing env var: VAPID_PUBLIC_KEY')
if (!privateKey) throw new Error('Missing env var: VAPID_PRIVATE_KEY')
if (!email)      throw new Error('Missing env var: VAPID_EMAIL')

webpush.setVapidDetails(email, publicKey, privateKey)

export { webpush }
