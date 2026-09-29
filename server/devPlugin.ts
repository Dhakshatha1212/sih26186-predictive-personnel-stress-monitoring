import express from 'express';
import { Plugin } from 'vite';
import { apiRouter } from './api.ts';

export function expressApiPlugin(): Plugin {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/api', apiRouter);

  return {
    name: 'express-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && (req.url === '/api' || req.url.startsWith('/api/'))) {
          (app as any)(req, res, next);
        } else {
          next();
        }
      });
    },
  };
}
