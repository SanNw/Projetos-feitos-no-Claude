// Banco em memória para todos os testes — nunca toca server/data/cache.sqlite.
process.env.CACHE_DB_PATH = ":memory:";
