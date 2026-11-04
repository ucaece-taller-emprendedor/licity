/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  // Rutas anteriores a la estandarización: se conservan como redirecciones permanentes.
  async redirects() {
    return [
      { source: '/ingresar', destination: '/app/ingresar', permanent: true },
      { source: '/registro', destination: '/app/registro', permanent: true },
      { source: '/registro/pyme', destination: '/app/registro/pyme', permanent: true },
      { source: '/registro/contratista', destination: '/app/registro/contratista', permanent: true },
      { source: '/recuperar', destination: '/app/recuperar', permanent: true },
      { source: '/entrar', destination: '/app', permanent: true },
      { source: '/client', destination: '/app/pyme', permanent: true },
      { source: '/client/:path*', destination: '/app/pyme/:path*', permanent: true },
      { source: '/business', destination: '/app/contratista', permanent: true },
      { source: '/business/:path*', destination: '/app/contratista/:path*', permanent: true },
    ]
  },
}

export default nextConfig
