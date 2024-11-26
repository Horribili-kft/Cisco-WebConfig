/** @type {import('next').NextConfig} */
const nextConfig: import('next').NextConfig = {
  // Ez fontos, enélkül nem compileol.
  serverExternalPackages: ['ssh2'],
  // Dependencyket hozza magával. Teljes standalone, kisebb méret.
  // Csak akkor használd ezt, ha image-t építesz
  output: 'standalone'

}

module.exports = nextConfig