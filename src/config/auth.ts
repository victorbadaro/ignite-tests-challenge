export default {
  jwt: {
    secret: process.env.NODE_ENV === 'test' ? 'anysecretkey' : process.env.JWT_SECRET as string,
    expiresIn: '1d'
  }
}
