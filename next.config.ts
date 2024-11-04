/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ez fontos, enélkül nem compileol.
  serverExternalPackages: ['ssh2'],
}
 
module.exports = nextConfig