const required = [
  'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME',
  'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET',
];

export function validateEnv(config: Record<string, unknown>) {
  const missing = required.filter((k) => !config[k]);
  if (missing.length) {
    throw new Error(`Variáveis de ambiente em falta: ${missing.join(', ')}. Copia .env.example para .env e preenche.`);
  }
  for (const k of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) {
    if (String(config[k]).length < 16) throw new Error(`${k} deve ter pelo menos 16 caracteres.`);
  }
  if (config.JWT_ACCESS_SECRET === config.JWT_REFRESH_SECRET) {
    throw new Error('JWT_ACCESS_SECRET e JWT_REFRESH_SECRET têm de ser diferentes.');
  }
  return config;
}
