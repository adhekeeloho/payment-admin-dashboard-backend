import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { apiRouter } from './routes';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middleware/errorHandler';

const swaggerHtml = `<!DOCTYPE html>
<html>
  <head>
    <title>Payment Admin API Docs</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = function() {
        SwaggerUIBundle({
          url: "/api/openapi.json",
          dom_id: '#swagger-ui',
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          layout: "StandaloneLayout"
        });
      };
    </script>
  </body>
</html>`;

export const createApp = () => {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", 'https://unpkg.com', "'unsafe-inline'"],
          styleSrc: ["'self'", 'https://unpkg.com', "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https://unpkg.com'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", 'https://unpkg.com'],
        },
      },
    })
  );
  app.use(cors());
  app.use(morgan('dev'));
  app.use(express.json());

  app.get('/', (_req, res) => res.redirect('/docs'));
  app.get('/docs', (_req, res) => res.send(swaggerHtml));
  app.get('/api/openapi.json', (_req, res) => res.json(swaggerSpec));
  app.use('/api', apiRouter);

  app.use(errorHandler);

  return app;
};
