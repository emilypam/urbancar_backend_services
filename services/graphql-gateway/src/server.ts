import express from 'express';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers/index.js';

const PORT = Number(process.env.PORT ?? 3008);

async function bootstrap() {
  const app = express();
  app.use(cors({ origin: '*' }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ service: 'graphql-gateway', status: 'ok' });
  });

  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req }) => {
        const auth = req.headers.authorization ?? '';
        const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
        return { token };
      },
    }),
  );

  app.listen(PORT, () => {
    console.log(`[graphql-gateway] GraphQL listo en http://localhost:${PORT}/graphql`);
  });
}

bootstrap().catch(console.error);
