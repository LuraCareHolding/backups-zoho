### BACKUPS ZOHO
Zoho CRM Backup Service

Este servicio en NestJS permite solicitar, descargar y subir automáticamente los backups de Zoho CRM a Google Drive.
Actualmente soporta tres regiones configuradas: spain, uk e italy.

Autenticación

Todas las peticiones requieren pasar la API Key como query param:
?apiKey=zohoBackupSecretKey2025

La API Key está definida en la variable de entorno API_KEY=zohoBackupSecretKey2025.

Endpoints principales

Solicitar un backup (request)
Pide a Zoho que genere un backup nuevo para una región.
Ejemplo para España:

curl -X POST "http://localhost:3007/backup/request?apiKey=zohoBackupSecretKey2025" \
  -H "Content-Type: application/json" \
  -d '{"region":"spain"}'


Descargar y subir un backup (download)
Descarga el último backup disponible de Zoho y lo sube a Google Drive.

curl -X POST "http://localhost:3007/backup/download?apiKey=zohoBackupSecretKey2025" \
  -H "Content-Type: application/json" \
  -d '{"region":"spain"}'


Descargar y subir todos los backups (download/all)
Ejecuta el proceso para todas las regiones configuradas.

curl -X POST "http://localhost:3007/backup/download/all?apiKey=zohoBackupSecretKey2025" \
  -H "Content-Type: application/json" \
  -d '{"outputDir":"temp_backups"}'


El parámetro outputDir es opcional. Por defecto es temp_backups.

Estado del servicio (status)
Comprueba si la API responde correctamente y muestra las regiones soportadas.

curl -X GET "http://localhost:3007/backup/status?apiKey=zohoBackupSecretKey2025"
