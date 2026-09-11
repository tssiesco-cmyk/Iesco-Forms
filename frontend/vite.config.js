import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const API_TARGET = process.env.VITE_API_TARGET || 'http://localhost:5080'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Las imagenes de fondo las sirve el backend desde wwwroot. Sin esto Vite
      // responderia su propio index.html y la imagen nunca cargaria.
      "/uploads": {
        target: API_TARGET,
        changeOrigin: true,
      },
      // Las llamadas a /api salen por el mismo origen que la app y Vite las
      // reenvia al backend. Asi no hay CORS en desarrollo, y el login usa
      // cookies HttpOnly sin configuracion extra.
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        configure: (proxy) => {
          // Sin esto, si el backend no esta arriba Vite responde con un error
          // suelto y la app muestra algo incomprensible. Preferimos un 503 con
          // el mismo formato de error que usa la API.
          proxy.on('error', (err, req, res) => {
            console.error(
              `\n  [proxy] No se pudo conectar con el backend en ${API_TARGET}` +
              `\n          Arrancalo con:  cd backend && dotnet run\n`
            )

            if (res.writeHead && !res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/problem+json' })
            }
            if (res.end) {
              res.end(JSON.stringify({
                title: 'Backend no disponible',
                status: 503,
                detail: `No se pudo conectar con el servidor en ${API_TARGET}. Arrancalo con "dotnet run" en la carpeta backend.`,
              }))
            }
          })
        },
      },
    },
  },
})
