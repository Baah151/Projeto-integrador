import dotenv from 'dotenv';

dotenv.config();

export const jwtConfig = {
  secret: process.env.JWT_SECRET ?? 'altere_esta_chave_em_producao',
  expiresIn: process.env.JWT_EXPIRE ?? '24h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE ?? '7d',
};
